import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import { clearFigure, drawTimeSeries, drawUniformMotion } from './figures';
import type { Config, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: Config = {
  schema_version: 1,
  initial_position: 0,
  velocity: 1,
  dt: 0.01,
  steps: 1000,
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('euler')}
    <main id="experiment">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> Euler法</p>
          <h1>Euler法<span class="title-dot">.</span></h1>
          <p class="description">Euler 法は、右辺を区間の始点の値で一定とみなして、微分方程式を1ステップ進めます。速度が一定のときは、そのステップが厳密解の増分と一致します。</p>
        </div>
        <div class="equation" aria-label="Euler 法の1ステップ。次の位置は、いまの位置に時間刻みと右辺の積を加えた値">
          ${tex(String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`, true)}
          <span class="equation-note">始点の傾きで1ステップ</span>
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
            <div class="panel-heading"><h2 id="study-heading">Euler法の1ステップ</h2><span class="quiet-label">一定の速度</span></div>
            <div class="study-body">
              <ol class="solution">
                <li>微分方程式を ${tex(String.raw`x' = f(x, t)`)} と書きます。${tex('x')} は未知関数、${tex('t')} は時刻、${tex('f')} は右辺です。</li>
                <li>ステップ ${tex('n')} の値を ${tex('x_n')}、時刻を ${tex('t_n')}、時間刻みを ${tex(String.raw`\Delta t`)} とします。Euler 法は右辺を区間の始点で一定とみなし、次の式で1ステップ進めます（${coreStepDoc('euler_step', '1ステップの説明')}）。
                  <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`, true)}</p>
                </li>
                <li>このページの右辺は速度 ${tex('v')} で、刻みのあいだ一定です。したがって ${tex('f(x_n, t_n) = v')} であり、上の式は次の式と同じです。
                  <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + v \Delta t`, true)}</p>
                  速度が一定なので、この1ステップは厳密解の増分と一致します。打ち切り誤差はありません。表示される差は、倍精度浮動小数点の丸めだけです。
                </li>
              </ol>
              <p>画面は、各時刻の位置と速度を描きます。式 ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} や ${tex('x(t) = x_0 + v t')} を、描画のために計算し直すことはありません。図の線分は、初期位置 ${tex('x_0')} に加わる変位 ${tex('vt')} です。紫の実線が数値解、青緑の破線が厳密解です。</p>
            </div>
          </section>
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption">速度 ${tex('v')} が一定のあいだ、Euler 法の1ステップは変位 ${tex(String.raw`v \Delta t`)} だけ位置を進めます。変位を重ねた長さが ${tex('vt')} です。</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度が一定のとき、Euler 法の1ステップで位置は速度と時間刻みの積だけ進みます。数値解は紫の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の絶対差 |x − x_exact|</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と速度の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span></div></div>
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>速度の時間変化 ${tex('v(t)')}</h3><canvas id="phase-chart" aria-label="速度と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>破線は解析解</span></div>
          </section>
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons"><button id="run" class="button primary" disabled>計算を開始</button><button id="step" class="button secondary" disabled>1ステップ</button><button id="reset" class="icon-button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button></div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 1000 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="1000" value="0" aria-label="計算の進捗"></progress></div>
          </section>
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      ${pageFooter('この画面の計算は、速度が一定のときの Euler 法の1ステップです。')}
    </main>
  </div>`;

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
  const key = `${config.initial_position}|${config.velocity}|${config.dt}|${config.steps}`;
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
  model: 'euler',
  downloadName: 'ergion-euler.json',
  readForm,
  fillForm,
  paintFigures,
});
