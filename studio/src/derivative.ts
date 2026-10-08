import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, pageFooter, rail, relatedPages, stepDoc } from './chrome';
import { checkedVelocityProof } from './proof';
import { clearFigure, drawErrorSeries, drawTimeSeries, drawUniformMotion } from './figures';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { Config, Snapshot, StepMethod } from './protocol';
import { mountSession, transportPanel } from './session';
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
    ${rail('derivative')}
    <main id="experiment">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./">力学</a> <span>/</span> 位置の時間微分</p>
          <h1>位置の時間微分<span class="title-dot">.</span></h1>
          <p class="description">直線上の位置の時間微分は、速度です。このページでは、速度が一定のあいだに位置がどれだけ進むかを、1ステップずつ見ます。</p>
        </div>
        <div class="equation" aria-label="位置の時間微分。x プライムは v">
          ${tex(String.raw`x' = v`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">位置の時間微分の計算と説明</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>直線上の位置を ${tex('x')}、時刻を ${tex('t')}、速度を ${tex('v')} とします。位置を時刻で微分したものが速度なので、${tex(String.raw`x' = v`)} です。</li>
            <li>ステップの始まりの時刻を ${tex('t_n')}、時間刻みを ${tex(String.raw`\Delta t`)} とします。このあいだ速度 ${tex('v')} が一定ならば、${tex(String.raw`x' = v`)} の両辺をその区間で積分します。
              <p class="solution-equation">${tex(String.raw`\int_{t_n}^{t_n + \Delta t} x'(\tau)\,d\tau = \int_{t_n}^{t_n + \Delta t} v\,d\tau`, true)}</p>
              左辺は上限と下限での位置の差、右辺は一定の ${tex('v')} に区間の長さ ${tex(String.raw`\Delta t`)} を掛けた値です。
              <p class="solution-equation">${tex(String.raw`x(t_n + \Delta t) - x(t_n) = v \Delta t`, true)}</p>
            </li>
            <li>ステップ番号を ${tex('n')}、時刻 ${tex('t_n')} の位置を ${tex('x_n')} と書くと、位置の更新は次の式です。
              <p class="solution-equation">${tex(String.raw`x_{n+1} = x_n + v \Delta t`, true)}</p>
              速度がこの刻みのあいだ一定なので、この1ステップは厳密です。打ち切り誤差はありません（${stepDoc('1ステップの説明')}）。
            </li>
            <li>初期位置を ${tex('x_0')} と書き、同じ更新を重ねます。速度は変わりません。
              <p class="solution-equation">${tex(String.raw`x_1 = x_0 + v \Delta t`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x_2 = x_1 + v \Delta t = x_0 + 2 v \Delta t`, true)}</p>
              ${tex('n')} 回重ねると、次の式です。
              <p class="solution-equation">${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}</p>
              時刻 0 から ${tex('n')} ステップ後の時刻は ${tex(String.raw`t = n \Delta t`)} なので、${tex(String.raw`n v \Delta t = v t`)} です。位置は次の式に沿って進みます。
              <p class="solution-equation">${tex('x(t) = x_0 + v t', true)}</p>
            </li>
          </ol>
          <p>画面は、各時刻の位置と速度を描きます。式 ${tex(String.raw`x' = v`)} や ${tex('x(t) = x_0 + v t')} を、描画のために計算し直すことはありません。図の線分は、初期位置 ${tex('x_0')} に加わる変位 ${tex('vt')} です。青の実線が数値解、青緑の破線が厳密解です。</p>
        </div>
      </section>
      ${pageFigure('derivative', '速度が一定の1ステップでは、位置は変位 vΔt だけ進む。')}
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2></div>
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
            <p class="scene-caption">速度 ${tex('v')} が一定のあいだ、粒子は1ステップごとに変位 ${tex(String.raw`v \Delta t`)} だけ進みます。変位を重ねた長さが ${tex('vt')} です。</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度が一定の1ステップで、位置は速度と時間刻みの積だけ進みます。数値解は青の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の誤差 x − x_exact</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と誤差の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span><span><i class="difference"></i>誤差</span></div></div>
            ${methodTabs('この方程式の数値解法')}
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex('x - x_{\\mathrm{exact}}')}</h3><canvas id="phase-chart" aria-label="位置の誤差と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span></div>
          </section>
          ${transportPanel()}
          ${codeDisclosure('uniform')}
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="panel-heading"><h2 id="example-heading">数を代入した例</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>計算条件の既定の値 ${tex('x_0 = 0')}、${tex('v = 1')}、${tex(String.raw`\Delta t = 0.01`)} をとり、1ステップの更新に代入します。
              <p class="solution-equation">${tex(String.raw`x_1 = x_0 + v \Delta t = 0 + 1 \cdot 0.01 = 0.01`, true)}</p>
              この ${tex('x_1 = 0.01')} は厳密な値です。
            </li>
            <li>1ステップを一度進めると、画面の位置 ${tex('x')} と解析解の位置はどちらも 0.01000 です。これは小数第5位までの近似の表示で、手で求めた厳密な値 ${tex('x_1 = 0.01')} と一致します。</li>
            <li>最後のステップ ${tex('n = 1000')} の時刻は ${tex(String.raw`t = 1000 \cdot 0.01 = 10`)} です。位置の厳密な値は次の式です。
              <p class="solution-equation">${tex(String.raw`x_{1000} = 0 + 1000 \cdot 1 \cdot 0.01 = 10`, true)}</p>
              最後まで進めると、画面の位置 ${tex('x')} は近似の表示 10.00000 です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './derivative-definition.html', title: '微分の定義' },
        { href: './uniform.html', title: '等速直線運動' },
        { href: './velocity-step.html', title: '一定速度の増分' },
        { href: './integrate.html', title: '積分して解く' },
        { href: './euler.html', title: 'Euler法' },
      ])}
      ${pageFooter('')}
      ${checkedVelocityProof(`速度が一定のとき、1ステップは ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} であり、${tex('n')} 回の後は ${tex(String.raw`x_n = x_0 + n v \Delta t`)} です。`)}
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
    samples: points.map(point => ({ time: point.time, error: point.position_error ?? point.position - point.exact_position })),
  });
}

let method: StepMethod = 'euler';
const session = mountSession({
  defaults,
  model: 'position-derivative',
  downloadName: 'ergion-position-derivative.json',
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
