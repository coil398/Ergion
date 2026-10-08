import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages, type RelatedLink } from './chrome';
import { clearFigure, drawConstantAcceleration, drawErrorSeries, drawTimeSeries, drawUniformMotion } from './figures';
import type { Snapshot, StepMethod } from './protocol';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { mountSession, transportPanel, type TimedConfig } from './session';
import { tex } from './tex';

export type TopicKind = 'uniform' | 'accelerated' | 'separation';

export interface CompareSimConfig extends TimedConfig {
  schema_version: 1;
  kind: TopicKind;
  t0: number;
  initial_position: number;
  initial_velocity: number;
  velocity: number;
  acceleration: number;
  k: number;
  dt: number;
  steps: number;
}

export function getCaption(topic: TopicKind, method: StepMethod): string {
  if (topic === 'uniform') {
    return '速度 v が一定のとき、ステップの繰り返しは厳密解 x_0 + v t と一致します。位置の差は浮動小数点の丸めだけです。';
  }
  if (topic === 'accelerated') {
    if (method === 'euler') {
      return '加速度 a が一定のとき、Euler法ではステップを繰り返すにつれて位置の打ち切り誤差が累積し、増大します。';
    }
    if (method === 'midpoint') {
      return '加速度 a が一定のとき、中点法の増分は2次の厳密な増分と一致し、残る差は浮動小数点の丸めだけです。';
    }
    return '加速度 a が一定のとき、古典的RK4の増分は2次の厳密な増分と一致し、残る差は浮動小数点の丸めだけです。';
  }
  return '変数分離 x\' = kx では、どの数値解法も打ち切り誤差を持ち、誤差は時刻とともに増大します。古典的RK4はEuler法より厳密解の近くに留まります。';
}

export function topicTabs(current: TopicKind = 'uniform'): string {
  return `
    <div class="method-tabs" role="tablist" aria-label="シミュレーションの題材">
      <button type="button" class="method-tab" role="tab" data-topic="uniform" aria-selected="${current === 'uniform' ? 'true' : 'false'}">一定速度</button>
      <button type="button" class="method-tab" role="tab" data-topic="accelerated" aria-selected="${current === 'accelerated' ? 'true' : 'false'}">等加速度</button>
      <button type="button" class="method-tab" role="tab" data-topic="separation" aria-selected="${current === 'separation' ? 'true' : 'false'}">変数分離</button>
    </div>`;
}

export function patternTabs(current: StepMethod = 'euler'): string {
  return `
    <div class="method-tabs" role="tablist" aria-label="数値解法のパターン">
      <button type="button" class="method-tab" role="tab" data-method="euler" aria-selected="${current === 'euler' ? 'true' : 'false'}">Euler法</button>
      <button type="button" class="method-tab" role="tab" data-method="midpoint" aria-selected="${current === 'midpoint' ? 'true' : 'false'}">中点法</button>
      <button type="button" class="method-tab" role="tab" data-method="rk4" aria-selected="${current === 'rk4' ? 'true' : 'false'}">古典的RK4</button>
    </div>`;
}

function getRelatedLinksForMethod(method: StepMethod): RelatedLink[] {
  if (method === 'euler') {
    return [
      { href: './midpoint.html', title: '中点法', description: '2次の精度に改良したRunge–Kutta法です。' },
      { href: './rk4.html', title: '古典的RK4', description: '4次の精度をもつ標準的な数値解法です。' },
      { href: './velocity-step.html', title: '一定速度の増分', description: '増分を繰り返し適用する数値計算の基礎です。' },
      { href: './uniform.html', title: '等速直線運動', description: '丸め誤差のみが現れる等速運動のシミュレーションです。' },
      { href: './accelerated.html', title: '等加速度直線運動', description: '打ち切り誤差の累積が現れる運動のシミュレーションです。' },
      { href: './separation.html', title: '変数分離', description: '指数関数解に対する打ち切り誤差が現れる例です。' },
    ];
  }
  if (method === 'midpoint') {
    return [
      { href: './euler.html', title: 'Euler法', description: '1次の基本数値解法です。' },
      { href: './rk4.html', title: '古典的RK4', description: '4次の精度をもつ標準的な数値解法です。' },
      { href: './accelerated.html', title: '等加速度直線運動', description: '中点法で2次の増分が厳密に一致する運動です。' },
      { href: './velocity-step.html', title: '一定速度の増分', description: '1ステップの反復と誤差を比較するページです。' },
      { href: './separation.html', title: '変数分離', description: '中点法による打ち切り誤差の推移を見る例です。' },
    ];
  }
  return [
    { href: './euler.html', title: 'Euler法', description: '1次の基本数値解法です。' },
    { href: './midpoint.html', title: '中点法', description: '2次のRunge–Kutta法です。' },
    { href: './accelerated.html', title: '等加速度直線運動', description: '高次の増分まで一致する運動のシミュレーションです。' },
    { href: './separation.html', title: '変数分離', description: 'Euler法に比べ誤差が極めて小さく保たれる例です。' },
    { href: './velocity-step.html', title: '一定速度の増分', description: '1ステップの反復と誤差を比較するページです。' },
  ];
}

