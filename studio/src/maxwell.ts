import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'em/maxwell',
  length: 10,
  cells: 200,
  center: 2.5,
  width: 0.5,
  dt: 0.05,
  steps: 200,
};

renderLesson({
  id: 'maxwell',
  section: { label: '電磁気学' },
  title: 'Maxwell 方程式と電磁波',
  description: `真空中の Maxwell 方程式の二つの回転の式から、電場と磁場がどちらも光速 ${tex('c')} の波動方程式に従うことを導きます。平面電磁波の厳密解を確かめ、FDTD 法（Yee 格子）で進めた電磁波のパルスを d'Alembert の解と比べます。`,
  equation: [
    String.raw`\nabla\times\mathbf{E} = -\frac{\partial\mathbf{B}}{\partial t}`,
    String.raw`\nabla\times\mathbf{B} = \mu_0\mathbf{J} + \mu_0\varepsilon_0\frac{\partial\mathbf{E}}{\partial t}`,
    String.raw`\nabla\cdot\mathbf{E} = \frac{\rho}{\varepsilon_0},\qquad \nabla\cdot\mathbf{B} = 0`,
    String.raw`\nabla^2\mathbf{E} = \frac{1}{c^2}\frac{\partial^2\mathbf{E}}{\partial t^2}`,
  ],
  equationNote: `${tex(String.raw`c = 1/\sqrt{\varepsilon_0\mu_0}`)}`,
  studyHeading: '回転の式から波動方程式と Yee 格子の差分へ',
  steps: [
    `記号を定めます。${tex(String.raw`\mathbf{E}(\mathbf{r}, t)`)} は電場、${tex(String.raw`\mathbf{B}(\mathbf{r}, t)`)} は磁束密度、${tex(String.raw`\rho`)} は電荷密度、${tex(String.raw`\mathbf{J}`)} は電流密度、${tex(String.raw`\varepsilon_0`)} は真空の誘電率、${tex(String.raw`\mu_0`)} は真空の透磁率です。真空中（${tex(String.raw`\rho = 0`)}、${tex(String.raw`\mathbf{J} = \mathbf{0}`)}）では
      ${eq(String.raw`\nabla\cdot\mathbf{E} = 0,\qquad \nabla\times\mathbf{E} = -\frac{\partial\mathbf{B}}{\partial t},\qquad \nabla\times\mathbf{B} = \mu_0\varepsilon_0\frac{\partial\mathbf{E}}{\partial t}`)}
      です。`,
    `Faraday の法則の両辺の回転をとり、時間微分と空間微分の順序を入れかえます。
      ${eq(String.raw`\nabla\times(\nabla\times\mathbf{E}) = -\frac{\partial}{\partial t}\left(\nabla\times\mathbf{B}\right) = -\mu_0\varepsilon_0\frac{\partial^2\mathbf{E}}{\partial t^2}`)}
      左辺を成分で計算します。${tex(String.raw`(\nabla\times\mathbf{E})_y = \partial_z E_x - \partial_x E_z`)}、${tex(String.raw`(\nabla\times\mathbf{E})_z = \partial_x E_y - \partial_y E_x`)} なので、${tex('x')} 成分は
      ${eq(String.raw`\left[\nabla\times(\nabla\times\mathbf{E})\right]_x = \partial_y\left(\partial_x E_y - \partial_y E_x\right) - \partial_z\left(\partial_z E_x - \partial_x E_z\right)`)}
      ${eq(String.raw`= \partial_x\left(\partial_y E_y + \partial_z E_z\right) - \left(\partial_y^2 + \partial_z^2\right)E_x`)}
      ${eq(String.raw`= \partial_x\left(\partial_x E_x + \partial_y E_y + \partial_z E_z\right) - \left(\partial_x^2 + \partial_y^2 + \partial_z^2\right)E_x = \partial_x(\nabla\cdot\mathbf{E}) - \nabla^2 E_x`)}
      です（3行目で ${tex(String.raw`\partial_x^2 E_x`)} を足して引きました）。${tex('y')}、${tex('z')} 成分も同じなので
      ${eq(String.raw`\nabla\times(\nabla\times\mathbf{E}) = \nabla(\nabla\cdot\mathbf{E}) - \nabla^2\mathbf{E}`)}
      です。`,
    `真空中では ${tex(String.raw`\nabla\cdot\mathbf{E} = 0`)} なので
      ${eq(String.raw`-\nabla^2\mathbf{E} = -\mu_0\varepsilon_0\frac{\partial^2\mathbf{E}}{\partial t^2}`)}
      ${eq(String.raw`\nabla^2\mathbf{E} = \frac{1}{c^2}\frac{\partial^2\mathbf{E}}{\partial t^2},\qquad c = \frac{1}{\sqrt{\varepsilon_0\mu_0}}`)}
      です。Ampère–Maxwell の法則の回転から始めて ${tex(String.raw`\nabla\cdot\mathbf{B} = 0`)} を使うと、${tex(String.raw`\mathbf{B}`)} も同じ波動方程式に従います。変位電流の項 ${tex(String.raw`\mu_0\varepsilon_0\,\partial\mathbf{E}/\partial t`)} がなければ、上の式は出てきません。`,
    `${tex('x')} 方向に進む平面波を考え、${tex(String.raw`\mathbf{E} = E_y(x, t)\,\hat{\mathbf{y}}`)}、${tex(String.raw`\mathbf{B} = B_z(x, t)\,\hat{\mathbf{z}}`)} とします。${tex(String.raw`(\nabla\times\mathbf{E})_z = \partial_x E_y`)}、${tex(String.raw`(\nabla\times\mathbf{B})_y = \partial_z B_x - \partial_x B_z = -\partial_x B_z`)} なので、二つの回転の式は
      ${eq(String.raw`\frac{\partial B_z}{\partial t} = -\frac{\partial E_y}{\partial x},\qquad \frac{\partial E_y}{\partial t} = -c^2\frac{\partial B_z}{\partial x}`)}
      です。${tex(String.raw`E_y = E_0\cos(kx - \omega t)`)}（${tex('E_0')} は振幅、${tex('k')} は波数、${tex(String.raw`\omega`)} は角振動数）を第1式に入れると
      ${eq(String.raw`\frac{\partial B_z}{\partial t} = kE_0\sin(kx - \omega t),\qquad B_z = \frac{k}{\omega}E_0\cos(kx - \omega t)`)}
      です。第2式に入れると
      ${eq(String.raw`\omega E_0\sin(kx - \omega t) = -c^2\cdot\frac{k}{\omega}E_0\cdot\left(-k\sin(kx - \omega t)\right) = \frac{c^2k^2}{\omega}E_0\sin(kx - \omega t)`)}
      なので ${tex(String.raw`\omega = ck`)} です。したがって ${tex(String.raw`B_z = E_y/c`)} で、電場と磁場は同じ位相で振動し、振幅の比は ${tex('E_0/B_0 = c')} です（${coreDoc('electromagnetism', 'plane_wave', '平面電磁波の説明')}）。Poynting ベクトル ${tex(String.raw`\mathbf{S} = \mathbf{E}\times\mathbf{B}/\mu_0 = (E_y^2/(\mu_0 c))\,\hat{\mathbf{x}}`)} は進行方向を向きます。`,
    `平面波の重ね合わせとして、右へ進む任意の形 ${tex('f')} のパルス ${tex(String.raw`E_y = f(x - ct)`)}、${tex(String.raw`B_z = f(x - ct)/c`)} も厳密解です。画面では ${tex('c = 1')} の単位をとり、周期 ${tex('L')} の区間で Gauss 形
      ${eq(String.raw`f(s) = \exp\left(-\left(\frac{s - x_0}{w}\right)^2\right)`)}
      を使います（${tex('x_0')} は初めの中心、${tex('w')} は幅、${coreDoc('electromagnetism', 'periodic_pulse', 'パルスの説明')}）。`,
    `FDTD 法では、${tex(String.raw`E_j^n = E_y(j\Delta x, n\Delta t)`)} を整数の格子点に、${tex(String.raw`B_{j+1/2}^{n+1/2}`)} を空間も時間も半分ずれた点に置きます（Yee 格子）。二つの回転の式の微分をどちらも中心差分にし、Courant 数を ${tex(String.raw`S = c\Delta t/\Delta x`)} とすると
      ${eq(String.raw`B_{j+1/2}^{n+1/2} = B_{j+1/2}^{n-1/2} - \frac{S}{c}\left(E_{j+1}^n - E_j^n\right)`)}
      ${eq(String.raw`E_j^{n+1} = E_j^n - cS\left(B_{j+1/2}^{n+1/2} - B_{j-1/2}^{n+1/2}\right)`)}
      です（${coreDoc('electromagnetism', 'yee_step', 'Yee 格子の1ステップの説明')}）。初めの磁場は厳密解の ${tex(String.raw`t = -\Delta t/2`)} の値です。`,
    `${tex('B')} を消します。第2式を ${tex('n')} と ${tex('n - 1')} で書いて引き、第1式を代入すると
      ${eq(String.raw`E_j^{n+1} - 2E_j^n + E_j^{n-1} = -cS\left[\left(B_{j+1/2}^{n+1/2} - B_{j+1/2}^{n-1/2}\right) - \left(B_{j-1/2}^{n+1/2} - B_{j-1/2}^{n-1/2}\right)\right]`)}
      ${eq(String.raw`= -cS\left[-\frac{S}{c}\left(E_{j+1}^n - E_j^n\right) + \frac{S}{c}\left(E_j^n - E_{j-1}^n\right)\right] = S^2\left(E_{j+1}^n - 2E_j^n + E_{j-1}^n\right)`)}
      で、波動方程式の中心差分法と同じ式です。安定な条件は ${tex(String.raw`S \le 1`)} です。${tex('S = 1')} では ${tex(String.raw`E_j^{n+1} = E_{j+1}^n + E_{j-1}^n - E_j^{n-1}`)} となり、右へ進む ${tex(String.raw`E_j^n = f((j - n)\Delta x)`)} を代入すると
      ${eq(String.raw`f((j + 1 - n)\Delta x) + f((j - 1 - n)\Delta x) - f((j - n + 1)\Delta x) = f((j - (n + 1))\Delta x)`)}
      で左辺と一致します。パルスは1ステップでちょうど1格子だけ進み、格子点の上で厳密解と一致します。${tex('S < 1')} では、格子の上の波の速さが波長によって変わり（数値分散）、パルスの後ろに細かな振動が残る近似です。`,
  ],
  figureAlt: '周期的な区間を右へ進む電場のパルスと、同じ形で同じ位相の磁場のパルス。',
  figure: experimentPanel({
    fieldsetLabel: '区間とパルス（c = 1）',
    fields: [
      { name: 'length', label: '区間の長さ', symbol: 'L', value: 10, min: 0 },
      { name: 'cells', label: '格子の区間の数', symbol: 'M', value: 200, min: 8, max: 2000, step: '1' },
      { name: 'center', label: 'パルスの初めの中心', symbol: 'x_0', value: 2.5 },
      { name: 'width', label: 'パルスの幅', symbol: 'w', value: 0.5, min: 0 },
    ],
    dt: 0.05,
    steps: 200,
    sceneHeading: `電場 ${tex('E_y(x, t)')} と磁場 ${tex('B_z(x, t)')}`,
    sceneCaption: `実線は Yee 格子の電場の数値解、青緑の破線は d'Alembert の厳密解、灰色の線は半格子ずれた点の磁場の数値解です。${tex('c = 1')} なので電場と磁場は同じ高さに重なります。灰色の点は計器が読む位置 ${tex('x_p')} です。`,
    sceneLabel: '周期区間を右へ進む電磁波のパルス',
    sceneHeight: 320,
    readouts: { position: '電場 E_y(x_p, t)（数値解）', velocity: 'Courant 数 S = cΔt/Δx', exact: '厳密解 E_y(x_p, t)', error: '差 E − E_exact' },
    plotsHeading: '定点の電場の時間変化',
    tabs: methodTabs('この方程式の数値解法', [{ id: 'yee', label: 'FDTD 法（Yee 格子）' }]),
    plots: `<div class="lesson-figure"><h3>定点の電場 ${tex('E_y(x_p, t)')}</h3><canvas id="probe-chart" role="img"></canvas><p>時間 t</p></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('c = 1')}、${tex('L = 10')}、${tex('M = 200')} とすると ${tex(String.raw`\Delta x = 10/200 = 0.05`)} です。${tex(String.raw`\Delta t = 0.05`)} では
      ${eq(String.raw`S = \frac{1 \times 0.05}{0.05} = 1`)}
      です。200 ステップの時刻 ${tex('t = 10')} でパルスは ${tex('ct = 10 = L')} だけ進み、ちょうど1周して初めの位置に戻ります。計器の位置は ${tex('x_p = x_0 = 2.5')} で、厳密解は
      ${eq(String.raw`E_y(2.5, 10) = f(2.5 - 10 + 10) = e^{0} = 1`)}
      です。${tex('S = 1')} なので、数値解も 1.00000 で厳密解と一致します。`,
    `${tex(String.raw`\Delta t = 0.025`)}、ステップ数 400 にすると ${tex('S = 0.5')} で、同じ時刻 ${tex('t = 10')} の数値解は約 0.99768（近似）、格子の上の最大誤差は約 0.025 です。${tex(String.raw`\Delta t = 0.055`)}（${tex('S = 1.1')}）にすると、安定な条件 ${tex(String.raw`S \le 1`)} を満たしません。`,
  ],
  related: [
    { href: './wave.html', title: '波動方程式' },
    { href: './gauss.html', title: 'Gauss の法則' },
    { href: './faraday.html', title: 'Faraday の電磁誘導の法則' },
  ],
  footer: 'この画面の計算は、光速 c = 1 の単位で周期区間を進む1次元の電磁波です。',
});

const form = formReader(defaults);

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const scene = document.getElementById('scene') as HTMLCanvasElement;
  const chart = document.getElementById('probe-chart') as HTMLCanvasElement;
  const frame = state?.frame;
  if (!state || !frame) {
    clearFigure(scene);
    clearFigure(chart);
    return;
  }
  const key = JSON.stringify(config);
  const stable = frame.values.stable === 1;
  const probe = frame.points.find(p => p.name === 'probe');
  drawPlot(scene, {
    key: `${key}|profile`,
    label: '位置 x に対する電場と磁場。実線は電場の数値解、破線は厳密解、灰色は磁場の数値解。',
    xMin: 0,
    xMax: Number(config.length),
    yMin: stable ? -0.4 : undefined,
    yMax: stable ? 1.2 : undefined,
    lines: [line(frame, 'magnetic', 'B_z'), line(frame, 'exact'), line(frame, 'numerical', 'E_y')],
    dots: probe ? [{ x: probe.x, y: probe.y, role: probe.role }] : [],
    zeroLabel: '0',
  });
  drawPlot(chart, {
    key: `${key}|probe`,
    label: '定点の電場の時間変化。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: config.steps * config.dt,
    yMin: stable ? -0.4 : undefined,
    yMax: stable ? 1.2 : undefined,
    lines: [
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: '0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-maxwell.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => 'yee',
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    return [
      `格子の上の最大誤差 max|E − E_exact| = ${v.max_error.toExponential(2)}`,
      `Courant 数 S = ${v.courant.toFixed(3)}（${v.stable === 1 ? 'S ≤ 1 なので安定です' : 'S > 1 なので安定ではありません'}）`,
      `電磁場のエネルギー Σ(E² + B²)Δx/2 = ${v.energy.toFixed(6)}`,
    ].join('\n');
  },
});
bindMethodTabs<string>(() => session.reloadMethod());
