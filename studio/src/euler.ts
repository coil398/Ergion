import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import { clearFigure, drawErrorSeries, drawTimeSeries, drawUniformMotion } from './figures';
import type { Config, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: Config = {
  schema_version: 1,
  initial_position: 0,
  velocity: 1,
  dt: 0.01,
  steps: 1000,
};

const methods: Record<StepMethod, { label: string; fn: 'euler_step' | 'midpoint_step' | 'rk4_step'; formula: string; prose: string }> = {
  euler: {
    label: 'Euler法',
    fn: 'euler_step',
    formula: String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`,
    prose: 'Euler 法は、右辺を区間の始点で一定とみなします。',
  },
  midpoint: {
    label: '中点法',
    fn: 'midpoint_step',
    formula: String.raw`x_{n+1} = x_n + \Delta t \, k_2`,
    prose: '中点法は2次の Runge–Kutta 法です。始点の傾きで中点まで仮に進み、その中点の傾きで1ステップ進めます。',
  },
  rk4: {
    label: '古典的RK4',
    fn: 'rk4_step',
    formula: String.raw`x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)`,
    prose: '古典的な4次の Runge–Kutta 法は、始点、中点、終点で求めた四つの傾きを上の重みで足します。',
  },
};

let method: StepMethod = 'euler';

function methodBody(kind: StepMethod): string {
  const item = methods[kind];
  const rounding = kind === 'euler'
    ? `このページでは ${tex('f(x_n, t_n) = v')} です。${tex('v')} は一定なので、上の式は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と同じです。`
    : kind === 'midpoint'
      ? `${tex('v')} が一定ならば、始点の傾きも中点の傾きも ${tex('v')} です。したがって ${tex('k_2 = v')} であり、更新は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と一致します。`
      : `${tex('v')} が一定ならば、四つの傾きはみな ${tex('v')} です。重み付きの和は ${tex('v')} になり、更新は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と一致します。`;
  return `
    <p>${item.prose}（${coreStepDoc(item.fn, '1ステップの説明')}）</p>
    <p class="solution-equation">${tex(item.formula, true)}</p>
    <p>${rounding}これは厳密解 ${tex('x(t) = x_0 + v t')} の増分と一致します。打ち切り誤差はありません。各時刻の誤差 ${tex('x - x_{\\mathrm{exact}}')} は、倍精度浮動小数点の丸めだけです。</p>
  `;
}

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('euler')}
    <main id="experiment">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 数値解法</p>
          <h1>数値解法<span class="title-dot">.</span></h1>
          <p class="description">方程式は ${tex(String.raw`x' = v`)} のままです。タブは、1ステップの進め方だけを切り替えます。速度 ${tex('v')} は一定で、厳密解は ${tex('x(t) = x_0 + v t')} です。</p>
        </div>
        <div class="equation" aria-label="位置の時間微分。x プライムは v">
          ${tex(String.raw`x' = v`, true)}
          <span class="equation-note">速度は一定</span>
        </div>
      </section>
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2><span class="quiet-label">換算単位</span></div>
          <form id="config-form">
            <fieldset><legend>運動の設定</legend>
              <div class="field-pair">
                <label>初期位置 <span class="field-symbol">${tex('x_0')}</span><input name="initial_position" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label>
                <label>速度 <span class="field-symbol">${tex('v')}</span><input name="velocity" type="number" min="-1000000000000" max="1000000000000" step="any" required value="1"></label>
              </div>
            </fieldset>
            <fieldset><legend>時間発展</legend>
              <div class="field-pair">
                <label>時間刻み <span class="field-symbol">${tex(String.raw`\Delta t`)}</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="0.01"></label>
                <label>ステップ数<input name="steps" type="number" min="1" max="1000000" step="1" required value="1000"></label>
              </div>
              <p class="field-hint" id="time-hint">計算時間 10.00</p>
            </fieldset>
            <button class="button secondary apply" id="apply" type="submit" disabled>条件を適用してリセット</button>
            <p class="form-note" id="form-note">現在の条件で実行できます。</p>
          </form>
          <div class="config-files"><button id="export" class="text-button" type="button">設定を保存 ↓</button><label class="text-button file-label">設定を読み込む<input id="import" type="file" accept=".json,application/json"></label></div>
          <p class="file-note">同じJSON設定をCLIでも使えます。途中の計算状態は保存しません。</p>
        </section>
        <div class="results">
          <section class="study panel" id="study" aria-labelledby="study-heading">
            <div class="panel-heading"><h2 id="study-heading">数値解法の1ステップ</h2><span class="quiet-label" id="method-label">Euler法</span></div>
            <div class="study-body">
              <div class="method-tabs" role="tablist" aria-label="数値解法">
                <button type="button" class="method-tab" role="tab" id="tab-euler" data-method="euler" aria-selected="true" aria-controls="method-copy">Euler法</button>
                <button type="button" class="method-tab" role="tab" id="tab-midpoint" data-method="midpoint" aria-selected="false" aria-controls="method-copy">中点法</button>
                <button type="button" class="method-tab" role="tab" id="tab-rk4" data-method="rk4" aria-selected="false" aria-controls="method-copy">古典的RK4</button>
              </div>
              <ol class="solution">
                <li>直線上の位置を ${tex('x')}、時刻を ${tex('t')}、速度を ${tex('v')} とします。このページの方程式は ${tex(String.raw`x' = v`)} です。速度は時刻にも位置にもよりません。厳密解は ${tex('x(t) = x_0 + v t')} です。</li>
                <li id="method-copy" role="tabpanel" aria-labelledby="tab-euler"></li>
              </ol>
              <p>画面は、各時刻に返された数値解の位置と、誤差 ${tex('x - x_{\\mathrm{exact}}')} を描きます。厳密解の式を、描画のために計算し直すことはありません。紫の実線が数値解、青緑の破線が厳密解です。誤差は、その破線とは別の実線です。</p>
            </div>
          </section>
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption" id="scene-caption">速度 ${tex('v')} が一定のあいだ、選んだ方法の1ステップは変位 ${tex(String.raw`v \Delta t`)} だけ位置を進めます。</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度が一定のとき、選んだ数値解法の1ステップで位置は速度と時間刻みの積だけ進みます。数値解は紫の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の誤差 x − x_exact</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と誤差の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span><span><i class="difference"></i>誤差</span></div></div>
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex('x - x_{\\mathrm{exact}}')}</h3><canvas id="phase-chart" aria-label="位置の誤差と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>誤差は実線</span></div>
          </section>
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons"><button id="run" class="button primary" disabled>計算を開始</button><button id="step" class="button secondary" disabled>1ステップ</button><button id="reset" class="icon-button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button></div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 1000 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="1000" value="0" aria-label="計算の進捗"></progress></div>
          </section>
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      ${pageFooter('この画面は、速度が一定の x\' = v を、選んだ数値解法で1ステップ進めます。')}
    </main>
  </div>`;

function showMethod(kind: StepMethod) {
  method = kind;
  document.querySelector('#method-label')!.textContent = methods[kind].label;
  const panel = document.querySelector<HTMLElement>('#method-copy')!;
  panel.innerHTML = methodBody(kind);
  panel.setAttribute('aria-labelledby', `tab-${kind}`);
  for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
    button.setAttribute('aria-selected', button.dataset.method === kind ? 'true' : 'false');
  }
}

showMethod('euler');

const form = document.querySelector<HTMLFormElement>('#config-form')!;

function readForm(): Config {
  const data = new FormData(form);
  return {
    schema_version: 1,
    initial_position: Number(data.get('initial_position')),
    velocity: Number(data.get('velocity')),
    dt: Number(data.get('dt')),
    steps: Number(data.get('steps')),
  };
}

function fillForm(value: Config) {
  for (const [key, item] of Object.entries(value)) {
    const input = form.elements.namedItem(key) as HTMLInputElement | null;
    if (input) input.value = String(item);
  }
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: Config) {
  const canvases = ['oscillator', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${config.initial_position}|${config.velocity}|${config.dt}|${config.steps}|${method}`;
  const timeEnd = config.steps * config.dt;
  const x0 = points.reduce((earliest, point) => point.time < earliest.time ? point : earliest, points[0] ?? state).position;
  drawUniformMotion(canvases[0], {
    key,
    x0,
    position: state.position,
    exactPosition: state.exact_position,
    velocity: state.velocity,
    timeEnd,
    samples: points.map(point => ({ time: point.time, position: point.position, exactPosition: point.exact_position })),
  });
  drawTimeSeries(canvases[1], {
    key: `${key}|position`,
    kind: 'position',
    timeEnd,
    time: state.time,
    current: state.position,
    samples: points.map(point => ({ time: point.time, numerical: point.position, exact: point.exact_position })),
  });
  drawErrorSeries(canvases[2], {
    key: `${key}|error`,
    timeEnd,
    time: state.time,
    current: state.position_error ?? 0,
    samples: points.map(point => ({ time: point.time, error: point.position_error ?? 0 })),
  });
}

const session = mountSession({
  defaults,
  model: 'euler',
  downloadName: 'ergion-euler.json',
  readForm,
  fillForm,
  paintFigures,
  method: () => method,
});

for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
  button.addEventListener('click', () => {
    const next = button.dataset.method as StepMethod;
    if (next === method) return;
    showMethod(next);
    session.reloadMethod();
  });
}
