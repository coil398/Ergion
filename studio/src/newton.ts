import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import { drawErrorSeries, drawTimeSeries } from './figures';
import type { NewtonConfig, Reply, Snapshot } from './protocol';
import { tex } from './tex';

const steps = 4;
const config: NewtonConfig = { schema_version: 1, steps };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('newton')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> ニュートン法</p>
          <h1>ニュートン法<span class="title-dot">.</span></h1>
          <p class="description">微分できる実関数 ${tex('f')} について、${tex('f(x) = 0')} を満たす ${tex('x')} を接線で近似します。これは微分方程式を時刻で進める方法ではありません。</p>
        </div>
        <div class="equation" aria-label="ニュートン法の更新。次の近似は、今の近似から関数値を導関数で割った量を引く">
          ${tex(String.raw`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`, true)}
          <span class="equation-note">接線の零点</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">接線から次の近似を作る</h2><span class="quiet-label">根を求める</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>${tex('f')} は微分できる実関数、${tex('x')} は未知数です。目標は ${tex('f(x) = 0')} を満たす ${tex('x')} を求めることです。${tex('n')} は反復の番号、${tex('x_n')} は ${tex('n')} 回目の近似、${tex('x_0')} は出発点です。${tex("f'(x_n)")} は ${tex('x_n')} における導関数です。</li>
            <li>点 ${tex('(x_n, f(x_n))')} における接線は、次の式です。
              <p class="solution-equation">${tex(String.raw`y = f(x_n) + f'(x_n)(x - x_n)`, true)}</p>
            </li>
            <li>次の近似 ${tex('x_{n+1}')} は、この接線が ${tex('y = 0')} と交わる点です。
              <p class="solution-equation">${tex(String.raw`0 = f(x_n) + f'(x_n)(x_{n+1} - x_n)`, true)}</p>
              ${tex("f'(x_n) \\neq 0")} のとき、交点を ${tex('x_{n+1}')} について解くと、次の更新になります（${coreStepDoc('newton_step', '反復の説明')}）。
              <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`, true)}</p>
            </li>
            <li>例として ${tex('f(x) = x^2 - 2')} をとります。導関数は ${tex("f'(x) = 2x")} です。出発点は ${tex('x_0 = 1')} です。第1回は
              <p class="solution-equation">${tex(String.raw`x_1 = 1 - \frac{1^2 - 2}{2 \cdot 1} = \frac{3}{2}`, true)}</p>
              第2回は
              <p class="solution-equation">${tex(String.raw`x_2 = \frac{3}{2} - \frac{\left(\frac{3}{2}\right)^2 - 2}{2 \cdot \frac{3}{2}} = \frac{3}{2} - \frac{1}{12} = \frac{17}{12}`, true)}</p>
              第3回は
              <p class="solution-equation">${tex(String.raw`x_3 = \frac{17}{12} - \frac{\left(\frac{17}{12}\right)^2 - 2}{2 \cdot \frac{17}{12}} = \frac{17}{12} - \frac{1}{408} = \frac{577}{408}`, true)}</p>
              ${tex('f(\\sqrt{2}) = 0')} であり、出発点が正なので、以後の近似も正の側に残ります。列の極限は、正の根 ${tex('\\sqrt{2}')} です。
            </li>
          </ol>
          <p>図の点は、同じ更新を繰り返して返された値です。はじめの数回は上の分数と一致します。横軸は反復の番号 ${tex('n')} であり、時刻ではありません。紫の実線が数値の近似 ${tex('x_n')}、青緑の破線が ${tex('\\sqrt{2}')}、誤差の実線が ${tex('x_n - \\sqrt{2}')} です。${tex('\\sqrt{2}')} も誤差も、返された値を描いています。</p>
        </div>
      </section>
      <section class="plots panel" aria-labelledby="curve-heading">
        <div class="panel-heading"><h2 id="curve-heading">近似と √2 との差</h2><div class="legend"><span><i class="numerical"></i>数値の近似</span><span><i class="analytical"></i>√2</span><span><i class="difference"></i>誤差</span></div></div>
        <p class="scene-caption">横軸は反復の番号 ${tex('n')} です。関数は ${tex('f(x) = x^2 - 2')}、出発点は ${tex('x_0 = 1')} です。</p>
        <div class="plot-grid">
          <div class="plot-main"><h3>近似 ${tex('x_n')}</h3><canvas id="solution-chart" role="img"></canvas><p>反復 n</p></div>
          <div class="plot-phase"><h3>誤差 ${tex('x_n - \\sqrt{2}')}</h3><canvas id="solution-error" role="img"></canvas><p>反復 n</p></div>
        </div>
        <div class="readouts">
          <div><span>反復 n</span><output id="iteration">—</output></div>
          <div><span>数値の近似 x_n</span><output id="numerical-value">—</output></div>
          <div><span>√2</span><output id="exact-root">—</output></div>
          <div><span>誤差 x_n − √2</span><output id="root-error">—</output></div>
        </div>
      </section>
      ${pageFooter('ニュートン法は、接線の零点で f(x) = 0 の近似を更新します。')}
    </main>
  </div>`;

const status = document.querySelector<HTMLElement>('#status')!;
const label = status.querySelector('span')!;
const chart = document.querySelector<HTMLCanvasElement>('#solution-chart')!;
const errorChart = document.querySelector<HTMLCanvasElement>('#solution-error')!;
const iteration = document.querySelector<HTMLOutputElement>('#iteration')!;
const numerical = document.querySelector<HTMLOutputElement>('#numerical-value')!;
const exact = document.querySelector<HTMLOutputElement>('#exact-root')!;
const errorOutput = document.querySelector<HTMLOutputElement>('#root-error')!;
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
let id = 0;
let samples: Snapshot[] = [];
let drawn: { samples: Snapshot[]; state: Snapshot } | undefined;

function paint(points: Snapshot[], state: Snapshot) {
  drawn = { samples: points, state };
  iteration.textContent = String(state.step);
  numerical.textContent = state.position.toFixed(5);
  exact.textContent = state.exact_position.toFixed(5);
  errorOutput.textContent = (state.position_error ?? 0).toExponential(2);
  drawTimeSeries(chart, {
    key: 'newton',
    kind: 'position',
    timeEnd: steps,
    time: state.time,
    current: state.position,
    samples: points.map(sample => ({ time: sample.time, numerical: sample.position, exact: sample.exact_position })),
  });
  chart.setAttribute('aria-label', '反復の番号 n に対する近似 x_n と √2。数値の近似は紫の実線、√2 は青緑の破線。');
  drawErrorSeries(errorChart, {
    key: 'newton-error',
    timeEnd: steps,
    time: state.time,
    current: state.position_error ?? 0,
    zeroLabel: 'x_n − √2 = 0',
    samples: points.map(sample => ({ time: sample.time, error: sample.position_error ?? 0 })),
  });
  errorChart.setAttribute('aria-label', '反復の番号 n に対する誤差 x_n − √2。');
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
window.addEventListener('resize', () => {
  if (drawn) paint(drawn.samples, drawn.state);
});
worker.postMessage({ id: ++id, command: 'load', model: 'newton', config });