/** 一つの数値解法だけを説明するページ。例は、速度が一定の x' = v です。 */
export function mountMethodPage(options: {
  page: 'euler' | 'midpoint' | 'rk4';
  method: StepMethod;
  title: string;
  /** ページの図の画像の代替テキスト。 */
  figureAlt: string;
  fn: 'euler_step' | 'midpoint_step' | 'rk4_step';
  formula: string;
  prose: string;
}) {
  let currentTopic: TopicKind = 'uniform';
  const method = options.method;

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

  const reduction = method === 'euler'
    ? `このページでは ${tex('f(x_n, t_n) = v')} です。${tex('v')} は一定なので、上の式は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と同じです。`
    : method === 'midpoint'
      ? `${tex('v')} が一定ならば、始点の傾きも中点の傾きも ${tex('v')} です。したがって ${tex('k_2 = v')} であり、更新は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と一致します。`
      : `${tex('v')} が一定ならば、四つの傾きはみな ${tex('v')} です。重み付きの和は ${tex('v')} になり、更新は ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} と一致します。`;
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
    ${appHeader('計算環境を準備中')}
    <div class="workspace">
      ${rail(options.page)}
      <main id="experiment">
        <section class="intro">
          <div>
            <p class="breadcrumb">数値計算 <span>/</span> ${options.title}</p>
            <h1>${options.title}<span class="title-dot">.</span></h1>
            <p class="description">このページは ${options.title} だけを説明します。例は ${tex(String.raw`x' = v`)} で、速度 ${tex('v')} は一定です。厳密解は ${tex('x(t) = x_0 + v t')} です。</p>
          </div>
          <div class="equation" aria-label="${options.title}の更新式">
            ${tex(options.formula, true)}
          </div>
        </section>
        <section class="study panel" id="study" aria-labelledby="study-heading">
          <div class="panel-heading"><h2 id="study-heading">${options.title}の1ステップ</h2></div>
          <div class="study-body">
            <ol class="solution">
              <li>直線上の位置を ${tex('x')}、時刻を ${tex('t')}、速度を ${tex('v')} とします。このページの例の方程式は ${tex(String.raw`x' = v`)} です。速度は時刻にも位置にもよりません。厳密解は ${tex('x(t) = x_0 + v t')} です。</li>
              <li>${options.prose}（${coreStepDoc(options.fn, '1ステップの説明')}）
                <p class="solution-equation">${tex(options.formula, true)}</p>
                <p>${reduction}これは厳密解 ${tex('x(t) = x_0 + v t')} の増分と一致します。打ち切り誤差はありません。各時刻の誤差 ${tex('x - x_{\\mathrm{exact}}')} は、倍精度浮動小数点の丸めだけです。</p>
              </li>
            </ol>
            <p>画面は、各時刻に返された数値解の位置と、誤差 ${tex('x - x_{\\mathrm{exact}}')} を描きます。厳密解の式を、描画のために計算し直すことはありません。青の実線が数値解、青緑の破線が厳密解です。誤差は、その破線とは別の実線です。</p>
          </div>
        </section>
        ${pageFigure(options.page, options.figureAlt)}
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
              <p class="scene-caption" id="sim-caption">${getCaption(currentTopic, method)}</p>
              <canvas id="oscillator" aria-label="直線上を進む粒子。速度が一定のとき、この数値解法の1ステップで位置は速度と時間刻みの積だけ進みます。数値解は青の実線、解析解は青緑の破線。" role="img"></canvas>
              <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の誤差 x − x_exact</span><output id="energy-error">—</output></div></div>
            </section>
            <section class="plots panel" aria-labelledby="plots-heading">
              <div class="panel-heading"><h2 id="plots-heading">位置と誤差の時間変化</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span><span><i class="difference"></i>誤差</span></div></div>
              ${topicTabs(currentTopic)}
              <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex('x - x_{\\mathrm{exact}}')}</h3><canvas id="phase-chart" aria-label="位置の誤差と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
              <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span></div>
            </section>
            ${transportPanel()}
            ${codeDisclosure(method)}
            <p id="error" role="alert" hidden></p>
            <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
          </div>
        </div>
        ${relatedPages(getRelatedLinksForMethod(method))}
        ${pageFooter(`この画面は、速度が一定の x' = v を、${options.title}で1ステップ進めます。`)}
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
    const key = `${config.initial_position}|${config.velocity}|${config.dt}|${config.steps}|${currentTopic}|${method}`;
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
    downloadName: `ergion-${method}.json`,
    readForm,
    fillForm,
    paintFigures,
    method: () => method,
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
      if (caption) caption.textContent = getCaption(currentTopic, method);
      const current = readForm();
      session.reloadConfig({ kind: currentTopic, initial_position: current.initial_position, velocity: current.velocity, acceleration: current.acceleration, k: current.k });
    });
  }
}
