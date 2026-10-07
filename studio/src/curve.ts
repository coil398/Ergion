import { drawExactCurve } from './figures';
import type { LinearConfig, Reply, SeparationConfig, Snapshot, TextbookConfig, TextbookKind } from './protocol';

/** 固定した例の厳密解を、ライブラリが返した標本として受け取る。式はここでは計算しない。 */
export function loadExample(options: {
  model: 'separation' | 'linear' | 'textbook';
  config: SeparationConfig | LinearConfig | TextbookConfig;
  paint: (samples: Snapshot[], state: Snapshot) => void;
}) {
  const status = document.querySelector<HTMLElement>('#status')!;
  const label = status.querySelector('span')!;
  label.textContent = '計算環境を準備中';
  status.dataset.phase = 'loading';
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const id = 1;
  let samples: Snapshot[] = [];
  worker.onmessage = (event: MessageEvent<Reply>) => {
    const reply = event.data;
    if (!('phase' in reply)) {
      label.textContent = '条件を確認してください';
      status.dataset.phase = 'error';
      return;
    }
    if (reply.phase === 'ready') {
      samples = reply.samples;
      worker.postMessage({ id, command: 'start' });
      return;
    }
    samples.push(...reply.samples);
    if (reply.phase === 'finished') {
      label.textContent = '計算完了';
      status.dataset.phase = 'finished';
      options.paint(samples, reply.state);
    }
  };
  worker.postMessage({ id, command: 'load', model: options.model, config: options.config });
}

/** ページに書いた例を、ライブラリの標本として描く。式の値はここでは計算しない。 */
export function mountExactFigure(options: {
  kind: TextbookKind;
  t0: number;
  dt: number;
  steps: number;
  label: string;
  xMin?: number;
}) {
  const canvas = document.querySelector<HTMLCanvasElement>('#solution-chart')!;
  const timeOutput = document.querySelector<HTMLOutputElement>('#solution-time')!;
  const valueOutput = document.querySelector<HTMLOutputElement>('#solution-value')!;
  const companion = document.querySelector<HTMLOutputElement>('#solution-companion');
  let drawn: { samples: Snapshot[]; state: Snapshot } | undefined;
  function paint(samples: Snapshot[], state: Snapshot) {
    drawn = { samples, state };
    timeOutput.textContent = state.time.toFixed(5);
    valueOutput.textContent = state.position.toFixed(5);
    if (companion) companion.textContent = state.velocity.toFixed(5);
    drawExactCurve(canvas, {
      key: options.kind,
      timeEnd: options.t0 + options.dt * options.steps,
      xMin: options.xMin,
      time: state.time,
      current: state.exact_position,
      samples: samples.map(sample => ({ time: sample.time, value: sample.exact_position })),
      label: options.label,
    });
  }
  window.addEventListener('resize', () => {
    if (drawn) paint(drawn.samples, drawn.state);
  });
  loadExample({
    model: 'textbook',
    config: { schema_version: 1, kind: options.kind, t0: options.t0, dt: options.dt, steps: options.steps },
    paint,
  });
}
