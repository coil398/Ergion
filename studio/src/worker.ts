import init, { ConstantAccelerationSimulation, PositionDerivativeSimulation, UniformSimulation } from '../wasm/ergion_lab.js';
import wasmUrl from '../wasm/ergion_lab_bg.wasm?url';
import type { Batch, Command, Reply, Snapshot, Update } from './protocol';

interface RunningSimulation {
  snapshot(): string;
  advance(steps: number): string;
  free(): void;
}

// 初期化失敗もメッセージに応答して返す。未処理のPromise rejectionにしない。
const initialized = init({ module_or_path: wasmUrl }).then(() => null, (error: unknown) => error);
let simulation: RunningSimulation | undefined;
let currentId = 0;
let batchSize = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;

function stop() {
  running = false;
  clearTimeout(timer);
  timer = undefined;
}
function send(reply: Reply) { postMessage(reply); }
function publish(phase: Update['phase'], samples: Snapshot[] = []) {
  const state = JSON.parse(simulation!.snapshot()) as Snapshot;
  send({ id: currentId, phase: state.finished ? 'finished' : phase, state, samples });
}
function advance(steps: number, phase: Update['phase']) {
  const batch = JSON.parse(simulation!.advance(steps)) as Batch;
  if (batch.state.finished) stop();
  send({ id: currentId, phase: batch.state.finished ? 'finished' : phase, ...batch });
}
function tick() {
  if (!running) return;
  try {
    advance(batchSize, 'running');
    if (running) timer = setTimeout(tick, 20);
  } catch (error) {
    stop();
    send({ id: currentId, error: String(error) });
  }
}

// awaitを含む受信処理を直列化し、初期化中の命令順も保つ。
let queue = Promise.resolve();
onmessage = (event: MessageEvent<Command>) => {
  const message = event.data;
  queue = queue.then(async () => {
    const error = await initialized;
    if (error) throw error;
    if (message.command === 'load') {
      stop();
      currentId = message.id;
      simulation?.free();
      simulation = undefined;
      const json = JSON.stringify(message.config);
      simulation = message.model === 'constant-acceleration'
        ? new ConstantAccelerationSimulation(json)
        : message.model === 'position-derivative'
          ? new PositionDerivativeSimulation(json)
          : new UniformSimulation(json);
      batchSize = Math.max(1, Math.min(100, Math.round(0.04 / message.config.dt)));
      publish('ready', [JSON.parse(simulation.snapshot()) as Snapshot]);
      return;
    }
    if (message.id !== currentId || !simulation) return;
    if (message.command === 'pause') {
      stop();
      publish('paused');
    } else if (message.command === 'step') {
      stop();
      advance(1, 'paused');
    } else if (message.command === 'start') {
      if (running) return;
      running = true;
      tick();
    }
  }).catch((error: unknown) => {
    stop();
    send({ id: currentId, error: String(error) });
  });
};
