import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { drawErrorSeries, drawTimeSeries } from './figures';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { CompareConfig, Reply, Snapshot, StepMethod } from './protocol';
import { onThemeChange } from './theme';

/** 厳密解の図に、その方程式の数値解と誤差を重ねる。 */
export function steppedFigure(companion = false): string {
  return `
      <section class="plots panel" aria-labelledby="curve-heading">
        <div class="panel-heading"><h2 id="curve-heading">数値解と厳密解</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>厳密解</span><span><i class="difference"></i>誤差</span></div></div>
        ${methodTabs('この方程式の数値解法')}
        <div class="plot-grid">
          <div class="plot-main"><h3>位置の時間変化</h3><canvas id="solution-chart" role="img"></canvas><p>時間 t</p></div>
          <div class="plot-phase"><h3>位置の誤差</h3><canvas id="solution-error" role="img"></canvas><p>時間 t</p></div>
          ${companion ? '<div class="plot-main"><h3>もう一つの成分の誤差</h3><canvas id="companion-error" role="img"></canvas><p>時間 t</p></div>' : ''}
        </div>
        <div class="readouts">
          <div><span>時刻 t</span><output id="solution-time">—</output></div>
          <div><span>厳密解</span><output id="solution-value">—</output></div>
          <div><span>数値解</span><output id="numerical-value">—</output></div>
          <div><span>位置の誤差</span><output id="position-error">—</output></div>
          ${companion ? '<div><span>もう一つの厳密解</span><output id="solution-companion">—</output></div><div><span>もう一つの数値解</span><output id="companion-numerical">—</output></div><div><span>もう一つの誤差</span><output id="companion-error-value">—</output></div>' : ''}
        </div>
      </section>
      ${codeDisclosure('euler')}`;
}

/** ページに書いた例を、ライブラリの数値解と厳密解として描く。式の値はここでは計算しない。 */
export function mountSteppedFigure(options: {
  config: CompareConfig;
  label: string;
  xMin?: number;
  companion?: boolean;
}) {
  const status = document.querySelector<HTMLElement>('#status')!;
  const label = status.querySelector('span')!;
  const chart = document.querySelector<HTMLCanvasElement>('#solution-chart')!;
  const errorChart = document.querySelector<HTMLCanvasElement>('#solution-error')!;
  const companionChart = document.querySelector<HTMLCanvasElement>('#companion-error');
  const timeOutput = document.querySelector<HTMLOutputElement>('#solution-time')!;
  const valueOutput = document.querySelector<HTMLOutputElement>('#solution-value')!;
  const numericalOutput = document.querySelector<HTMLOutputElement>('#numerical-value')!;
  const errorOutput = document.querySelector<HTMLOutputElement>('#position-error')!;
  const companion = document.querySelector<HTMLOutputElement>('#solution-companion');
  const companionNumerical = document.querySelector<HTMLOutputElement>('#companion-numerical');
  const companionError = document.querySelector<HTMLOutputElement>('#companion-error-value');
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  let method: StepMethod = 'euler';
  let id = 0;
  let samples: Snapshot[] = [];
  let drawn: { samples: Snapshot[]; state: Snapshot } | undefined;

  function paint(points: Snapshot[], state: Snapshot) {
    drawn = { samples: points, state };
    const timeEnd = options.config.t0 + options.config.dt * options.config.steps;
    timeOutput.textContent = state.time.toFixed(5);
    valueOutput.textContent = state.exact_position.toFixed(5);
    numericalOutput.textContent = state.position.toFixed(5);
    errorOutput.textContent = (state.position_error ?? 0).toExponential(2);
    if (companion) companion.textContent = state.exact_velocity.toFixed(5);
    if (companionNumerical) companionNumerical.textContent = state.velocity.toFixed(5);
    if (companionError) companionError.textContent = (state.velocity_error ?? 0).toExponential(2);
    const key = `${options.config.kind}|${method}`;
    drawTimeSeries(chart, {
      key,
      kind: 'position',
      timeEnd,
      xMin: options.xMin,
      time: state.time,
      current: state.position,
      samples: points.map(sample => ({ time: sample.time, numerical: sample.position, exact: sample.exact_position })),
    });
    chart.setAttribute('aria-label', `${options.label}。数値解と厳密解。`);
    drawErrorSeries(errorChart, {
      key: `${key}|error`,
      timeEnd,
      xMin: options.xMin,
      time: state.time,
      current: state.position_error ?? 0,
      samples: points.map(sample => ({ time: sample.time, error: sample.position_error ?? 0 })),
    });
    if (companionChart) {
      drawErrorSeries(companionChart, {
        key: `${key}|companion-error`,
        timeEnd,
        xMin: options.xMin,
        time: state.time,
        current: state.velocity_error ?? 0,
        zeroLabel: 'y − y_exact = 0',
        samples: points.map(sample => ({ time: sample.time, error: sample.velocity_error ?? 0 })),
      });
    }
  }

  function load() {
    samples = [];
    drawn = undefined;
    label.textContent = '計算環境を準備中';
    status.dataset.phase = 'loading';
    worker.postMessage({
      id: ++id,
      command: 'load',
      model: 'compare',
      method,
      config: options.config,
    });
  }

  worker.onmessage = (event: MessageEvent<Reply>) => {
    const reply = event.data;
    if (reply.id !== id) return;
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
      paint(samples, reply.state);
    }
  };
  const repaint = () => {
    if (drawn) paint(drawn.samples, drawn.state);
  };
  window.addEventListener('resize', repaint);
  onThemeChange(repaint);
  mountCodeDisclosure();
  bindMethodTabs(next => {
    method = next;
    setCodeMethod(next);
    load();
  });
  load();
}
