import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot, drawSpringMass } from './figures';
import { eq, experimentPanel, formReader, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'mechanics/harmonic',
  mass: 1,
  spring_constant: 4,
  initial_position: 1,
  initial_velocity: 0,
  dt: 0.01,
  steps: 1000,
};

renderLesson({
  id: 'harmonic',
  section: { label: '力学', href: './' },
  title: '単振動',
  description: `原点からの変位 ${tex('x')} に比例する復元力 ${tex('-kx')} だけを受ける質点の運動です。特性方程式から厳密解を導き、力学的エネルギーが一定であることを確かめます。`,
  equation: [String.raw`m x'' = -k x`, String.raw`x(t) = x_0 \cos\omega t + \frac{v_0}{\omega}\sin\omega t`],
  equationLabel: '単振動の運動方程式。m x の2階微分は マイナス k x。',
  equationNote: '固有角振動数 ω = √(k/m)',
  studyHeading: '特性方程式から厳密解への手順',
  steps: [
    `記号を定めます。${tex('m > 0')} は質量、${tex('k > 0')} はばね定数、${tex('x(t)')} は時刻 ${tex('t')} における原点からの変位、${tex(`v = x'`)} は速度です。初期条件は ${tex('x(0) = x_0')}、${tex(`x'(0) = v_0`)} とします。Hooke の法則により、ばねが質点に及ぼす力は ${tex('F = -kx')} です。`,
    `Newton の運動方程式 ${tex(`m x'' = F`)} に代入し、両辺を ${tex('m')} で割ります。
      ${eq(String.raw`m x'' = -k x`)}
      ${eq(String.raw`x'' + \frac{k}{m} x = 0`)}
      ${tex(String.raw`\omega = \sqrt{k/m}`)} と置くと
      ${eq(String.raw`x'' + \omega^2 x = 0`)}
      です。${tex(String.raw`\omega`)} を固有角振動数と呼びます。`,
    `${tex('x = e^{rt}')} と置いて代入します。${tex(`x'' = r^2 e^{rt}`)} なので
      ${eq(String.raw`r^2 e^{rt} + \omega^2 e^{rt} = 0`)}
      ${tex('e^{rt} \\neq 0')} で割ると、特性方程式は
      ${eq(String.raw`r^2 + \omega^2 = 0`)}
      ${eq(String.raw`r = \pm i\omega`)}
      です。根が純虚数なので、実数の一般解は任意定数 ${tex('A')}、${tex('B')} を用いて
      ${eq(String.raw`x(t) = A\cos\omega t + B\sin\omega t`)}
      です。`,
    `初期条件から定数を決めます。${tex('t = 0')} で ${tex(String.raw`\cos 0 = 1`)}、${tex(String.raw`\sin 0 = 0`)} なので
      ${eq(String.raw`x(0) = A = x_0`)}
      速度は
      ${eq(String.raw`x'(t) = -A\omega\sin\omega t + B\omega\cos\omega t`)}
      ${eq(String.raw`x'(0) = B\omega = v_0`)}
      ${eq(String.raw`B = \frac{v_0}{\omega}`)}
      です。したがって厳密解は
      ${eq(String.raw`x(t) = x_0\cos\omega t + \frac{v_0}{\omega}\sin\omega t`)}
      ${eq(String.raw`v(t) = -x_0\omega\sin\omega t + v_0\cos\omega t`)}
      です（${coreDoc('mechanics', 'harmonic_position', '位置の厳密解の説明')}）。周期は ${tex(String.raw`T = 2\pi/\omega`)} です。`,
    `力学的エネルギーを ${tex(String.raw`E = \frac{1}{2} m v^2 + \frac{1}{2} k x^2`)} と定めます（${coreDoc('mechanics', 'spring_energy', 'エネルギーの説明')}）。厳密解では ${tex('E')} は一定で、位置と速度の組 ${tex('(x, v)')} は楕円
      ${eq(String.raw`\frac{x^2}{2E/k} + \frac{v^2}{2E/m} = 1`)}
      の上を回ります。数値解では、Euler 法は1周ごとに ${tex('E')} を増やし、楕円の外へ広がります。中点法と古典的RK4 の差は、刻みを小さくすると速く小さくなります。`,
  ],
  figureAlt: '単振動の位置の時間変化と、位置と速度の楕円の位相図。',
  figure: experimentPanel({
    fieldsetLabel: 'ばねと質点',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'spring_constant', label: 'ばね定数', symbol: 'k', value: 4, min: 0 },
      { name: 'initial_position', label: '初期位置', symbol: 'x_0', value: 1 },
      { name: 'initial_velocity', label: '初期速度', symbol: 'v_0', value: 0 },
    ],
    dt: 0.01,
    steps: 1000,
    sceneHeading: 'ばねにつながれた質点',
    sceneCaption: '質点は数値解の位置にあります。青緑の破線の輪は同じ時刻の厳密解の位置、橙の矢印は速度の向きです。',
    sceneLabel: 'ばねにつながれて往復する質点',
    readouts: { position: '位置 x', velocity: '速度 v', exact: '厳密解の位置', error: '位置の差 x − x_exact' },
    plotsHeading: '位置の時間変化と位相図',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置と速度の位相図</h3><canvas id="phase-chart" role="img"></canvas><p>位置 x（縦軸は速度 v）</p></div></div>`,
    code: codeDisclosure('euler'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 1')}、${tex('k = 4')}、${tex('x_0 = 1')}、${tex('v_0 = 0')} とします。固有角振動数と周期は
      ${eq(String.raw`\omega = \sqrt{4/1} = 2,\qquad T = \frac{2\pi}{2} = \pi`)}
      で、厳密解は ${tex(String.raw`x(t) = \cos 2t`)}、${tex(String.raw`v(t) = -2\sin 2t`)} です。`,
    `${tex(String.raw`t = \pi/4`)} では ${tex(String.raw`2t = \pi/2`)} なので
      ${eq(String.raw`x(\pi/4) = \cos\frac{\pi}{2} = 0,\qquad v(\pi/4) = -2\sin\frac{\pi}{2} = -2`)}
      です。質点は原点を負の向きに速さ 2 で通ります。`,
    `エネルギーは、${tex('t = 0')} と ${tex(String.raw`t = \pi/4`)} で
      ${eq(String.raw`E = \frac{1}{2}\cdot 1\cdot 0^2 + \frac{1}{2}\cdot 4\cdot 1^2 = 2,\qquad E = \frac{1}{2}\cdot 1\cdot(-2)^2 + \frac{1}{2}\cdot 4\cdot 0^2 = 2`)}
      で、どちらも厳密に 2 です。画面の計器の下に、数値解のエネルギーと厳密な値 2 を並べます。`,
  ],
  related: [
    { href: './second-order.html', title: '定数係数の2階同次', description: '特性方程式の根が複素共役のときの解として、同じ余弦波が出ます。' },
    { href: './series.html', title: 'べき級数', description: '同じ方程式 x″ + x = 0 を、級数の係数から解きます。' },
    { href: './rk4.html', title: '古典的RK4', description: 'この方程式を高精度で進める4次の数値解法です。' },
    { href: './damped.html', title: '減衰振動', description: '速度に比例する抵抗を加えた振動です。' },
  ],
  footer: 'この画面の計算は、ばねにつながれた一つの質点の単振動です。',
  proof: writtenProof([{
    statement: `${tex(`m x'' = -k x`)} の解では、${tex(String.raw`E = \frac{1}{2} m (x')^2 + \frac{1}{2} k x^2`)} は時刻によらない定数です。`,
    proof: [
      `${tex('x')} は2回微分できるので、${tex('E')} は微分できます。合成関数の微分により
        ${eq(String.raw`\frac{dE}{dt} = \frac{1}{2} m \cdot 2 x' x'' + \frac{1}{2} k \cdot 2 x x' = x'\,(m x'' + k x)`)}
        です。`,
      `運動方程式より ${tex(`m x'' + k x = 0`)} なので、すべての時刻で ${tex(String.raw`\frac{dE}{dt} = 0`)} です。`,
      `導関数が恒等的に 0 の関数は、平均値の定理により定数です。したがって ${tex('E(t) = E(0)')} です。`,
    ],
  }]),
});

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawSpringMass(canvases[0], {
    key,
    position: state.position,
    exactPosition: state.exact_position,
    velocity: state.velocity,
    timeEnd,
    samples: points.map(p => ({ time: p.time, position: p.position, exactPosition: p.exact_position })),
  });
  drawPlot(canvases[1], {
    key: `${key}|position`,
    label: '位置と時間のグラフ。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'x = 0',
  });
  drawPlot(canvases[2], {
    key: `${key}|phase`,
    label: '位置と速度の位相図。実線は数値解、破線は厳密解。',
    lines: [
      { x: points.map(p => p.position), y: points.map(p => p.velocity), role: 'numerical' },
      { x: points.map(p => p.exact_position), y: points.map(p => p.exact_velocity), role: 'exact' },
    ],
    dots: [{ x: state.position, y: state.velocity, role: 'numerical' }],
    zeroLabel: 'v = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-harmonic.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => `数値解のエネルギー ${state.frame?.values.energy.toFixed(6) ?? '—'}\n厳密なエネルギー ${state.frame?.values.exact_energy.toFixed(6) ?? '—'}`,
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
