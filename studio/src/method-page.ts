import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages, type RelatedLink } from './chrome';
import { clearFigure, drawConstantAcceleration, drawErrorSeries, drawTimeSeries, drawUniformMotion } from './figures';
import type { Snapshot, StepMethod } from './protocol';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod, setCodeProblem } from './code-panel';
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
    return '速度 v が一定のとき、ステップの繰り返しは厳密解 x_0 + v t と一致します。';
  }
  if (topic === 'accelerated') {
    if (method === 'euler') {
      return '加速度 a が一定のとき、Euler法ではステップを繰り返すにつれて位置の打ち切り誤差が累積し、増大します。';
    }
    if (method === 'midpoint') {
      return '加速度 a が一定のとき、中点法の増分は2次の厳密な増分と一致します。';
    }
    return '加速度 a が一定のとき、古典的RK4の増分は2次の厳密な増分と一致します。';
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
      { href: './midpoint.html', title: '中点法' },
      { href: './rk4.html', title: '古典的RK4' },
      { href: './velocity-step.html', title: '一定速度の増分' },
      { href: './uniform.html', title: '等速直線運動' },
      { href: './accelerated.html', title: '等加速度直線運動' },
      { href: './separation.html', title: '変数分離' },
    ];
  }
  if (method === 'midpoint') {
    return [
      { href: './euler.html', title: 'Euler法' },
      { href: './rk4.html', title: '古典的RK4' },
      { href: './accelerated.html', title: '等加速度直線運動' },
      { href: './velocity-step.html', title: '一定速度の増分' },
      { href: './separation.html', title: '変数分離' },
    ];
  }
  return [
    { href: './euler.html', title: 'Euler法' },
    { href: './midpoint.html', title: '中点法' },
    { href: './accelerated.html', title: '等加速度直線運動' },
    { href: './separation.html', title: '変数分離' },
    { href: './velocity-step.html', title: '一定速度の増分' },
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

  const line = (source: string) => `<p class="solution-equation">${tex(source, true)}</p>`;
  const reduction = method === 'euler'
    ? `このページでは ${tex('f(x, t) = v')} なので、始点の傾きは次の値です。
                ${line('f(x_n, t_n) = v')}
                更新式に代入します。
                ${line(String.raw`x_{n+1} = x_n + \Delta t \, v = x_n + v \Delta t`)}`
    : method === 'midpoint'
      ? `始点の傾きを ${tex('k_1')}、始点から ${tex(String.raw`\frac{\Delta t}{2}`)} だけ仮に進んだ中点の傾きを ${tex('k_2')} と書きます。
                ${line('k_1 = f(x_n, t_n)')}
                ${line(String.raw`k_2 = f\left(x_n + \frac{\Delta t}{2} k_1,\ t_n + \frac{\Delta t}{2}\right)`)}
                このページでは ${tex('f(x, t) = v')} であり、どの点でも値は ${tex('v')} です。
                ${line('k_1 = v')}
                ${line(String.raw`k_2 = f\left(x_n + \frac{\Delta t}{2} v,\ t_n + \frac{\Delta t}{2}\right) = v`)}
                更新式に代入します。
                ${line(String.raw`x_{n+1} = x_n + \Delta t \, v = x_n + v \Delta t`)}`
      : `始点の傾きを ${tex('k_1')}、中点で求めた二つの傾きを ${tex('k_2')}、${tex('k_3')}、終点で求めた傾きを ${tex('k_4')} と書きます。
                ${line('k_1 = f(x_n, t_n)')}
                ${line(String.raw`k_2 = f\left(x_n + \frac{\Delta t}{2} k_1,\ t_n + \frac{\Delta t}{2}\right)`)}
                ${line(String.raw`k_3 = f\left(x_n + \frac{\Delta t}{2} k_2,\ t_n + \frac{\Delta t}{2}\right)`)}
                ${line(String.raw`k_4 = f\left(x_n + \Delta t \, k_3,\ t_n + \Delta t\right)`)}
                このページでは ${tex('f(x, t) = v')} であり、どの点でも値は ${tex('v')} です。
                ${line('k_1 = k_2 = k_3 = k_4 = v')}
                更新式に代入し、括弧の中をまとめます。
                ${line(String.raw`x_{n+1} = x_n + \frac{\Delta t}{6}(v + 2v + 2v + v)`)}
                ${line(String.raw`= x_n + \frac{\Delta t}{6} \cdot 6v = x_n + v \Delta t`)}`;
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
            <p class="description">例は ${tex(String.raw`x' = v`)} で、速度 ${tex('v')} は一定です。厳密解は ${tex('x(t) = x_0 + v t')} です。</p>
          </div>
        </section>
        <section class="study panel" id="study" aria-labelledby="study-heading">
          <div class="panel-heading"><h2 id="study-heading">${options.title}の1ステップ</h2></div>
          <div class="study-body">
            <ol class="solution">
              <li>直線上の位置を ${tex('x')}、時刻を ${tex('t')}、速度を ${tex('v')} とします。このページの例の方程式は ${tex(String.raw`x' = v`)} です。速度は時刻にも位置にもよりません。初期位置を ${tex('x_0')} と書くと、厳密解は ${tex('x(t) = x_0 + v t')} です。</li>
              <li>方程式の右辺を関数 ${tex('f')} と書き、${tex(String.raw`x' = f(x, t)`)} とします。ステップ番号を ${tex('n')}、時刻 ${tex('t_n')} での位置を ${tex('x_n')}、時間刻みを ${tex(String.raw`\Delta t`)} とします。${options.prose}（${coreStepDoc(options.fn, '1ステップの説明')}）
                <p class="solution-equation">${tex(options.formula, true)}</p>
                ${reduction}
              </li>
              <li>厳密解を ${tex(String.raw`\Delta t`)} だけ進めた増分は次の式です。
                <p class="solution-equation">${tex(String.raw`x(t_n + \Delta t) - x(t_n) = \left(x_0 + v t_n + v \Delta t\right) - \left(x_0 + v t_n\right) = v \Delta t`, true)}</p>
                数値ステップの増分 ${tex(String.raw`x_{n+1} - x_n = v \Delta t`)} はこれと一致します。打ち切り誤差はありません。画面に出る誤差 ${tex('x - x_{\\mathrm{exact}}')} は近似の値で、計算機が数を有限の桁で表すことによる丸めだけです。
              </li>
            </ol>
            <p>画面は、各時刻に返された数値解の位置と、誤差 ${tex('x - x_{\\mathrm{exact}}')} を描きます。厳密解の式を、描画のために計算し直すことはありません。青の実線が数値解、青緑の破線が厳密解です。</p>
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
            ${codeDisclosure(currentTopic, method)}
            <p id="error" role="alert" hidden></p>
            <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
          </div>
        </div>
        <section class="study panel" id="example" aria-labelledby="example-heading">
          <div class="panel-heading"><h2 id="example-heading">数を代入した例</h2></div>
          <div class="study-body">
            <ol class="solution">
              <li>計算条件の既定の値 ${tex('x_0 = 0')}、${tex('v = 1')}、${tex(String.raw`\Delta t = 0.01`)} をとります。上の手順のとおり、${options.title}の1ステップは ${tex(String.raw`x_{n+1} = x_n + v \Delta t`)} です。
                <p class="solution-equation">${tex(String.raw`x_1 = 0 + 1 \cdot 0.01 = 0.01`, true)}</p>
                この値は厳密で、厳密解の ${tex('x(0.01) = 0 + 1 \\cdot 0.01 = 0.01')} と同じです。
              </li>
              <li>一定速度のタブで1ステップを一度進めると、画面の位置 ${tex('x')} と解析解の位置はどちらも 0.01000 です。これは小数第5位までの近似の表示です。</li>
            </ol>
          </div>
        </section>
        ${relatedPages(getRelatedLinksForMethod(method))}
        ${pageFooter('')}
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
      setCodeProblem(currentTopic);
      const current = readForm();
      session.reloadConfig({ kind: currentTopic, initial_position: current.initial_position, velocity: current.velocity, acceleration: current.acceleration, k: current.k });
    });
  }
}
