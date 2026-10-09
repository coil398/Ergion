import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Search = 'bisection' | 'secant';

const modes = [1, 2, 3, 4];

renderLesson({
  id: 'sturm-liouville',
  section: { label: '微分方程式', href: './ode.html' },
  title: 'Sturm–Liouville 問題',
  description: `2階の線形微分方程式に両端の境界条件を課すと、0 でない解は特別な値 ${tex(String.raw`\lambda`)} のときにだけ存在します。その値を固有値、解を固有関数と呼びます。${tex(String.raw`-x'' = \lambda x`)}、${tex(String.raw`x(0) = x(\pi) = 0`)} の固有値をシューティング法で探し、固有関数が互いに直交することを確かめます。`,
  equation: [
    String.raw`\frac{d}{dt}\!\left[p(t)\frac{dx}{dt}\right] + q(t)\,x + \lambda\, w(t)\, x = 0`,
    String.raw`-x'' = \lambda x,\quad x(0) = x(\pi) = 0`,
  ],
  equationNote: '例は p = w = 1、q = 0、区間 [0, π]',
  studyHeading: '固有値と固有関数を求める手順',
  steps: [
    `記号を定めます。${tex('t')} は区間 ${tex('[a, b]')} の独立変数、${tex('x(t)')} は未知関数です。${tex('p(t) > 0')}、${tex('q(t)')}、重み関数 ${tex('w(t) > 0')} は与えられた関数、${tex(String.raw`\lambda`)} は定数です。境界条件は
      ${eq(String.raw`\alpha_1 x(a) + \alpha_2 x'(a) = 0,\qquad \beta_1 x(b) + \beta_2 x'(b) = 0`)}
      で、${tex(String.raw`(\alpha_1, \alpha_2) \ne (0, 0)`)}、${tex(String.raw`(\beta_1, \beta_2) \ne (0, 0)`)} です。${tex('x \\equiv 0')} はいつでも解です。0 でない解が存在する ${tex(String.raw`\lambda`)} を固有値 ${tex(String.raw`\lambda_n`)}、その解を固有関数 ${tex('x_n(t)')} と呼びます。このページの例は ${tex('p = w = 1')}、${tex('q = 0')}、${tex(String.raw`[a, b] = [0, \pi]`)}、${tex(String.raw`\alpha_1 = \beta_1 = 1`)}、${tex(String.raw`\alpha_2 = \beta_2 = 0`)} で、方程式は ${tex(String.raw`-x'' = \lambda x`)}、境界条件は ${tex(String.raw`x(0) = x(\pi) = 0`)} です。`,
    `まず ${tex(String.raw`\lambda \le 0`)} には固有値がないことを示します。${tex(String.raw`\lambda = 0`)} のとき ${tex(`x'' = 0`)} なので
      ${eq(String.raw`x(t) = A + B t`)}
      ${eq(String.raw`x(0) = A = 0,\qquad x(\pi) = B\pi = 0 \ \Rightarrow\ B = 0`)}
      です。${tex(String.raw`\lambda = -\mu^2`)}（${tex(String.raw`\mu > 0`)}）のとき ${tex(String.raw`x'' = \mu^2 x`)} なので
      ${eq(String.raw`x(t) = A\cosh\mu t + B\sinh\mu t`)}
      ${eq(String.raw`x(0) = A = 0,\qquad x(\pi) = B\sinh\mu\pi = 0`)}
      です。${tex(String.raw`\sinh\mu\pi > 0`)} なので ${tex('B = 0')} です。どちらも解は ${tex('x \\equiv 0')} だけです。`,
    `${tex(String.raw`\lambda = k^2`)}（${tex('k > 0')}）のとき ${tex(String.raw`x'' = -k^2 x`)} なので
      ${eq(String.raw`x(t) = A\cos kt + B\sin kt`)}
      ${eq(String.raw`x(0) = A = 0`)}
      ${eq(String.raw`x(\pi) = B\sin k\pi = 0`)}
      です。0 でない解には ${tex(String.raw`B \ne 0`)} が要るので ${tex(String.raw`\sin k\pi = 0`)}、すなわち ${tex('k = n')}（${tex(String.raw`n = 1, 2, 3, \ldots`)}）です。したがって固有値と固有関数は
      ${eq(String.raw`\lambda_n = n^2,\qquad x_n(t) = \sin nt`)}
      です（${coreDoc('differential', 'dirichlet_eigenvalue', '厳密な固有値の説明')}）。${tex(String.raw`\sin nt`)} は ${tex(String.raw`t = j\pi/n`)}（${tex(String.raw`j = 1, \ldots, n-1`)}）で 0 になるので、区間の内部の節の数は ${tex('n - 1')} です。固有値が大きいほど節が一つずつ増えます。`,
    `シューティング法は、右端の境界条件を初期条件に置き換えて、初期値問題を繰り返し解きます。左端では ${tex('x(0) = 0')} とし、傾きを ${tex(`x'(0) = 1`)} と決めます。${tex(`y = x'`)} と置くと
      ${eq(String.raw`x' = y,\qquad y' = -\lambda x,\qquad x(0) = 0,\quad y(0) = 1`)}
      です。これを古典的RK4 で刻み幅 ${tex(String.raw`h = \pi/N`)} の ${tex('N')} ステップ進め、右端の値を残差
      ${eq(String.raw`r(\lambda) = x(\pi;\lambda)`)}
      とします（${coreDoc('differential', 'shooting_residual', '残差の説明')}）。厳密には ${tex(String.raw`x(t;\lambda) = \sin(\sqrt\lambda\,t)/\sqrt\lambda`)} なので
      ${eq(String.raw`r(\lambda) = \frac{\sin(\sqrt\lambda\,\pi)}{\sqrt\lambda}`)}
      で、${tex(String.raw`r(\lambda) = 0`)} の根が固有値 ${tex(String.raw`\lambda_n = n^2`)} です。画面の残差はRK4 による近似です。`,
    `根を探します。${tex(String.raw`\lambda`)} を ${tex(String.raw`\delta = 1/4`)} ずつ増やして ${tex(String.raw`r(\lambda)`)} の符号が ${tex('n')} 回目に変わる区間 ${tex(String.raw`[\lambda_a, \lambda_b]`)} を見つけます。隣の固有値との間隔 ${tex(String.raw`(n+1)^2 - n^2 = 2n + 1 \ge 3`)} は ${tex(String.raw`\delta`)} より大きいので、一つの区間に根は一つです。二分法は中点
      ${eq(String.raw`\lambda_c = \frac{\lambda_a + \lambda_b}{2}`)}
      の残差の符号で区間を半分にします。${tex('k')} 回の後の幅は ${tex(String.raw`\delta/2^k`)} です。割線法は直前の2点を通る直線の根へ進みます。
      ${eq(String.raw`\lambda_{k+1} = \lambda_k - r(\lambda_k)\,\frac{\lambda_k - \lambda_{k-1}}{r(\lambda_k) - r(\lambda_{k-1})}`)}
      割線法の収束の次数は ${tex(String.raw`(1 + \sqrt5)/2 \approx 1.618`)} なので、二分法より少ない反復で止まります（${coreDoc('differential', 'shooting_eigenvalue', '固有値を探す手順の説明')}）。`,
    `固有関数の直交性を数値で確かめます。シューティングで得た ${tex('x_n')} を
      ${eq(String.raw`\phi_n = \frac{x_n}{\sqrt{\int_0^\pi x_n^2\,dt}}`)}
      と正規化し、内積 ${tex(String.raw`G_{nm} = \int_0^\pi \phi_n \phi_m\,dt`)} を格子 ${tex(String.raw`t_i = i h`)} の上の Simpson 則
      ${eq(String.raw`\int_0^\pi f\,dt \approx \frac{h}{3}\Big[f_0 + 4\sum_{i\ \text{奇数}} f_i + 2\sum_{i\ \text{偶数},\,0<i<N} f_i + f_N\Big]`)}
      で計算します（${coreDoc('differential', 'grid_inner_product', '内積の説明')}）。厳密には ${tex(String.raw`G_{nm} = 1`)}（${tex('n = m')}）、${tex(String.raw`G_{nm} = 0`)}（${tex(String.raw`n \ne m`)}）です。0 になることは、この節の最後の証明が一般の Sturm–Liouville 問題について示します。`,
  ],
  figureAlt: '節の数が一つずつ増える固有関数 sin t、sin 2t、sin 3t、sin 4t の波形。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">固有関数とシューティングの残差</h2><div class="legend"><span><i class="numerical"></i>シューティング法（近似）</span><span><i class="analytical"></i>厳密解</span></div></div>
        ${methodTabs('固有値を探す方法', [{ id: 'bisection', label: '二分法' }, { id: 'secant', label: '割線法' }])}
        <div class="plot-pair">
          <div><h3>正規化した固有関数 ${tex(String.raw`\phi_n(t)`)}</h3><canvas id="mode-chart" role="img"></canvas><p>独立変数 t</p></div>
          <div><h3>残差 ${tex(String.raw`x(\pi;\lambda)`)}</h3><canvas id="residual-chart" role="img"></canvas><p>固有値の候補 λ。点は求めた根、輪は厳密な固有値、点線は残差 0 です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex(String.raw`\lambda_1`)} の近似</span><output id="lambda1">—</output></div>
          <div><span>${tex(String.raw`\lambda_1`)} を求めた反復の回数</span><output id="iterations1">—</output></div>
          <div><span>内積 ${tex(String.raw`G_{12}`)} の近似</span><output id="gram12">—</output></div>
          <div><span>${tex(String.raw`\lambda_4 - 16`)}</span><output id="lambda4-error">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" id="eigen-table">
          <thead><tr><th>${tex('n')}</th><th>${tex(String.raw`\lambda_n`)}（近似）</th><th>${tex('n^2')}（厳密）</th><th>反復の回数</th><th>内部の節の数</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <div class="table-scroll"><table class="value-table" id="gram-table">
          <thead><tr><th>${tex(String.raw`G_{nm}`)}（近似）</th>${modes.map(m => `<th>${tex(`m = ${m}`)}</th>`).join('')}</tr></thead>
          <tbody></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\lambda = 1`)} のとき、厳密な解は ${tex(String.raw`x(t;1) = \sin t`)} で、残差は
      ${eq(String.raw`r(1) = \sin\pi = 0`)}
      です。したがって ${tex(String.raw`\lambda_1 = 1`)} は厳密な固有値です。画面の ${tex('N = 200')} ステップのシューティングで求めた値は <output id="example-lambda">—</output>（近似）です。`,
    `${tex(String.raw`x_1 = \sin t`)} と ${tex(String.raw`x_2 = \frac{1}{2}\sin 2t`)}（${tex(`x'(0) = 1`)} にそろえた ${tex('n = 2')} の解）の内積は、${tex(String.raw`\sin 2t = 2\sin t\cos t`)} より
      ${eq(String.raw`\int_0^\pi \sin t\cdot\tfrac{1}{2}\sin 2t\,dt = \int_0^\pi \sin^2 t\cos t\,dt = \Big[\tfrac{1}{3}\sin^3 t\Big]_0^\pi = 0`)}
      で、厳密に 0 です。Simpson 則による近似は <output id="example-cross">—</output> です。`,
    `${tex('x_1')} の2乗の積分は、${tex(String.raw`\sin^2 t = \frac{1}{2}(1 - \cos 2t)`)} より
      ${eq(String.raw`\int_0^\pi \sin^2 t\,dt = \Big[\tfrac{t}{2} - \tfrac{1}{4}\sin 2t\Big]_0^\pi = \frac{\pi}{2} \approx 1.5707963`)}
      です。Simpson 則による近似は <output id="example-norm">—</output> です。`,
  ],
  related: [
    { href: './series.html', title: 'べき級数' },
    { href: './heat.html', title: '熱伝導方程式' },
    { href: './wave.html', title: '波動方程式' },
    { href: './eigen.html', title: '固有値と固有ベクトル' },
  ],
  footer: 'この画面の計算は、区間 [0, π] の固有値問題 −x″ = λx のシューティング法です。',
  proof: writtenProof([{
    statement: `${tex('p')}、${tex(`p'`)}、${tex('q')}、${tex('w')} は ${tex('[a, b]')} で連続で、${tex('p > 0')}、${tex('w > 0')} とします。${tex(String.raw`\lambda_n \ne \lambda_m`)} を二つの固有値、${tex('x_n')}、${tex('x_m')} をそれぞれの固有関数とし、どちらも同じ境界条件 ${tex(String.raw`\alpha_1 x(a) + \alpha_2 x'(a) = 0`)}、${tex(String.raw`\beta_1 x(b) + \beta_2 x'(b) = 0`)} を満たすとします。このとき ${tex(String.raw`\int_a^b x_n(t)\,x_m(t)\,w(t)\,dt = 0`)} です。`,
    proof: [
      `${tex(String.raw`L[x] = (p x')' + q x`)} と置きます。固有関数の方程式は
        ${eq(String.raw`L[x_n] = -\lambda_n w x_n,\qquad L[x_m] = -\lambda_m w x_m`)}
        です。`,
      `第1式に ${tex('x_m')}、第2式に ${tex('x_n')} を掛けて引きます。
        ${eq(String.raw`x_m L[x_n] - x_n L[x_m] = -\lambda_n w x_n x_m + \lambda_m w x_n x_m = (\lambda_m - \lambda_n)\, w\, x_n x_m`)}
        左辺の ${tex('q')} の項は ${tex(String.raw`x_m q x_n - x_n q x_m = 0`)} で消えるので
        ${eq(String.raw`x_m (p x_n')' - x_n (p x_m')' = (\lambda_m - \lambda_n)\, w\, x_n x_m`)}
        です。`,
      `${tex(String.raw`W = x_m x_n' - x_n x_m'`)} と置き、積の微分で ${tex('pW')} を微分します。
        ${eq(String.raw`(pW)' = p'(x_m x_n' - x_n x_m') + p(x_m' x_n' + x_m x_n'' - x_n' x_m' - x_n x_m'')`)}
        ${eq(String.raw`= x_m(p' x_n' + p x_n'') - x_n(p' x_m' + p x_m'')`)}
        ${eq(String.raw`= x_m (p x_n')' - x_n (p x_m')'`)}
        これは前の手順の左辺です（Lagrange の恒等式）。`,
      `両辺を ${tex('a')} から ${tex('b')} まで積分し、微分積分学の基本定理を使います。
        ${eq(String.raw`(\lambda_m - \lambda_n)\int_a^b w\, x_n x_m\,dt = \Big[p(t)\,W(t)\Big]_a^b = p(b)W(b) - p(a)W(a)`)}`,
      `左端の境界条件を二つの固有関数について並べると
        ${eq(String.raw`\begin{pmatrix} x_n(a) & x_n'(a) \\ x_m(a) & x_m'(a) \end{pmatrix}\begin{pmatrix} \alpha_1 \\ \alpha_2 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}`)}
        です。${tex(String.raw`(\alpha_1, \alpha_2) \ne (0, 0)`)} がこの方程式を満たすので、係数の行列は正則ではなく、行列式は 0 です。
        ${eq(String.raw`x_n(a)\,x_m'(a) - x_n'(a)\,x_m(a) = 0`)}
        ${tex(String.raw`W(a) = x_m(a)\,x_n'(a) - x_n(a)\,x_m'(a)`)} なので、符号を変えて並べかえると
        ${eq(String.raw`-W(a) = -\bigl(x_m(a)\,x_n'(a) - x_n(a)\,x_m'(a)\bigr) = x_n(a)\,x_m'(a) - x_n'(a)\,x_m(a)`)}
        この行列式は ${tex('-W(a)')} なので ${tex('-W(a) = 0')}、すなわち ${tex('W(a) = 0')} です。右端の条件から、同じ理由で ${tex('W(b) = 0')} です。`,
      `したがって右辺は ${tex(String.raw`p(b)\cdot 0 - p(a)\cdot 0 = 0`)} で、
        ${eq(String.raw`(\lambda_m - \lambda_n)\int_a^b w\, x_n x_m\,dt = 0`)}
        です。${tex(String.raw`\lambda_m - \lambda_n \ne 0`)} で割ると ${tex(String.raw`\int_a^b x_n x_m w\,dt = 0`)} を得ます。例の ${tex('w = 1')}、${tex(String.raw`[0, \pi]`)} では ${tex(String.raw`\int_0^\pi \sin nt\,\sin mt\,dt = 0`)}（${tex(String.raw`n \ne m`)}）です。`,
    ],
  }]),
});

const modeChart = document.querySelector<HTMLCanvasElement>('#mode-chart')!;
const residualChart = document.querySelector<HTMLCanvasElement>('#residual-chart')!;
let search: Search = 'bisection';
let shown: LessonFigure | undefined;
let request = 0;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paint() {
  if (!shown) {
    clearFigure(modeChart);
    clearFigure(residualChart);
    return;
  }
  const figure = shown;
  drawPlot(modeChart, {
    label: '正規化した固有関数 φ1 から φ4。実線はシューティング法の近似、破線は厳密解 √(2/π) sin nt。',
    xMin: 0,
    xMax: Math.PI,
    yMin: -1,
    yMax: 1,
    lines: modes.flatMap(n => [line(figure, `mode${n}`), line(figure, `exact${n}`)]),
    dots: modes.map(n => dot(figure, `peak${n}`, `n = ${n}`)),
    zeroLabel: 'φ = 0',
  });
  drawPlot(residualChart, {
    label: 'シューティングの残差 x(π; λ)。点は求めた固有値、輪は厳密な固有値 n²。',
    xMin: 0,
    xMax: 20,
    yMin: -1.2,
    yMax: 3.6,
    lines: [line(figure, 'residual')],
    dots: modes.flatMap(n => [dot(figure, `root${n}`, `λ${'₁₂₃₄'[n - 1]}`), { ...dot(figure, `exact_root${n}`), hollow: true, radius: 7 }]),
  });
}

function fill(figure: LessonFigure) {
  const v = figure.values;
  setText('lambda1', v.lambda1.toFixed(9));
  setText('iterations1', String(v.iterations1));
  setText('gram12', figure.arrays.gram[1].toExponential(2));
  setText('lambda4-error', (v.lambda4 - v.exact_lambda4).toExponential(2));
  setText('example-lambda', v.lambda1.toFixed(9));
  setText('example-cross', v.cross12.toExponential(2));
  setText('example-norm', v.norm1.toFixed(7));
  document.querySelector('#eigen-table tbody')!.innerHTML = modes.map(n =>
    `<tr><td>${n}</td><td>${v[`lambda${n}`].toFixed(9)}</td><td>${v[`exact_lambda${n}`]}</td><td>${v[`iterations${n}`]}</td><td>${v[`nodes${n}`]}</td></tr>`).join('');
  document.querySelector('#gram-table tbody')!.innerHTML = modes.map((n, i) =>
    `<tr><th>${tex(`n = ${n}`)}</th>${modes.map((_, j) => {
      const g = figure.arrays.gram[4 * i + j];
      return `<td>${i === j ? g.toFixed(9) : g.toExponential(2)}</td>`;
    }).join('')}</tr>`).join('');
}

async function load() {
  const id = ++request;
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('ode/sturm-liouville', { search, steps: 200 });
    if (id !== request) return;
    shown = figure;
    fill(figure);
    paint();
    setStatus('finished');
  } catch (error) {
    if (id !== request) return;
    console.error(error);
    setStatus('error');
  }
}

bindMethodTabs<Search>(next => {
  search = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
