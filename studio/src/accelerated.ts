import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, pageFooter, rail, relatedPages, simulationDoc } from './chrome';
import accelerationProof from '../../formal/lean/Ergion/ConstantAcceleration.lean?raw';
import { checkedProofs } from './proof';
import { clearFigure, drawConstantAcceleration, drawErrorSeries, drawTimeSeries } from './figures';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { bindMethodTabs, methodTabs } from './method-tabs';
import { tex } from './tex';
import type { ConstantAccelerationConfig, Snapshot, StepMethod } from './protocol';
import { mountSession, transportPanel } from './session';

const defaults: ConstantAccelerationConfig = {
  schema_version: 1,
  initial_position: 0,
  initial_velocity: 0,
  acceleration: 1,
  dt: 0.01,
  steps: 1000,
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('accelerated')}
    <main id="experiment">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./">力学</a> <span>/</span> 等加速度直線運動</p>
          <h1>等加速度直線運動<span class="title-dot">.</span></h1>
          <p class="description">一つの粒子が、一定の加速度 ${tex('a')} で直線上を進みます。速度は一定の割合で変わります。一定の加速度から、速度と位置の厳密解がどのように出るかを、このページで順に見ます。</p>
        </div>
        <div class="equation" aria-label="等加速度直線運動の式。位置は x0 足す v0 t 足す 2分の1 a t の二乗">
          ${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">等加速度直線運動の計算と説明</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>一つの粒子が直線上を動くとき、加速度 ${tex('a')} は速度 ${tex('v')} の時間微分であり、位置 ${tex('x')} を時刻 ${tex('t')} で二度微分したものです。${tex(String.raw`a = v' = x''`)}。この運動では、${tex('a')} は時刻にも位置にもよらず一定です。</li>
            <li>加速度が一定なので ${tex(String.raw`v' = a`)} です。時刻 0 から ${tex('t')} まで積分します。
              <p class="solution-equation">${tex(String.raw`\int_0^{t} v'(\tau)\,d\tau = \int_0^{t} a\,d\tau`, true)}</p>
              原始関数を評価します。
              <p class="solution-equation">${tex(String.raw`[v(\tau)]_0^{t} = v(t) - v(0) = at`, true)}</p>
              初期速度を ${tex('v(0) = v_0')} と書き、移項すると、速度の厳密解は次の一次式です。
              <p class="solution-equation">${tex('v(t) = v_0 + a t', true)}</p>
              速度は一定の割合 ${tex('a')} で変わります。速度の時間変化のグラフは、傾き ${tex('a')} の直線です。
            </li>
            <li>速度は位置の時間微分なので ${tex(String.raw`x' = v_0 + a t`)} です。もう一度、時刻 0 から ${tex('t')} まで積分します。
              <p class="solution-equation">${tex(String.raw`\int_0^{t} x'(\tau)\,d\tau = \int_0^{t} (v_0 + a \tau)\,d\tau`, true)}</p>
              各項の原始関数を評価します。
              <p class="solution-equation">${tex(String.raw`[x(\tau)]_0^{t} = x(t) - x(0) = v_0 t + \frac{1}{2} a t^2`, true)}</p>
              初期位置を ${tex('x(0) = x_0')} と書き、移項すると、位置の厳密解は次の二次式です。
              <p class="solution-equation">${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`, true)}</p>
            </li>
            <li>ステップ番号を ${tex('n')}、時刻 ${tex('t_n')} の位置と速度を ${tex('x_n = x(t_n)')}、${tex('v_n = v(t_n)')}、時間刻みを ${tex(String.raw`\Delta t`)} とします。位置は時刻の二次式であり、三階以上の導関数はゼロです。したがって ${tex('t_n')} のまわりの Taylor 展開は二次の項で終わります。
              <p class="solution-equation">${tex(String.raw`x(t_n + \Delta t) = x(t_n) + x'(t_n)\,\Delta t + \frac{1}{2} x''(t_n)\,(\Delta t)^2`, true)}</p>
              ${tex(String.raw`x'(t_n) = v_n`)}、${tex(String.raw`x''(t_n) = a`)} を代入すると、${tex(String.raw`\Delta t`)} だけ進んだ厳密な増分は次の式です（${simulationDoc('constant_acceleration', 'ConstantAccelerationSimulation', '1ステップの説明')}）。
              <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + v_n \Delta t + \frac{1}{2} a (\Delta t)^2`, true)}</p>
              <p class="solution-equation">${tex(String.raw`v_{n+1} = v_n + a \Delta t`, true)}</p>
            </li>
            <li>中点法は、区間の中点の速度で位置を進めます。中点の速度は ${tex(String.raw`v_n + \frac{1}{2} a \Delta t`)} です。
              <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + \Delta t \left(v_n + \frac{1}{2} a \Delta t\right)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`= x_n + v_n \Delta t + \frac{1}{2} a (\Delta t)^2`, true)}</p>
              古典的な4次の Runge–Kutta 法では、位置の四つの傾きは速度 ${tex('v_n')}、${tex(String.raw`v_n + \frac{1}{2} a \Delta t`)}、${tex(String.raw`v_n + \frac{1}{2} a \Delta t`)}、${tex(String.raw`v_n + a \Delta t`)} です。重み 1, 2, 2, 1 で平均します。
              <p class="solution-equation">${tex(String.raw`\frac{1}{6}\left(v_n + 2\left(v_n + \tfrac{1}{2} a \Delta t\right) + 2\left(v_n + \tfrac{1}{2} a \Delta t\right) + v_n + a \Delta t\right) = \frac{1}{6}\left(6 v_n + 3 a \Delta t\right) = v_n + \frac{1}{2} a \Delta t`, true)}</p>
              平均の傾きが中点法と同じなので、位置の更新も同じ式です。中点法と古典的な4次の Runge–Kutta 法では、数値ステップの増分は厳密解の増分と一致します。
            </li>
            <li>Euler 法は、区間の始点の速度 ${tex('v_n')} だけで位置を進めます。
              <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + v_n \Delta t`, true)}</p>
              厳密な増分との差は次の式です。
              <p class="solution-equation">${tex(String.raw`\left(x_n + v_n \Delta t + \frac{1}{2} a (\Delta t)^2\right) - \left(x_n + v_n \Delta t\right) = \frac{1}{2} a (\Delta t)^2`, true)}</p>
              この差は打ち切り誤差であり、1ステップごとに位置に残ります。速度の更新 ${tex(String.raw`v_{n+1} = v_n + a \Delta t`)} は厳密な増分と一致します。
            </li>
          </ol>
          <p>画面は、各時刻の位置と速度を描きます。式 ${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`)} や ${tex('v(t) = v_0 + a t')} を、描画のために計算し直すことはありません。青の実線が数値解、青緑の破線が厳密解です。</p>
        </div>
      </section>
      ${pageFigure('accelerated', '等加速度直線運動では、粒子が進むにつれて速度の矢が長くなる。')}
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2></div>
          <form id="config-form">
            <fieldset><legend>運動の設定</legend>
              <div class="field-pair">
                <label>初期位置 <span class="field-symbol">${tex('x_0')}</span><input name="initial_position" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label>
                <label>初期速度 <span class="field-symbol">${tex('v_0')}</span><input name="initial_velocity" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label>
              </div>
              <label class="field-single">加速度 <span class="field-symbol">${tex('a')}</span><input name="acceleration" type="number" min="-1000000000000" max="1000000000000" step="any" required value="1"></label>
            </fieldset>
            <fieldset><legend>時間発展</legend>
              <div class="field-pair">
                <label>時間刻み <span class="field-symbol">${tex(String.raw`\Delta t`)}</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="0.01"></label>
                <label>ステップ数<input name="steps" type="number" min="1" max="1000000" step="1" required value="1000"></label>
              </div>
              <p class="field-hint" id="time-hint">t = 10.00</p>
            </fieldset>
            <button class="button secondary apply" id="apply" type="submit" disabled>条件を適用してリセット</button>
            <p class="form-note" id="form-note" hidden></p>
          </form>
          <div class="config-files"><button id="export" class="text-button" type="button">設定を保存 ↓</button><label class="text-button file-label">設定を読み込む<input id="import" type="file" accept=".json,application/json"></label></div>
        </section>
        <div class="results">
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption">粒子は数値解の位置にあります。青緑の破線は、同じ時刻の厳密解の位置です。橙の矢印の長さは、返された速度の大きさに比例します。加速度が一定なので、速度も矢印の長さも一定の割合で変わります。</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度の矢印の長さは、その時刻の速度の大きさに比例します。数値解は青の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の誤差 x − x_exact</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と誤差の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span><span><i class="difference"></i>誤差</span></div></div>
            ${methodTabs('この方程式の数値解法')}
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex('x - x_{\\mathrm{exact}}')}</h3><canvas id="phase-chart" aria-label="位置の誤差と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span></div>
          </section>
          ${transportPanel()}
          ${codeDisclosure('accelerated')}
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="panel-heading"><h2 id="example-heading">数を代入した例</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>計算条件の既定の値 ${tex('x_0 = 0')}、${tex('v_0 = 0')}、${tex('a = 1')}、${tex(String.raw`\Delta t = 0.01`)} をとります。1ステップ後の厳密な値は次の式です。
              <p class="solution-equation">${tex(String.raw`v_1 = 0 + 1 \cdot 0.01 = 0.01`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x_1 = 0 + 0 \cdot 0.01 + \frac{1}{2} \cdot 1 \cdot (0.01)^2 = \frac{1}{2} \cdot 0.0001 = 0.00005`, true)}</p>
            </li>
            <li>中点法と古典的な4次の Runge–Kutta 法の1ステップは、上の厳密な増分と同じ式です。1ステップを一度進めると、画面の位置 ${tex('x')} と解析解の位置はどちらも 0.00005、速度 ${tex('v')} は 0.01000 です。これらは小数第5位までの近似の表示です。</li>
            <li>Euler 法の1ステップは、始点の速度 ${tex('v_0 = 0')} で位置を進めます。
              <p class="solution-equation">${tex(String.raw`x_1 = 0 + 0 \cdot 0.01 = 0`, true)}</p>
              厳密な値との差は ${tex(String.raw`0 - 0.00005 = -0.00005`)} であり、これは ${tex(String.raw`\frac{1}{2} a (\Delta t)^2`)} の符号を変えた値です。画面の位置 ${tex('x')} は 0.00000、位置の誤差は近似の表示 -5.00e-5 です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './integrate.html', title: '積分して解く' },
        { href: './uniform.html', title: '等速直線運動' },
        { href: './euler.html', title: 'Euler法' },
        { href: './midpoint.html', title: '中点法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('')}
      ${checkedProofs([{ statement: `加速度 ${tex('a')} が一定のとき、速度は ${tex('v(t) = v_0 + a t')}、位置は ${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`)} です。`, source: accelerationProof, moduleName: 'Ergion.ConstantAcceleration', kind: '実数' }])}
    </main>
  </div>`;

const form = document.querySelector<HTMLFormElement>('#config-form')!;

function readForm(): ConstantAccelerationConfig {
  const data = new FormData(form);
  return {
    schema_version: 1,
    initial_position: Number(data.get('initial_position')),
    initial_velocity: Number(data.get('initial_velocity')),
    acceleration: Number(data.get('acceleration')),
    dt: Number(data.get('dt')),
    steps: Number(data.get('steps')),
  };
}

function fillForm(value: ConstantAccelerationConfig) {
  for (const [key, item] of Object.entries(value)) {
    const input = form.elements.namedItem(key) as HTMLInputElement | null;
    if (input) input.value = String(item);
  }
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: ConstantAccelerationConfig) {
  const canvases = ['oscillator', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${config.initial_position}|${config.initial_velocity}|${config.acceleration}|${config.dt}|${config.steps}|${method}`;
  const timeEnd = config.steps * config.dt;
  const x0 = points.reduce((earliest, point) => point.time < earliest.time ? point : earliest, points[0] ?? state).position;
  drawConstantAcceleration(canvases[0], {
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
    samples: points.map(point => ({ time: point.time, error: point.position_error ?? point.position - point.exact_position })),
  });
}

let method: StepMethod = 'euler';
const session = mountSession({
  defaults,
  model: 'constant-acceleration',
  downloadName: 'ergion-constant-acceleration.json',
  readForm,
  fillForm,
  paintFigures,
  method: () => method,
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
