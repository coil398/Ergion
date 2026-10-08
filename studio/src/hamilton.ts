import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'analytical/hamilton',
  mass: 1,
  length: 1,
  gravity: 1,
  amplitude: 1,
  dt: 0.1,
  steps: 300,
};

renderLesson({
  id: 'hamilton',
  section: { label: '解析力学' },
  title: 'Legendre 変換と Hamilton の正準方程式',
  description: `Lagrange 関数 ${tex(String.raw`L(q, \dot q)`)} の速度 ${tex(String.raw`\dot q`)} を正準運動量 ${tex('p')} に取りかえる Legendre 変換で Hamilton 関数 ${tex('H(q, p)')} を作り、運動を位置と運動量の相空間 ${tex('(q, p)')} の1階の方程式で表します。単振子の正準方程式を三つの数値解法で解き、軌道が等エネルギー線 ${tex('H = E')} に沿うことを確かめます。`,
  equation: [
    String.raw`p = \frac{\partial L}{\partial \dot q},\qquad H(q, p) = p\,\dot q - L`,
    String.raw`\dot q = \frac{\partial H}{\partial p},\qquad \dot p = -\frac{\partial H}{\partial q}`,
  ],
  equationLabel: '正準運動量 p は L の q ドットによる偏微分、Hamilton 関数 H は p 掛ける q ドット ひく L。q ドットは H の p による偏微分、p ドットは マイナス H の q による偏微分。',
  studyHeading: 'Legendre 変換から正準方程式を導く手順',
  steps: [
    `記号を定めます。${tex('q')} は一般化座標、${tex(String.raw`\dot q = dq/dt`)} は一般化速度、${tex(String.raw`L(q, \dot q)`)} は Lagrange 関数です。正準運動量を
      ${eq(String.raw`p = \frac{\partial L}{\partial \dot q}(q, \dot q)`)}
      と定めます。${tex(String.raw`\partial^2 L/\partial \dot q^2 \ne 0`)} なら、この式を ${tex(String.raw`\dot q`)} について解いて ${tex(String.raw`\dot q = \dot q(q, p)`)} と書けます。Hamilton 関数は、その ${tex(String.raw`\dot q`)} を代入した
      ${eq(String.raw`H(q, p) = p\,\dot q(q, p) - L\big(q, \dot q(q, p)\big)`)}
      です（${coreDoc('analytical', 'legendre_transform', 'Legendre 変換の説明')}）。`,
    `${tex('H')} の偏微分を求めます。${tex(String.raw`\dot q`)} は ${tex('q')} と ${tex('p')} の関数なので、合成関数の微分により
      ${eq(String.raw`\frac{\partial H}{\partial p} = \dot q + p\,\frac{\partial \dot q}{\partial p} - \frac{\partial L}{\partial \dot q}\frac{\partial \dot q}{\partial p} = \dot q + \left(p - \frac{\partial L}{\partial \dot q}\right)\frac{\partial \dot q}{\partial p} = \dot q`)}
      ${eq(String.raw`\frac{\partial H}{\partial q} = p\,\frac{\partial \dot q}{\partial q} - \frac{\partial L}{\partial q} - \frac{\partial L}{\partial \dot q}\frac{\partial \dot q}{\partial q} = -\frac{\partial L}{\partial q}`)}
      です。どちらも括弧の中は ${tex(String.raw`p = \partial L/\partial \dot q`)} より 0 です。`,
    `Euler–Lagrange 方程式 ${tex(String.raw`\frac{d}{dt}\frac{\partial L}{\partial \dot q} = \frac{\partial L}{\partial q}`)} の左辺は ${tex(String.raw`\dot p`)}、右辺は前の手順より ${tex(String.raw`-\partial H/\partial q`)} です。したがって運動は
      ${eq(String.raw`\dot q = \frac{\partial H}{\partial p},\qquad \dot p = -\frac{\partial H}{\partial q}`)}
      の二つの1階の方程式で表せます。これを Hamilton の正準方程式と呼びます。2階の方程式一つが、相空間 ${tex('(q, p)')} の1階の方程式二つになりました。`,
    `単振動に当てはめます。${tex('m')} は質量、${tex('k')} はばね定数です。
      ${eq(String.raw`L = \frac{1}{2} m\dot q^2 - \frac{1}{2} k q^2`)}
      ${eq(String.raw`p = \frac{\partial L}{\partial \dot q} = m\dot q,\qquad \dot q = \frac{p}{m}`)}
      ${eq(String.raw`H = p\cdot\frac{p}{m} - \frac{1}{2} m\left(\frac{p}{m}\right)^2 + \frac{1}{2} k q^2 = \frac{p^2}{2m} + \frac{1}{2} k q^2`)}
      ${eq(String.raw`\dot q = \frac{\partial H}{\partial p} = \frac{p}{m},\qquad \dot p = -\frac{\partial H}{\partial q} = -k q`)}
      です（${coreDoc('analytical', 'oscillator_hamiltonian', '単振動の Hamilton 関数の説明')}）。第1式を微分して第2式に代入すると ${tex(String.raw`m\ddot q = -k q`)} に戻ります。`,
    `単振子に当てはめます。${tex(String.raw`\theta`)} は鉛直下向きから測った振れ角、${tex('l')} は糸の長さ、${tex('g')} は重力加速度です。
      ${eq(String.raw`L = \frac{1}{2} m l^2\dot\theta^2 - m g l\,(1 - \cos\theta)`)}
      ${eq(String.raw`p = \frac{\partial L}{\partial \dot\theta} = m l^2\dot\theta,\qquad \dot\theta = \frac{p}{m l^2}`)}
      ${eq(String.raw`H = p\cdot\frac{p}{m l^2} - \frac{1}{2} m l^2\left(\frac{p}{m l^2}\right)^2 + m g l\,(1 - \cos\theta) = \frac{p^2}{2 m l^2} + m g l\,(1 - \cos\theta)`)}
      ${eq(String.raw`\dot\theta = \frac{\partial H}{\partial p} = \frac{p}{m l^2},\qquad \dot p = -\frac{\partial H}{\partial \theta} = -m g l\sin\theta`)}
      です（${coreDoc('analytical', 'pendulum_hamiltonian', '単振子の Hamilton 関数の説明')}、${coreDoc('analytical', 'pendulum_flow', '正準方程式の右辺の説明')}）。`,
    `${tex('H')} は運動に沿って一定です。正準方程式を代入すると
      ${eq(String.raw`\frac{dH}{dt} = \frac{\partial H}{\partial \theta}\dot\theta + \frac{\partial H}{\partial p}\dot p = \frac{\partial H}{\partial \theta}\frac{\partial H}{\partial p} - \frac{\partial H}{\partial p}\frac{\partial H}{\partial \theta} = 0`)}
      です。振幅 ${tex(String.raw`\theta_0`)} で静止から放すと ${tex(String.raw`E = H(\theta_0, 0) = m g l\,(1 - \cos\theta_0)`)} で、軌道は等エネルギー線
      ${eq(String.raw`p = \pm\sqrt{2 m l^2\big(E - m g l\,(1 - \cos\theta)\big)},\qquad -\theta_0 \le \theta \le \theta_0`)}
      の上を回ります（${coreDoc('analytical', 'pendulum_level_set', '等エネルギー線の説明')}）。厳密解 ${tex(String.raw`\theta(t)`)} は Jacobi の楕円関数で書けます（${coreDoc('analytical', 'pendulum_angle', '単振子の厳密解の説明')}）。`,
    `数値解法を定めます。${tex(String.raw`V(\theta) = m g l\,(1 - \cos\theta)`)}、${tex(String.raw`\Delta t`)} を時間刻みとします。シンプレクティック Euler 法は、運動量を先に進め、新しい運動量で角を進めます。
      ${eq(String.raw`p_{n+1} = p_n - \Delta t\,V'(\theta_n),\qquad \theta_{n+1} = \theta_n + \Delta t\,\frac{p_{n+1}}{m l^2}`)}
      （${coreDoc('analytical', 'symplectic_euler_step', 'シンプレクティック Euler 法の説明')}）。速度 Verlet 法は、運動量を半分ずつ2回に分けて進めます。
      ${eq(String.raw`p_{n+1/2} = p_n - \frac{\Delta t}{2} V'(\theta_n),\qquad \theta_{n+1} = \theta_n + \Delta t\,\frac{p_{n+1/2}}{m l^2},\qquad p_{n+1} = p_{n+1/2} - \frac{\Delta t}{2} V'(\theta_{n+1})`)}
      古典的RK4 は、右辺 ${tex(String.raw`(p/(ml^2),\ -V'(\theta))`)} を1ステップで4回評価します。前の二つは相空間の面積を厳密に保つ写像で、${tex('H')} の誤差は増え続けずに一定の幅で揺れます。古典的RK4 は面積を厳密には保たず、誤差は小さいものの同じ向きに少しずつ積み重なります。`,
  ],
  figureAlt: '位置と速度の配位空間から位置と運動量の相空間への対応と、等エネルギー線の閉曲線。',
  figure: experimentPanel({
    fieldsetLabel: '単振子',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'length', label: '糸の長さ', symbol: 'l', value: 1, min: 0 },
      { name: 'gravity', label: '重力加速度', symbol: 'g', value: 1, min: 0 },
      { name: 'amplitude', label: '振幅', symbol: String.raw`\theta_0`, value: 1, min: 0, max: 3.14 },
    ],
    dt: 0.1,
    steps: 300,
    sceneHeading: '単振子のおもりの位置',
    sceneCaption: 'おもりは数値解の振れ角の位置にあります。青緑の破線の輪は同じ時刻の厳密解の位置です。',
    sceneLabel: '支点から糸でつるされて振れる単振子',
    sceneHeight: 260,
    readouts: { position: '振れ角 θ（数値解）', velocity: '運動量 p（数値解）', exact: '厳密解の θ', error: '差 θ − θ_exact' },
    plotsHeading: '相空間の軌道とエネルギーの誤差',
    tabs: methodTabs('正準方程式の数値解法', [
      { id: 'symplectic-euler', label: 'シンプレクティック Euler 法' },
      { id: 'rk4', label: '古典的RK4' },
      { id: 'verlet', label: '速度 Verlet 法' },
    ]),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>相空間の軌道 ${tex(String.raw`(\theta, p)`)}</h3><canvas id="phase-chart" role="img"></canvas><p>振れ角 θ（縦軸は運動量 p）</p></div><div class="plot-phase"><h3>エネルギーの誤差 ${tex('H - E')}</h3><canvas id="energy-chart" role="img"></canvas><p>時間 t</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `単振動で ${tex('m = 1')}、${tex('k = 4')} とします。${tex('q = 1')}、${tex(String.raw`\dot q = 0`)} では ${tex('p = 0')} で
      ${eq(String.raw`H = \frac{0^2}{2\cdot 1} + \frac{1}{2}\cdot 4\cdot 1^2 = 2`)}
      です。${tex('q = 0')}、${tex(String.raw`\dot q = 2`)} では ${tex(String.raw`p = 1\cdot 2 = 2`)} で ${tex(String.raw`H = \frac{2^2}{2} + 0 = 2`)} です。どちらも厳密に 2 で、二つの点は同じ等エネルギーの楕円の上にあります。`,
    `単振子で ${tex('m = l = g = 1')}、${tex(String.raw`\theta_0 = 1`)} とします。エネルギーと、最下点 ${tex(String.raw`\theta = 0`)} での運動量は
      ${eq(String.raw`E = 1 - \cos 1 \approx 0.459698,\qquad p_{\max} = \sqrt{2E} = 2\sin\frac{1}{2} \approx 0.958851`)}
      です。式の形が厳密な値で、小数は近似です。`,
    `シンプレクティック Euler 法で ${tex(String.raw`\Delta t = 0.1`)} の1ステップを手で進めます。${tex(String.raw`V'(\theta) = \sin\theta`)} なので
      ${eq(String.raw`p_1 = 0 - 0.1\sin 1 \approx -0.0841471`)}
      ${eq(String.raw`\theta_1 = 1 + 0.1\times(-0.0841471) \approx 0.991585`)}
      です。「1ステップ」を押すと、計器の振れ角は 0.99159、運動量は −0.08415（どちらも近似）になります。300 ステップ（${tex('t = 30')}）まで進めると、${tex('|H - E|')} の最大値は、シンプレクティック Euler 法で約 ${tex(String.raw`2.3\times 10^{-2}`)}、速度 Verlet 法で約 ${tex(String.raw`1.1\times 10^{-3}`)}、古典的RK4 で約 ${tex(String.raw`1.4\times 10^{-6}`)} です（いずれも近似）。`,
  ],
  related: [
    { href: './harmonic.html', title: '単振動' },
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
    { href: './liouville.html', title: '相空間と Liouville の定理' },
    { href: './poisson.html', title: '正準変換と Poisson 括弧' },
  ],
  footer: 'この画面の計算は、静止から放した一つの単振子の正準方程式です。',
});

const form = formReader(defaults);
let method = 'symplectic-euler';

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'phase-chart', 'energy-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const l = frame.values.length;
  drawPlot(canvases[0], {
    key: `${key}|scene`,
    label: '単振子。点は数値解のおもり、破線の輪は厳密解のおもり。',
    equalAspect: true,
    xMin: -1.2 * l,
    xMax: 1.2 * l,
    yMin: -1.2 * l,
    yMax: 0.25 * l,
    lines: [line(frame, 'rod')],
    dots: [dot(frame, 'pivot'), { ...dot(frame, 'bob-exact', undefined, true), radius: 8 }, { ...dot(frame, 'bob', 'm'), radius: 7 }],
  });
  const pm = 1.15 * frame.values.momentum_max;
  drawPlot(canvases[1], {
    key: `${key}|phase`,
    label: '相空間の軌道。実線は数値解、破線は等エネルギー線 H = E。',
    yMin: -pm,
    yMax: pm,
    lines: [line(frame, 'phase-exact'), line(frame, 'phase-trail')],
    dots: [dot(frame, 'phase-exact', undefined, true), dot(frame, 'phase')],
    zeroLabel: 'p = 0',
  });
  drawPlot(canvases[2], {
    key: `${key}|energy`,
    label: 'エネルギーの誤差と時間のグラフ。厳密解は 0 の線。',
    xMin: 0,
    xMax: config.steps * config.dt,
    lines: [line(frame, 'energy-error')],
    dots: [dot(frame, 'energy-now')],
    zeroLabel: '厳密解 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-hamilton.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    return [
      `数値解の H(θ, p) = ${v.energy.toFixed(6)}`,
      `厳密な E = ${v.exact_energy.toFixed(6)}`,
      `最大の |H − E| = ${v.max_energy_error.toExponential(2)}`,
    ].join('\n');
  },
});
bindMethodTabs<string>(next => {
  method = next;
  session.reloadMethod();
});
