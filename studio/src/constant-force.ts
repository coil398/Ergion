import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawConstantAcceleration, drawErrorSeries, drawTimeSeries } from './figures';
import { eq, experimentPanel, formReader, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'mechanics/constant-force',
  mass: 0.5,
  force: 2,
  initial_position: 1,
  initial_velocity: 0,
  dt: 0.01,
  steps: 200,
};

renderLesson({
  id: 'constant-force',
  section: { label: '力学', href: './' },
  title: '運動方程式と一定の力',
  description: `質量 ${tex('m')} の質点に、時刻にも位置にもよらない一定の力 ${tex('F')} が働きます。Newton の運動方程式から加速度 ${tex('a = F/m')} を求め、速度と位置の厳密解を導きます。`,
  equation: [String.raw`m x'' = F`, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2}\frac{F}{m} t^2`],
  equationLabel: 'Newton の運動方程式。質量 m 掛ける x の2階微分は力 F。',
  studyHeading: '運動方程式から厳密解への手順',
  steps: [
    `記号を定めます。${tex('m > 0')} は質点の質量、${tex('F')} は質点に働く力、${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex(`v(t) = x'(t)`)} は速度、${tex(`a(t) = x''(t)`)} は加速度です。初期条件は ${tex('x(0) = x_0')}、${tex(`x'(0) = v_0`)} とします。`,
    `Newton の第2法則は、質量と加速度の積が力に等しいという式です。
      ${eq(String.raw`m x'' = F`)}
      両辺を ${tex('m')} で割ります。${tex('m > 0')} なので割ってよく、
      ${eq(String.raw`x'' = \frac{F}{m}`)}
      です。右辺は定数なので、加速度は ${tex(String.raw`a = \frac{F}{m}`)} という定数です（${coreDoc('mechanics', 'constant_force_acceleration', '加速度の説明')}）。`,
    `${tex(`v' = a`)} を時刻 0 から ${tex('t')} まで積分します。${tex(String.raw`\tau`)} は積分の変数で、0 から ${tex('t')} までの時刻を表します。
      ${eq(String.raw`\int_0^t v'(\tau)\,d\tau = \int_0^t \frac{F}{m}\,d\tau`)}
      左辺は微分積分学の基本定理で端の値の差に、右辺は定数の積分になります。
      ${eq(String.raw`\Big[v(\tau)\Big]_0^t = \Big[\frac{F}{m}\tau\Big]_0^t`)}
      ${eq(String.raw`v(t) - v(0) = \frac{F}{m} t`)}
      ${tex('v(0) = v_0')} を移項すると、速度の厳密解は
      ${eq(String.raw`v(t) = v_0 + \frac{F}{m} t`)}
      です。`,
    `${tex(`x' = v`)} を時刻 0 から ${tex('t')} まで積分します。
      ${eq(String.raw`\int_0^t x'(\tau)\,d\tau = \int_0^t \left(v_0 + \frac{F}{m}\tau\right) d\tau`)}
      各項の原始関数を書きます。
      ${eq(String.raw`\Big[x(\tau)\Big]_0^t = \Big[v_0 \tau + \frac{1}{2}\frac{F}{m}\tau^2\Big]_0^t`)}
      上端 ${tex('t')} の値から下端 0 の値を引きます。
      ${eq(String.raw`x(t) - x(0) = v_0 t + \frac{1}{2}\frac{F}{m} t^2`)}
      ${tex('x(0) = x_0')} を移項すると、位置の厳密解は
      ${eq(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2}\frac{F}{m} t^2`)}
      です（${coreDoc('mechanics', 'constant_force_position', '位置の厳密解の説明')}）。これは ${tex('a = F/m')} と置いた等加速度直線運動の式です。`,
    `数値解は、${tex(`x' = v`)}、${tex(`v' = F/m`)} を選んだ方法で1ステップずつ進めた値です。速度の右辺が一定なので、どの方法でも速度の増分は厳密です。位置の右辺 ${tex('v')} は区間の中で一次式なので、中点法と古典的RK4 では位置の増分も厳密です。Euler 法は区間の始点の速度だけで位置を進めるので、1ステップごとに ${tex(String.raw`\frac{1}{2}\frac{F}{m}(\Delta t)^2`)} の打ち切りが残ります。`,
  ],
  figureAlt: '一定の力 F が質点を押し、位置の時間変化が放物線を描く図。',
  figure: experimentPanel({
    fieldsetLabel: '質点と力',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 0.5, min: 0 },
      { name: 'force', label: '力', symbol: 'F', value: 2 },
      { name: 'initial_position', label: '初期位置', symbol: 'x_0', value: 1 },
      { name: 'initial_velocity', label: '初期速度', symbol: 'v_0', value: 0 },
    ],
    dt: 0.01,
    steps: 200,
    sceneHeading: '一定の力を受ける質点',
    sceneCaption: 'F の付いた矢印は一定の力 F の向き、橙の矢印は速度の向きで長さは速さに比例します。青緑の破線の輪は同じ時刻の厳密解の位置です。',
    sceneLabel: '一定の力を受けて直線上を進む質点',
    readouts: { position: '位置 x', velocity: '速度 v', exact: '厳密解の位置', error: '位置の差 x − x_exact' },
    plotsHeading: '位置と誤差の時間変化',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位置の誤差 ${tex(String.raw`x - x_{\mathrm{exact}}`)}</h3><canvas id="error-chart" role="img"></canvas><p>時間 t</p></div></div>`,
    code: codeDisclosure('euler'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 0.5')}、${tex('F = 2')}、${tex('x_0 = 1')}、${tex('v_0 = 0')} とします。加速度は
      ${eq(String.raw`a = \frac{F}{m} = \frac{2}{0.5} = 4`)}
      で、厳密な値です。`,
    `時刻 ${tex('t = 2')} の速度は
      ${eq(String.raw`v(2) = 0 + 4 \cdot 2 = 8`)}
      位置は
      ${eq(String.raw`x(2) = 1 + 0 \cdot 2 + \frac{1}{2} \cdot 4 \cdot 2^2 = 1 + 8 = 9`)}
      です。どちらも厳密な値です。画面の既定の条件は ${tex(String.raw`\Delta t = 0.01`)} の 200 ステップで、終わりの時刻は ${tex('t = 2')} です。中点法と古典的RK4 の位置の近似解は、画面の5桁で厳密な値 9 と一致します。`,
    `Euler 法では、位置の差は 1 ステップあたり ${tex(String.raw`\frac{1}{2} \cdot 4 \cdot 0.01^2 = 0.0002`)} ずつ増え、200 ステップの後は ${tex(String.raw`200 \cdot 0.0002 = 0.04`)} です。Euler 法の近似解は、厳密な値 9 より 0.04 だけ小さい ${tex('8.96')} です。`,
  ],
  related: [
    { href: './accelerated.html', title: '等加速度直線運動' },
    { href: './derivative.html', title: '位置の時間微分' },
    { href: './second-order.html', title: '定数係数の2階同次' },
  ],
  footer: 'この画面の計算は、一定の力を受ける一つの質点の直線運動です。',
});

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'time-chart', 'error-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawConstantAcceleration(canvases[0], {
    key,
    x0: points[0]?.position ?? state.position,
    position: state.position,
    exactPosition: state.exact_position,
    velocity: state.velocity,
    timeEnd,
    force: Number(config.force),
    samples: points.map(p => ({ time: p.time, position: p.position, exactPosition: p.exact_position })),
  });
  drawTimeSeries(canvases[1], {
    key: `${key}|position`,
    kind: 'position',
    timeEnd,
    time: state.time,
    current: state.position,
    samples: points.map(p => ({ time: p.time, numerical: p.position, exact: p.exact_position })),
  });
  drawErrorSeries(canvases[2], {
    key: `${key}|error`,
    timeEnd,
    time: state.time,
    current: state.position_error ?? 0,
    samples: points.map(p => ({ time: p.time, error: p.position_error ?? 0 })),
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-constant-force.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
