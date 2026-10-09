import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'constraints',
  section: { label: '解析力学' },
  title: '拘束条件と一般化座標',
  description: `質点の位置が曲面や棒の長さのような条件で縛られると、独立に動かせる座標の数が減ります。その数が自由度 ${tex('s = 3N - k')} で、拘束を自動的に満たす座標を一般化座標と呼びます。球面上の質点の位置を ${tex(String.raw`(\theta, \varphi)`)} で表し、偏微分 ${tex(String.raw`\partial\mathbf{r}/\partial q`)} を厳密に求めて中心差分で確かめます。`,
  equation: [String.raw`s = 3N - k`, String.raw`\mathbf{r}_i = \mathbf{r}_i(q_1, \ldots, q_s, t)`],
  studyHeading: '自由度の数え方と一般化座標の偏微分',
  steps: [
    `記号を定めます。${tex('N')} 個の質点の位置を ${tex(String.raw`\mathbf{r}_1, \ldots, \mathbf{r}_N`)} とします。3次元空間では、これらは ${tex('3N')} 個のデカルト座標で決まります。座標と時刻 ${tex('t')} の間に成り立つ等式
      ${eq(String.raw`f_\alpha(\mathbf{r}_1, \ldots, \mathbf{r}_N, t) = 0\qquad (\alpha = 1, \ldots, k)`)}
      をホロノミック拘束と呼び、${tex('k')} はその独立な等式の数です。`,
    `独立な等式が一つあるごとに、一つの座標を残りの座標で表せるので、独立に選べる座標の数は
      ${eq(String.raw`s = 3N - k`)}
      です。これを自由度と呼びます。球面 ${tex('x^2 + y^2 + z^2 = R^2')} の上の質点は ${tex('N = 1')}、${tex('k = 1')} で
      ${eq(String.raw`s = 3\cdot 1 - 1 = 2`)}
      です。平面内の二重振り子は ${tex('N = 2')} で、拘束は ${tex('z_1 = 0')}、${tex('z_2 = 0')}、${tex(String.raw`|\mathbf{r}_1| = l_1`)}、${tex(String.raw`|\mathbf{r}_2 - \mathbf{r}_1| = l_2`)} の ${tex('k = 4')} 個なので
      ${eq(String.raw`s = 3\cdot 2 - 4 = 2`)}
      です（${coreDoc('analytical', 'degrees_of_freedom', '自由度の説明')}）。`,
    `拘束を自動的に満たす ${tex('s')} 個の座標 ${tex('q = (q_1, \\ldots, q_s)')} を一般化座標と呼び、${tex(String.raw`\dot q_j`)} を一般化速度と呼びます。球面では、天頂角 ${tex(String.raw`\theta`)}（${tex('z')} 軸からの角）と方位角 ${tex(String.raw`\varphi`)}（${tex('x')} 軸から測った角）を選んで
      ${eq(String.raw`\mathbf{r}(\theta, \varphi) = R\,(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)`)}
      とします（${coreDoc('analytical', 'sphere_point', '球面の点の説明')}）。拘束の式に代入すると
      ${eq(String.raw`x^2 + y^2 + z^2 = R^2\sin^2\theta\cos^2\varphi + R^2\sin^2\theta\sin^2\varphi + R^2\cos^2\theta`)}
      ${eq(String.raw`= R^2\sin^2\theta + R^2\cos^2\theta = R^2`)}
      となり、どの ${tex(String.raw`(\theta, \varphi)`)} でも拘束が成り立ちます。`,
    `位置を一般化座標で偏微分します。${tex(String.raw`\theta`)} で微分すると
      ${eq(String.raw`\frac{\partial\mathbf{r}}{\partial\theta} = R\,(\cos\theta\cos\varphi,\ \cos\theta\sin\varphi,\ -\sin\theta)`)}
      ${tex(String.raw`\varphi`)} で微分すると
      ${eq(String.raw`\frac{\partial\mathbf{r}}{\partial\varphi} = R\,(-\sin\theta\sin\varphi,\ \sin\theta\cos\varphi,\ 0)`)}
      です。これを列に並べた ${tex(String.raw`3\times 2`)} の行列 ${tex(String.raw`J_{ij} = \partial r_i/\partial q_j`)} がヤコビ行列です（${coreDoc('analytical', 'sphere_jacobian', 'ヤコビ行列の説明')}）。2本の列は、${tex(String.raw`\varphi`)} を止めて ${tex(String.raw`\theta`)} を動かした曲線（経線）と、${tex(String.raw`\theta`)} を止めて ${tex(String.raw`\varphi`)} を動かした曲線（緯線）の接ベクトルです。`,
    `速度は合成関数の微分で
      ${eq(String.raw`\dot{\mathbf{r}} = \frac{\partial\mathbf{r}}{\partial\theta}\dot\theta + \frac{\partial\mathbf{r}}{\partial\varphi}\dot\varphi`)}
      です。接ベクトルの内積を計算します。
      ${eq(String.raw`\left|\frac{\partial\mathbf{r}}{\partial\theta}\right|^2 = R^2(\cos^2\theta\cos^2\varphi + \cos^2\theta\sin^2\varphi + \sin^2\theta)`)}
      ${eq(String.raw`= R^2\bigl(\cos^2\theta(\cos^2\varphi + \sin^2\varphi) + \sin^2\theta\bigr) = R^2(\cos^2\theta\cdot 1 + \sin^2\theta) = R^2(\cos^2\theta + \sin^2\theta) = R^2`)}
      ${eq(String.raw`\left|\frac{\partial\mathbf{r}}{\partial\varphi}\right|^2 = R^2(\sin^2\theta\sin^2\varphi + \sin^2\theta\cos^2\varphi)`)}
      ${eq(String.raw`= R^2\sin^2\theta(\sin^2\varphi + \cos^2\varphi) = R^2\sin^2\theta\cdot 1 = R^2\sin^2\theta`)}
      ${eq(String.raw`\frac{\partial\mathbf{r}}{\partial\theta}\cdot\frac{\partial\mathbf{r}}{\partial\varphi} = R^2(-\cos\theta\sin\theta\cos\varphi\sin\varphi + \cos\theta\sin\theta\sin\varphi\cos\varphi) = 0`)}
      したがって質量 ${tex('m')} の運動エネルギーは
      ${eq(String.raw`T = \frac{1}{2} m|\dot{\mathbf{r}}|^2 = \frac{1}{2} m R^2\left(\dot\theta^2 + \sin^2\theta\,\dot\varphi^2\right)`)}
      です（${coreDoc('analytical', 'sphere_metric', '計量の説明')}）。`,
    `偏微分の式を数値で確かめます。第 ${tex('j')} 座標だけを ${tex(String.raw`\pm h`)} ずらした点で ${tex(String.raw`\mathbf{r}`)} を計算し
      ${eq(String.raw`\frac{\partial r_i}{\partial q_j} \approx \frac{r_i(q + h\mathbf{e}_j) - r_i(q - h\mathbf{e}_j)}{2h}`)}
      とします（${coreDoc('analytical', 'central_jacobian', '中心差分のヤコビ行列の説明')}）。Taylor 展開
      ${eq(String.raw`r_i(q \pm h\mathbf{e}_j) = r_i \pm h\,\partial_j r_i + \frac{h^2}{2}\partial_j^2 r_i \pm \frac{h^3}{6}\partial_j^3 r_i + O(h^4)`)}
      の差をとると偶数次の項が消え
      ${eq(String.raw`\frac{r_i(q + h\mathbf{e}_j) - r_i(q - h\mathbf{e}_j)}{2h} = \partial_j r_i + \frac{h^2}{6}\partial_j^3 r_i + O(h^4)`)}
      なので、誤差は ${tex('h^2')} に比例し、${tex('h')} を2倍にすると約4倍になります。`,
  ],
  figureAlt: '球面上の経線と緯線の座標網と、一点で経線と緯線に接する二つのベクトル。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">球面の座標網と偏微分の誤差</h2><div class="legend"><span><i class="numerical"></i>中心差分（近似）</span><span><i class="analytical"></i>${tex('h^2')} に比例する線</span></div></div>
        <div class="plot-pair">
          <div><h3>球面の経線と緯線</h3><canvas id="sphere-chart" role="img"></canvas><p>斜め上から見た正射影。点は ${tex(String.raw`(\theta, \varphi) = (\pi/3, \pi/6)`)}、矢印は長さを 1/2 にした接ベクトル、薄い破線は裏側です。</p></div>
          <div><h3>ヤコビ行列の誤差の最大値</h3><canvas id="error-chart" role="img"></canvas><p>刻み幅の常用対数 ${tex(String.raw`\log_{10} h`)}（縦軸は対数目盛り）。点は ${tex(String.raw`h = 10^{-3}`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>自由度 ${tex('s')}（厳密）</span><output id="dof">—</output></div>
          <div><span>誤差の最大値 ${tex(String.raw`h = 10^{-3}`)}（近似）</span><output id="max-error">—</output></div>
          <div><span>${tex('h')} を2倍にした誤差の比（近似）</span><output id="error-ratio">—</output></div>
          <div><span>接ベクトルの内積（近似）</span><output id="tangent-dot">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" id="jacobian-table">
          <thead><tr><th>成分</th><th>${tex(String.raw`\partial r_i/\partial\theta`)}（厳密）</th><th>中心差分（近似）</th><th>${tex(String.raw`\partial r_i/\partial\varphi`)}（厳密）</th><th>中心差分（近似）</th></tr></thead>
          <tbody></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('R = 2')}、${tex(String.raw`\theta = \pi/3`)}、${tex(String.raw`\varphi = \pi/6`)} とします。${tex(String.raw`\sin\theta = \sqrt3/2`)}、${tex(String.raw`\cos\theta = 1/2`)}、${tex(String.raw`\sin\varphi = 1/2`)}、${tex(String.raw`\cos\varphi = \sqrt3/2`)} なので、位置は
      ${eq(String.raw`\mathbf{r} = 2\left(\tfrac{\sqrt3}{2}\cdot\tfrac{\sqrt3}{2},\ \tfrac{\sqrt3}{2}\cdot\tfrac{1}{2},\ \tfrac{1}{2}\right) = \left(\tfrac{3}{2},\ \tfrac{\sqrt3}{2},\ 1\right)`)}
      です。確かに ${tex(String.raw`\tfrac{9}{4} + \tfrac{3}{4} + 1 = 4 = R^2`)} です。`,
    `二つの接ベクトルは
      ${eq(String.raw`\frac{\partial\mathbf{r}}{\partial\theta} = 2\left(\tfrac{1}{2}\cdot\tfrac{\sqrt3}{2},\ \tfrac{1}{2}\cdot\tfrac{1}{2},\ -\tfrac{\sqrt3}{2}\right) = \left(\tfrac{\sqrt3}{2},\ \tfrac{1}{2},\ -\sqrt3\right)`)}
      ${eq(String.raw`\frac{\partial\mathbf{r}}{\partial\varphi} = 2\left(-\tfrac{\sqrt3}{2}\cdot\tfrac{1}{2},\ \tfrac{\sqrt3}{2}\cdot\tfrac{\sqrt3}{2},\ 0\right) = \left(-\tfrac{\sqrt3}{2},\ \tfrac{3}{2},\ 0\right)`)}
      で、これは厳密な値です。${tex(String.raw`\sqrt3/2 \approx 0.866025`)} は近似です。表の中心差分 ${tex(String.raw`h = 10^{-3}`)} の値は、この厳密な値と小数6桁まで一致します。`,
    `長さの2乗と内積は
      ${eq(String.raw`\tfrac{3}{4} + \tfrac{1}{4} + 3 = 4 = R^2,\qquad \tfrac{3}{4} + \tfrac{9}{4} + 0 = 3 = R^2\sin^2\theta,\qquad -\tfrac{3}{4} + \tfrac{3}{4} + 0 = 0`)}
      で、手順5の ${tex(String.raw`g_{\theta\theta} = 4`)}、${tex(String.raw`g_{\varphi\varphi} = 3`)}、${tex(String.raw`g_{\theta\varphi} = 0`)} と厳密に一致します。ライブラリが計算した内積は <output id="example-dot">—</output>（近似）です。`,
    `誤差の大きさを見積もります。${tex(String.raw`z = 2\cos\theta`)} では ${tex(String.raw`\partial_\theta^3 z = 2\sin\theta = \sqrt3`)} なので、手順6の主要項は
      ${eq(String.raw`\frac{h^2}{6}\,\sqrt3 = \frac{10^{-6}}{6}\cdot 1.7320508 \approx 2.886751\times 10^{-7}`)}
      です。ライブラリが求めた誤差の最大値は <output id="example-error">—</output>（近似）で、この見積もりと一致します。`,
  ],
  related: [
    { href: './virtual-work.html', title: "仮想仕事の原理と d'Alembert の原理" },
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
    { href: './partial.html', title: '偏微分' },
    { href: './numerical-differentiation.html', title: '数値微分' },
  ],
  footer: 'この画面の計算は、半径 2 の球面上の一点における一般化座標の偏微分です。',
});

const sphereChart = document.querySelector<HTMLCanvasElement>('#sphere-chart')!;
const errorChart = document.querySelector<HTMLCanvasElement>('#error-chart')!;
let shown: LessonFigure | undefined;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paint() {
  if (!shown) {
    clearFigure(sphereChart);
    clearFigure(errorChart);
    return;
  }
  const figure = shown;
  const labels: Record<string, string> = { d_theta: '∂r/∂θ', d_phi: '∂r/∂φ' };
  drawPlot(sphereChart, {
    label: '半径 2 の球面の経線と緯線。点は θ = π/3、φ = π/6、矢印は二つの接ベクトル。',
    equalAspect: true,
    lines: figure.series.filter(s => s.name !== 'error' && s.name !== 'square').map(s => ({ x: s.x, y: s.y, role: s.role, width: s.name === 'grid' ? 1 : 1.8 })),
    vectors: figure.arrows.filter(a => a.name.startsWith('d_')).map(a => ({ ...a, label: labels[a.name] })),
    dots: [{ ...dot(figure, 'point', 'r'), radius: 5 }],
  });
  drawPlot(errorChart, {
    label: '中心差分で求めたヤコビ行列の誤差の最大値と刻み幅。実線は誤差、破線は h² に比例する線。',
    logY: true,
    lines: [line(figure, 'error'), line(figure, 'square')],
    dots: [dot(figure, 'chosen', 'h = 10⁻³')],
  });
}

function fill(figure: LessonFigure) {
  const v = figure.values;
  setText('dof', String(v.dof));
  setText('max-error', v.max_error.toExponential(3));
  setText('error-ratio', v.error_ratio.toFixed(4));
  setText('tangent-dot', v.tangent_dot.toExponential(1));
  setText('example-dot', v.tangent_dot.toExponential(1));
  setText('example-error', v.max_error.toExponential(6));
  const exact = figure.arrays.jacobian;
  const central = figure.arrays.central;
  document.querySelector('#jacobian-table tbody')!.innerHTML = ['x', 'y', 'z'].map((name, i) =>
    `<tr><th>${tex(name)}</th>${[0, 1].map(j => `<td>${exact[2 * i + j].toFixed(9)}</td><td>${central[2 * i + j].toFixed(9)}</td>`).join('')}</tr>`).join('');
}

async function load() {
  setStatus('loading', '計算中');
  try {
    shown = await lessonFigure('analytical/constraints', { radius: 2, theta: Math.PI / 3, phi: Math.PI / 6, h: 1e-3 });
    fill(shown);
    paint();
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
