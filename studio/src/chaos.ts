import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, lessonFigure, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'ode/chaos',
  sigma: 10,
  rho: 28,
  beta: 8 / 3,
  initial_x: 1,
  initial_y: 1,
  initial_z: 1,
  perturbation: 1e-6,
  dt: 0.01,
  steps: 3000,
};

renderLesson({
  id: 'chaos',
  section: { label: '微分方程式', href: './ode.html' },
  title: '非線形力学系とカオス',
  description: `3個の未知関数 ${tex('x, y, z')} が積で結びついた Lorenz 方程式の解は、二つの固定点のまわりを不規則に行き来します。初期値が ${tex('10^{-6}')} だけ違う2本の軌道を数値計算し、その距離が指数関数的に広がることを確かめます。`,
  equation: [
    String.raw`x' = \sigma (y - x)`,
    String.raw`y' = x(\rho - z) - y`,
    String.raw`z' = x y - \beta z`,
  ],
  equationLabel: 'Lorenz 方程式。x の微分は σ (y − x)、y の微分は x (ρ − z) − y、z の微分は x y − β z。',
  equationNote: 'σ = 10、ρ = 28、β = 8/3',
  studyHeading: '固定点、線形化、軌道の広がり',
  steps: [
    `記号を定めます。${tex('t')} は時刻、${tex('(x(t), y(t), z(t))')} は状態、${tex(String.raw`\sigma > 0`)}、${tex(String.raw`\rho > 0`)}、${tex(String.raw`\beta > 0`)} は定数の係数です。この方程式は、下から熱した流体の対流を3個の変数で近似したもので、${tex(String.raw`\sigma`)} は Prandtl 数、${tex(String.raw`\rho`)} は Rayleigh 数の比、${tex(String.raw`\beta`)} は容器の形で決まる係数です。右辺の ${tex('xz')} と ${tex('xy')} が積なので、方程式は非線形です。この方程式には、初等関数で書ける厳密解は知られていません。ページの軌道はすべて数値解（近似）です。`,
    `固定点（右辺がすべて 0 になる点）を求めます。第1式から
      ${eq(String.raw`\sigma (y - x) = 0 \ \Rightarrow\ y = x`)}
      第3式に ${tex('y = x')} を入れると
      ${eq(String.raw`x^2 - \beta z = 0 \ \Rightarrow\ z = \frac{x^2}{\beta}`)}
      第2式に入れると
      ${eq(String.raw`x\left(\rho - \frac{x^2}{\beta}\right) - x = x\left(\rho - 1 - \frac{x^2}{\beta}\right) = 0`)}
      です。根は ${tex('x = 0')}（原点）と ${tex(String.raw`x^2 = \beta(\rho - 1)`)} で、${tex(String.raw`\rho > 1`)} のとき原点のほかに二つの固定点
      ${eq(String.raw`C_\pm = \left(\pm\sqrt{\beta(\rho - 1)},\ \pm\sqrt{\beta(\rho - 1)},\ \rho - 1\right)`)}
      があります（${coreDoc('differential', 'lorenz_fixed_points', '固定点の説明')}）。`,
    `固定点 ${tex(String.raw`\mathbf{X}^*`)} の近くで ${tex(String.raw`\mathbf{X} = \mathbf{X}^* + \boldsymbol{\xi}`)} と置き、${tex(String.raw`\boldsymbol\xi`)} の2次以上の項を捨てると、${tex(String.raw`\boldsymbol\xi' = J\boldsymbol\xi`)} です。${tex('J')} は右辺の Jacobi 行列で
      ${eq(String.raw`J = \begin{pmatrix} -\sigma & \sigma & 0 \\ \rho - z & -1 & -x \\ y & x & -\beta \end{pmatrix}`)}
      です（${coreDoc('differential', 'lorenz_jacobian', 'Jacobi 行列の説明')}）。原点では ${tex('z')} の成分が分かれ、${tex(String.raw`(x, y)`)} の区画の特性方程式は
      ${eq(String.raw`\det\begin{pmatrix} -\sigma - \mu & \sigma \\ \rho & -1 - \mu \end{pmatrix} = (\sigma + \mu)(1 + \mu) - \sigma\rho = 0`)}
      ${eq(String.raw`\mu^2 + (\sigma + 1)\mu + \sigma(1 - \rho) = 0`)}
      です。根と残りの固有値は
      ${eq(String.raw`\mu_\pm = \frac{-(\sigma + 1) \pm \sqrt{(\sigma + 1)^2 + 4\sigma(\rho - 1)}}{2},\qquad \mu_3 = -\beta`)}
      です（${coreDoc('differential', 'lorenz_origin_eigenvalues', '原点の固有値の説明')}）。${tex(String.raw`\rho > 1`)} では ${tex(String.raw`\mu_+ > 0`)} なので、原点から少しずれた解は離れていきます。`,
    `右辺のベクトル場 ${tex(String.raw`\mathbf{f}`)} の発散は
      ${eq(String.raw`\nabla\cdot\mathbf{f} = \frac{\partial}{\partial x}\sigma(y - x) + \frac{\partial}{\partial y}\big(x(\rho - z) - y\big) + \frac{\partial}{\partial z}(xy - \beta z) = -\sigma - 1 - \beta`)}
      で、負の定数です。相空間の体積は ${tex(String.raw`e^{-(\sigma + 1 + \beta)t}`)} の割合で縮むので、軌道は体積 0 の集合（アトラクタ）に近づきます。それでも原点と ${tex(String.raw`C_\pm`)} はどれも引き寄せない（${tex(String.raw`\rho = 28`)} では不安定な）ので、軌道は二つの翼のあいだを行き来し続けます。`,
    `初期値の差 ${tex(String.raw`\delta`)} の2本の軌道 ${tex(String.raw`\mathbf{X}_1(t)`)}、${tex(String.raw`\mathbf{X}_2(t)`)} の距離を ${tex(String.raw`d(t) = |\mathbf{X}_1(t) - \mathbf{X}_2(t)|`)} とします。${tex('d')} が小さいあいだ、差は線形化した方程式に従い、平均すると
      ${eq(String.raw`d(t) \approx d(0)\, e^{\lambda_{\max} t}`)}
      ${eq(String.raw`\log_{10} d(t) \approx \log_{10} d(0) + \frac{\lambda_{\max}}{\ln 10}\, t`)}
      と増えます。${tex(String.raw`\lambda_{\max}`)} は最大 Lyapunov 指数で、この係数では約 0.906 と知られています（近似値）。対数のグラフは傾き ${tex(String.raw`\lambda_{\max}/\ln 10 \approx 0.39`)} 前後の右上がりになり、${tex('d')} がアトラクタの大きさに達すると増えなくなります。初期値の小さな違いが有限の時間で大きな違いになることを、初期値に対する鋭敏な依存性と呼びます。`,
    `数値解は、6個の成分 ${tex(String.raw`(x_1, y_1, z_1, x_2, y_2, z_2)`)} を選んだ方法で1ステップずつ進めた値です。2本の軌道はそれぞれ同じ Lorenz 方程式に従い、互いに影響しません。Euler 法、中点法、古典的RK4 の1ステップの誤差は ${tex(String.raw`\Delta t`)} の2乗、3乗、5乗に比例します。方法の誤差も初期値の違いと同じく指数関数的に広がるので、方法を替えると、十分に後の時刻の軌道は互いに異なります。`,
  ],
  figureAlt: 'x–z 平面に射影した Lorenz アトラクタの二つの翼と、初期値の差から離れていく2本の軌道。',
  figure: experimentPanel({
    fieldsetLabel: '係数と初期値',
    fields: [
      { name: 'sigma', label: 'Prandtl 数', symbol: String.raw`\sigma`, value: 10, min: 0 },
      { name: 'rho', label: 'Rayleigh 数の比', symbol: String.raw`\rho`, value: 28, min: 0 },
      { name: 'beta', label: '形の係数', symbol: String.raw`\beta`, value: 8 / 3, min: 0 },
      { name: 'perturbation', label: '初期値の差', symbol: String.raw`\delta`, value: 1e-6 },
      { name: 'initial_x', label: '初期値', symbol: 'x_0', value: 1 },
      { name: 'initial_y', label: '初期値', symbol: 'y_0', value: 1 },
      { name: 'initial_z', label: '初期値', symbol: 'z_0', value: 1 },
    ],
    dt: 0.01,
    steps: 3000,
    sceneHeading: 'x–z 平面に射影した軌道',
    sceneCaption: `実線は初期値 ${tex('(x_0, y_0, z_0)')} の1本目の軌道、破線は ${tex('x_0')} だけを ${tex(String.raw`\delta`)} ずらした2本目の軌道で、どちらも直近の 400 ステップ（${tex(String.raw`\Delta t = 0.01`)} では 4 単位時間）の部分です。灰色の点は固定点 ${tex(String.raw`C_\pm`)} です。厳密解はないので、計器の「2本目」の欄は厳密解ではなく2本目の軌道の値です。`,
    sceneLabel: 'x–z 平面に射影した Lorenz 方程式の2本の軌道',
    sceneHeight: 320,
    readouts: { position: '1本目の x（近似）', velocity: '1本目の z（近似）', exact: '2本目の x（近似）', error: '差 x₁ − x₂' },
    plotsHeading: '2本の軌道の距離の時間変化',
    legend: '<span><i class="numerical"></i>1本目の軌道</span><span><i class="analytical"></i>2本目の軌道（初期値を δ ずらす）</span>',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="lesson-figure"><h3>距離の常用対数 ${tex(String.raw`\log_{10} d(t)`)}</h3><canvas id="separation-chart" role="img"></canvas><p>時間 t</p></div>`,
    code: codeDisclosure('euler'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\sigma = 10`)}、${tex(String.raw`\rho = 28`)}、${tex(String.raw`\beta = 8/3`)} とします。固定点の座標は
      ${eq(String.raw`\beta(\rho - 1) = \frac{8}{3}\cdot 27 = 72`)}
      ${eq(String.raw`x = y = \pm\sqrt{72} = \pm 6\sqrt2 \approx \pm 8.48528,\qquad z = \rho - 1 = 27`)}
      で、${tex(String.raw`C_\pm = (\pm 6\sqrt2, \pm 6\sqrt2, 27)`)} は厳密な値です。ライブラリが返した ${tex(String.raw`C_+`)} は ${tex('x =')} <output id="fixed-x">—</output>、${tex('z =')} <output id="fixed-z">—</output> で、そこでの右辺の大きさは <output id="fixed-residual">—</output>（厳密には 0）です。`,
    `原点の Jacobi 行列は
      ${eq(String.raw`J(0) = \begin{pmatrix} -10 & 10 & 0 \\ 28 & -1 & 0 \\ 0 & 0 & -8/3 \end{pmatrix}`)}
      です。${tex('(x, y)')} の区画の特性方程式は
      ${eq(String.raw`\mu^2 + 11\mu + 10\cdot(1 - 28) = \mu^2 + 11\mu - 270 = 0`)}
      ${eq(String.raw`\mu_\pm = \frac{-11 \pm \sqrt{121 + 1080}}{2} = \frac{-11 \pm \sqrt{1201}}{2}`)}
      で、${tex(String.raw`\sqrt{1201} \approx 34.6554`)} より ${tex(String.raw`\mu_+ \approx 11.8277`)}、${tex(String.raw`\mu_- \approx -22.8277`)}、残りは ${tex(String.raw`\mu_3 = -8/3 \approx -2.66667`)} です。ライブラリの値は <output id="eigen1">—</output>、<output id="eigen3">—</output>、<output id="eigen2">—</output> です。`,
    `発散は ${tex(String.raw`-\sigma - 1 - \beta = -10 - 1 - \frac{8}{3} = -\frac{41}{3}`)} で、相空間の体積は単位時間あたり ${tex(String.raw`e^{-41/3} \approx 1.2\times 10^{-6}`)} 倍に縮みます。`,
  ],
  related: [
    { href: './system.html', title: '連立1階', description: '線形の連立方程式 x′ = Ax を固有値で解きます。固定点のまわりの線形化と同じ形です。' },
    { href: './rk4.html', title: '古典的RK4', description: 'このページの軌道を進める4次の数値解法です。' },
    { href: './bernoulli.html', title: 'ベルヌーイ', description: '変数変換で線形に直せる、1変数の非線形方程式です。' },
  ],
  footer: 'この画面の計算は、Lorenz 方程式の2本の軌道の数値解です。',
});

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const scene = document.getElementById('scene') as HTMLCanvasElement;
  const chart = document.getElementById('separation-chart') as HTMLCanvasElement;
  const frame = state?.frame;
  if (!state || !frame) {
    clearFigure(scene);
    clearFigure(chart);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const fixed = frame.points.some(p => p.name === 'fixed_plus')
    ? [{ ...dot(frame, 'fixed_plus', 'C₊'), role: 'reference' }, { ...dot(frame, 'fixed_minus', 'C₋'), role: 'reference' }]
    : [];
  const trails = [line(frame, 'trail1'), line(frame, 'trail2')];
  const inBox = trails.every(t => t.x.every(x => Math.abs(x) <= 25) && t.y.every(z => z >= 0 && z <= 50));
  drawPlot(scene, {
    key: `${key}|attractor`,
    label: 'x–z 平面の2本の軌道。実線は1本目、破線は初期値をずらした2本目。',
    xMin: inBox ? -25 : undefined,
    xMax: inBox ? 25 : undefined,
    yMin: inBox ? 0 : undefined,
    yMax: inBox ? 50 : undefined,
    lines: trails,
    dots: [...fixed, dot(frame, 'now1'), { ...dot(frame, 'now2'), hollow: true, radius: 6 }],
  });
  drawPlot(chart, {
    key: `${key}|separation`,
    label: '2本の軌道の距離 d の常用対数の時間変化。',
    xMin: 0,
    xMax: config.steps * config.dt,
    yMin: line(frame, 'separation').y.every(y => y >= -9) ? -9 : undefined,
    yMax: 3,
    lines: [line(frame, 'separation')],
    dots: [{ x: state.time, y: frame.values.log_separation, role: 'numerical' }],
    zeroLabel: 'd = 1',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-chaos.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    const reach = v.time_to_one === undefined ? 'まだ 1 に達していません' : `t = ${v.time_to_one.toFixed(2)}`;
    return `2本の軌道の距離 d = ${v.separation.toExponential(3)}（近似）    d がはじめて 1 以上になった時刻 ${reach}`;
  },
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});

void lessonFigure('ode/chaos', { sigma: 10, rho: 28, beta: 8 / 3 }).then(figure => {
  const v = figure.values;
  const set = (id: string, value: string) => { document.getElementById(id)!.textContent = value; };
  set('fixed-x', v.fixed_x.toFixed(5));
  set('fixed-z', v.fixed_z.toFixed(5));
  set('fixed-residual', v.fixed_residual.toExponential(1));
  set('eigen1', v.eigen1.toFixed(4));
  set('eigen2', v.eigen2.toFixed(5));
  set('eigen3', v.eigen3.toFixed(4));
});
