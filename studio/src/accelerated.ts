import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import { clearFigure, drawConstantAcceleration, drawTimeSeries } from './figures';
import type { ConstantAccelerationConfig, Snapshot } from './protocol';
import { mountSession } from './session';

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
          <p class="description">一つの粒子が、一定の加速度 <span class="math">a</span> で直線上を進みます。速度は一定の割合で変わります。一定の加速度から、速度と位置の厳密解がどのように出るかを、このページで順に見ます。</p>
        </div>
        <div class="equation" aria-label="等加速度直線運動の式。位置は x0 足す v0 t 足す 2分の1 a t の二乗。速度は v0 足す a t">
          <span class="math-x">x</span>(<span class="math-x">t</span>) = <span class="math-x">x₀</span> + <span class="math-x">v₀</span><span class="math-x">t</span> + <span class="math-x">½</span><span class="math-x">a</span><span class="math-x">t²</span>
          <span class="equation-second"><span class="math-x">v</span>(<span class="math-x">t</span>) = <span class="math-x">v₀</span> + <span class="math-x">a</span><span class="math-x">t</span></span>
          <span class="equation-note">加速度一定の厳密解</span>
        </div>
      </section>
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2><span class="quiet-label">換算単位</span></div>
          <form id="config-form">
            <fieldset><legend>運動の設定</legend>
              <div class="field-pair">
                <label>初期位置 <span>x₀</span><input name="initial_position" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label>
                <label>初期速度 <span>v₀</span><input name="initial_velocity" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label>
              </div>
              <label class="field-single">加速度 <span>a</span><input name="acceleration" type="number" min="-1000000000000" max="1000000000000" step="any" required value="1"></label>
            </fieldset>
            <fieldset><legend>時間発展</legend>
              <div class="field-pair">
                <label>時間刻み <span>Δt</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="0.01"></label>
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
            <div class="panel-heading"><h2 id="study-heading">等加速度直線運動の計算と説明</h2><span class="quiet-label">厳密解の求め方</span></div>
            <div class="study-body">
              <ol class="solution">
                <li>一つの粒子が直線上を動くとき、加速度 <span class="math">a</span> は速度 <span class="math">v</span> の時間微分であり、位置 <span class="math">x</span> を時刻 <span class="math">t</span> で二度微分したものです。<span class="math">a = v' = x''</span>。この運動では、<span class="math">a</span> は時刻にも位置にもよらず一定です。</li>
                <li>加速度が一定なので <span class="math">v' = a</span> です。時刻 0 から <span class="math">t</span> まで積分すると <span class="math">v(t) − v(0) = a t</span> です。初期速度を <span class="math">v(0) = v₀</span> と書くと、速度の厳密解は次の一次式です。
                  <p class="solution-equation"><span class="math">v(t) = v₀ + a t</span></p>
                  速度は一定の割合 <span class="math">a</span> で変わります。速度の時間変化のグラフは、傾き <span class="math">a</span> の直線です。
                </li>
                <li>速度は位置の時間微分なので <span class="math">x' = v₀ + a t</span> です。もう一度、時刻 0 から <span class="math">t</span> まで積分すると <span class="math">x(t) − x(0) = v₀ t + (1/2) a t²</span> です。初期位置を <span class="math">x(0) = x₀</span> と書くと、位置の厳密解は次の二次式です。
                  <p class="solution-equation"><span class="math">x(t) = x₀ + v₀ t + (1/2) a t²</span></p>
                </li>
                <li>数値計算は、<code>crates/ergion-lab/src/constant_acceleration.rs</code> の <code>ConstantAccelerationSimulation</code> が velocity-Verlet 法で1ステップ進めます。加速度が一定のとき、更新は <span class="math">x<sub>n+1</sub> = x<sub>n</sub> + v<sub>n</sub> Δt + (1/2) a (Δt)²</span>、<span class="math">v<sub>n+1</sub> = v<sub>n</sub> + a Δt</span> です。位置は時刻の二次式、速度は時刻の一次式であり、三階以上の導関数はゼロです。この多項式に対して、数値ステップの増分は厳密解の増分と一致します。残る差は、倍精度浮動小数点の丸めだけです。</li>
              </ol>
              <p>同じ手順は、計算を行う <code>ConstantAccelerationSimulation</code> の rustdoc に書いてあります。画面に描く位置と速度は、その関数が返した数値です。式 <span class="math">x(t) = x₀ + v₀ t + (1/2) a t²</span> や <span class="math">v(t) = v₀ + a t</span> を、描画のために計算し直すことはありません。紫の実線が数値解、青緑の破線が厳密解です。</p>
            </div>
          </section>
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption">粒子は数値解の位置にあります。青緑の破線は、同じ時刻の厳密解の位置です。橙の矢印の長さは、返された速度の大きさに比例します。加速度が一定なので、速度も矢印の長さも一定の割合で変わります。</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度の矢印の長さは、その時刻の速度の大きさに比例します。数値解は紫の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の絶対差 |x − x_exact|</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と速度の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span></div></div>
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 <span>x(t)</span></h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>速度の時間変化 <span>v(t)</span></h3><canvas id="phase-chart" aria-label="速度と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>破線は解析解。速度は傾き a の直線</span></div>
          </section>
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons"><button id="run" class="button primary" disabled>計算を開始</button><button id="step" class="button secondary" disabled>1ステップ</button><button id="reset" class="icon-button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button></div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 1000 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="1000" value="0" aria-label="計算の進捗"></progress></div>
          </section>
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      ${pageFooter('この画面の計算は一粒子の等加速度直線運動です。')}
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
  const key = `${config.initial_position}|${config.initial_velocity}|${config.acceleration}|${config.dt}|${config.steps}`;
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
  drawTimeSeries(canvases[2], {
    key: `${key}|velocity`,
    kind: 'velocity',
    timeEnd,
    time: state.time,
    current: state.velocity,
    samples: points.map(point => ({ time: point.time, numerical: point.velocity, exact: point.exact_velocity })),
  });
}

mountSession({
  defaults,
  model: 'constant-acceleration',
  downloadName: 'ergion-constant-acceleration.json',
  readForm,
  fillForm,
  paintFigures,
});
