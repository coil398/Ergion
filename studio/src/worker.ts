import init, {
  ConstantAccelerationSimulation,
  EulerSimulation,
  LinearSimulation,
  PositionDerivativeSimulation,
  SeparationSimulation,
  StepCompareSimulation,
  NewtonSimulation,
  TextbookSimulation,
  UniformSimulation,
} from '../wasm/ergion_lab.js';
import wasmUrl from '../wasm/ergion_lab_bg.wasm?url';
import type { Batch, Command, Reply, Snapshot, Update } from './protocol';

interface RunningSimulation {
  snapshot(): string;
  advance(steps: number): string;
  extend(additionalSteps: number): string;
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
      const constantAcceleration = message.config as {
        initial_position: number;
        initial_velocity: number;
        acceleration: number;
        dt: number;
        steps: number;
      };
      simulation = message.model === 'compare'
        ? new StepCompareSimulation(JSON.stringify({ ...message.config, method: message.method ?? 'euler' }))
        : message.model === 'constant-acceleration' && message.method
          ? new StepCompareSimulation(JSON.stringify({
            schema_version: 1,
            kind: 'accelerated',
            method: message.method,
            t0: 0,
            dt: constantAcceleration.dt,
            steps: constantAcceleration.steps,
            initial_position: constantAcceleration.initial_position,
            initial_velocity: constantAcceleration.initial_velocity,
            acceleration: constantAcceleration.acceleration,
          }))
        : message.model === 'constant-acceleration'
          ? new ConstantAccelerationSimulation(json)
          : (message.model === 'position-derivative' || message.model === 'uniform') && message.method
            ? new EulerSimulation(JSON.stringify({ ...message.config, method: message.method }))
            : message.model === 'position-derivative'
              ? new PositionDerivativeSimulation(json)
              : message.model === 'euler'
                ? new EulerSimulation(JSON.stringify({ ...message.config, method: message.method ?? 'euler' }))
                : message.model === 'separation'
                  ? new SeparationSimulation(json)
                  : message.model === 'linear'
                    ? new LinearSimulation(json)
                    : message.model === 'textbook'
                      ? new TextbookSimulation(json)
                      : message.model === 'newton'
                        ? new NewtonSimulation(json)
                        : new UniformSimulation(json);
      const dt = 'dt' in message.config ? message.config.dt : 1;
      batchSize = message.model === 'newton'
        ? 1
        : Math.max(1, Math.min(100, Math.round(0.04 / dt)));
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
    } else if (message.command === 'extend') {
      const state = JSON.parse(simulation.extend(message.steps)) as Snapshot;
      const phase: Update['phase'] = running ? 'running' : state.step === 0 ? 'ready' : state.finished ? 'finished' : 'paused';
      send({ id: currentId, phase, state, samples: [], extended: message.steps });
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
