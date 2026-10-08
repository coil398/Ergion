import './style.css';
import { appHeader, pageFooter, rail, relatedPages } from './chrome';
import { checkedVelocityProof } from './proof';
import { clearFigure, drawConstantAcceleration, drawErrorSeries, drawTimeSeries, drawUniformMotion } from './figures';
import type { Snapshot, StepMethod } from './protocol';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { mountSession, transportPanel } from './session';
import { getCaption, patternTabs, topicTabs, type CompareSimConfig, type TopicKind } from './method-page';
import { tex } from './tex';

const defaults: CompareSimConfig = {
  schema_version: 1,
  kind: 'uniform',
  t0: 0,
  initial_position: 0,
  initial_velocity: 0,
  velocity: 1,
  acceleration: 1,
  k: 1,
  dt: 0.01,
  steps: 1000,
};

let currentTopic: TopicKind = 'uniform';
let currentMethod: StepMethod = 'euler';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('velocity-step')}
    <main id="experiment">
      <section class="intro">
        <div>
          <p class="breadcrumb">数値計算 <span>/</span> 一定速度の増分</p>
          <h1>一定速度の増分<span class="title-dot">.</span></h1>
          <p class="description">速度 ${tex('v')} が一定のとき、${tex(String.raw`x' = v`)} の1ステップは位置に ${tex(String.raw`v \Delta t`)} を足します。同じ刻みを ${tex('n')} 回繰り返すと、増分は ${tex(String.raw`n v \Delta t`)} です。</p>
        </div>
        <div class="equation" aria-label="一定速度の1ステップ。位置は速度と時間刻みの積だけ進む">
          ${tex(String.raw`x \mapsto x + v \Delta t`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">仮定と、証明したこと</h2><span class="quiet-label">有理数</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>位置を ${tex('x')}、速度を ${tex('v')}、1ステップの時間刻みを ${tex(String.raw`\Delta t`)}、回数を ${tex('n')} とします。${tex('v')} はステップごとに変わりません。${tex('x')}、${tex('v')}、${tex(String.raw`\Delta t`)} は有理数で、${tex('n')} は 0 以上の整数です。方程式は ${tex(String.raw`x' = v`)} です。
              <p class="solution-equation">${tex(String.raw`x' = v`, true)}</p>
            </li>
            <li>1ステップは、今の位置に ${tex(String.raw`v \Delta t`)} を足すことと定めます。証明したのは、その結果が次の位置になることです。
              <p class="solution-equation">${tex(String.raw`x \mapsto x + v \Delta t`, true)}</p>
            </li>
            <li>同じステップを ${tex('n')} 回繰り返すと、位置は出発点 ${tex('x_0')} から ${tex(String.raw`n v \Delta t`)} だけ進みます。${tex('n = 0')} のときは、位置は ${tex('x_0')} のままです。
              <p class="solution-equation">${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}</p>
            </li>
          </ol>
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
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption" id="sim-caption">${getCaption(currentTopic, currentMethod)}</p>
            <canvas id="oscillator" aria-label="直線上を進む粒子。速度が一定のとき、数値解法の1ステップで位置は厳密解と一致し、差は丸めだけです。数値解は青の実線、解析解は青緑の破線。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の誤差 x − x_exact</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">位置と誤差の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span><span><i class="difference"></i>誤差</span></div></div>
            ${topicTabs(currentTopic)}
            ${patternTabs(currentMethod)}
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex('x - x_{\\mathrm{exact}}')}</h3><canvas id="phase-chart" aria-label="位置の誤差と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>誤差は実線</span></div>
          </section>
          ${transportPanel()}
          ${codeDisclosure(currentMethod)}
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      ${relatedPages([
        { href: './uniform.html', title: '等速直線運動', description: '一定速度で進む粒子の運動方程式と厳密解です。' },
        { href: './derivative.html', title: '位置の時間微分', description: '速度の定義と1ステップの微小変位を解説するページです。' },
        { href: './euler.html', title: 'Euler法', description: '増分を繰り返し適用する基本の数値解法です。' },
        { href: './midpoint.html', title: '中点法', description: '中点で傾きを再評価する2次の数値解法です。' },
        { href: './rk4.html', title: '古典的RK4', description: '4次の精度で増分を計算する数値解法です。' },
      ])}
      ${pageFooter('一定速度の増分は、x + n v Δt です。')}
      ${checkedVelocityProof(`1ステップは ${tex(String.raw`x \mapsto x + v \Delta t`)} であり、${tex('n')} 回の後は ${tex(String.raw`x_n = x_0 + n v \Delta t`)} です。`)}
    </main>
  </div>`;
mountCodeDisclosure();

const form = document.querySelector<HTMLFormElement>('#config-form')!;
function readForm(): CompareSimConfig {
  const data = new FormData(form);
  const initialPosition = Number(data.get('initial_position'));
  const velocity = Number(data.get('velocity'));
  const dt = Number(data.get('dt'));
  const steps = Number(data.get('steps'));
  return {
    schema_version: 1,
    kind: currentTopic,
    t0: 0,
    initial_position: currentTopic === 'separation' && initialPosition === 0 ? 1 : initialPosition,
    initial_velocity: 0,
    velocity,
    acceleration: currentTopic === 'accelerated' ? (velocity !== 0 ? velocity : 1) : 0,
    k: currentTopic === 'separation' ? (velocity !== 0 ? velocity : 1) : 0,
    dt,
    steps,
  };
}

function fillForm(value: CompareSimConfig) {
  for (const [key, item] of Object.entries(value)) {
    const input = form.elements.namedItem(key) as HTMLInputElement | null;
    if (input) input.value = String(item);
  }
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: CompareSimConfig) {
  const canvases = ['oscillator', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${config.initial_position}|${config.velocity}|${config.dt}|${config.steps}|${currentTopic}|${currentMethod}`;
  const timeEnd = config.steps * config.dt;
  const x0 = points.reduce((earliest, point) => point.time < earliest.time ? point : earliest, points[0] ?? state).position;
  if (currentTopic === 'accelerated') {
    drawConstantAcceleration(canvases[0], {
      key,
      x0,
      position: state.position,
      exactPosition: state.exact_position,
      velocity: state.velocity,
      timeEnd,
      samples: points.map(point => ({ time: point.time, position: point.position, exactPosition: point.exact_position })),
    });
  } else {
    drawUniformMotion(canvases[0], {
      key,
      x0,
      position: state.position,
      exactPosition: state.exact_position,
      velocity: state.velocity,
      timeEnd,
      samples: points.map(point => ({ time: point.time, position: point.position, exactPosition: point.exact_position })),
    });
  }
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

const session = mountSession<CompareSimConfig>({
  defaults,
  model: 'compare',
  downloadName: 'ergion-velocity-step.json',
  readForm,
  fillForm,
  paintFigures,
  method: () => currentMethod,
});

const topicButtons = document.querySelectorAll<HTMLButtonElement>('[data-topic]');
for (const button of topicButtons) {
  button.addEventListener('click', () => {
    const topic = button.dataset.topic as TopicKind;
    if (topic === currentTopic) return;
    currentTopic = topic;
    for (const item of topicButtons) {
      item.setAttribute('aria-selected', item === button ? 'true' : 'false');
    }
    const caption = document.querySelector<HTMLParagraphElement>('#sim-caption');
    if (caption) caption.textContent = getCaption(currentTopic, currentMethod);
    const current = readForm();
    session.reloadConfig({ kind: currentTopic, initial_position: current.initial_position, velocity: current.velocity, acceleration: current.acceleration, k: current.k });
  });
}

const methodButtons = document.querySelectorAll<HTMLButtonElement>('[data-method]');
for (const button of methodButtons) {
  button.addEventListener('click', () => {
    const nextMethod = button.dataset.method as StepMethod;
    if (nextMethod === currentMethod) return;
    currentMethod = nextMethod;
    for (const item of methodButtons) {
      item.setAttribute('aria-selected', item === button ? 'true' : 'false');
    }
    setCodeMethod(currentMethod);
    const caption = document.querySelector<HTMLParagraphElement>('#sim-caption');
    if (caption) caption.textContent = getCaption(currentTopic, currentMethod);
    session.reloadMethod();
  });
}
