import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fullNumber, plainNumber, texMatrix, texVector } from './figures/linalg';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'least-squares',
  section: { label: '線形代数' },
  title: '最小二乗法',
  description: `式の数 ${tex('m')} が未知数の数 ${tex('n')} より多い連立1次方程式 ${tex(String.raw`A\mathbf{x} \approx \mathbf{b}`)} は、ふつう厳密には解けません。残差 ${tex(String.raw`\mathbf{r} = \mathbf{b} - A\mathbf{x}`)} の長さの2乗を最小にする ${tex(String.raw`\mathbf{x}`)} を、正規方程式と Householder 変換の QR 分解で求めます。`,
  equation: [String.raw`\min_{\mathbf{x}} \|\mathbf{b} - A\mathbf{x}\|^2`, String.raw`A^T A\,\mathbf{x} = A^T\mathbf{b}`],
  studyHeading: '正規方程式と QR 分解による解法の手順',
  steps: [
    `記号を定めます。${tex('A')} は ${tex('m \\times n')} の行列で ${tex('m > n')}、列は1次独立とします。${tex(String.raw`\mathbf{b}`)} は長さ ${tex('m')} の観測値のベクトル、${tex(String.raw`\mathbf{x}`)} は長さ ${tex('n')} の未知数のベクトル、${tex(String.raw`\mathbf{r} = \mathbf{b} - A\mathbf{x}`)} は残差ベクトルです。最小二乗法は、残差の2乗和 ${tex(String.raw`\|\mathbf{r}\|^2 = \sum_{i=1}^{m} r_i^2`)} を最小にする ${tex(String.raw`\hat{\mathbf{x}}`)} を求めます。最小にする ${tex(String.raw`\hat{\mathbf{x}}`)} は正規方程式 ${tex(String.raw`A^T A\hat{\mathbf{x}} = A^T\mathbf{b}`)} の解で、ただ一つです（ページの最後の証明）。`,
    `例として、5個の観測点 ${tex('(t_i, b_i)')} に直線 ${tex('b = c_0 + c_1 t')} を当てはめます。
      ${eq(String.raw`(t_i, b_i) = (0, 1),\ (1, 2),\ (2, 2),\ (3, 4),\ (4, 5)`)}
      各点で ${tex('c_0 + c_1 t_i = b_i')} と置くと、未知数 ${tex(String.raw`\mathbf{x} = (c_0, c_1)^T`)} の5本の式
      ${eq(String.raw`A = \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \\ 1 & 3 \\ 1 & 4 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 1 \\ 2 \\ 2 \\ 4 \\ 5 \end{pmatrix}`)}
      になります。第1式と第2式から ${tex('c_0 = 1')}、${tex('c_1 = 1')} ですが、第3式は ${tex(String.raw`1 + 2 = 3 \neq 2`)} となり、5本を同時に満たす ${tex(String.raw`\mathbf{x}`)} はありません。`,
    `正規方程式の係数を成分ごとに計算します（${coreDoc('linalg', 'normal_equations', '正規方程式の係数の説明')}）。
      ${eq(String.raw`(A^T A)_{11} = \sum_{i} 1 = 5, \qquad (A^T A)_{12} = (A^T A)_{21} = \sum_i t_i = 0 + 1 + 2 + 3 + 4 = 10`)}
      ${eq(String.raw`(A^T A)_{22} = \sum_i t_i^2 = 0 + 1 + 4 + 9 + 16 = 30`)}
      ${eq(String.raw`(A^T\mathbf{b})_1 = \sum_i b_i = 1 + 2 + 2 + 4 + 5 = 14, \qquad (A^T\mathbf{b})_2 = \sum_i t_i b_i = 0 + 2 + 4 + 12 + 20 = 38`)}
      正規方程式は
      ${eq(String.raw`\begin{pmatrix} 5 & 10 \\ 10 & 30 \end{pmatrix}\begin{pmatrix} c_0 \\ c_1 \end{pmatrix} = \begin{pmatrix} 14 \\ 38 \end{pmatrix}`)}
      です。`,
    `第2式から第1式の2倍を引くと
      ${eq(String.raw`(10 - 10)c_0 + (30 - 20)c_1 = 38 - 28 \quad\Longrightarrow\quad c_1 = 1`)}
      ${eq(String.raw`c_0 = \frac{14 - 10 c_1}{5} = \frac{4}{5} = 0.8`)}
      で、最小二乗の直線は ${tex('b = 0.8 + t')} です。これは厳密な値です（${coreDoc('linalg', 'line_fit_centered', '直線の係数の式の説明')}）。`,
    `直線の値 ${tex(String.raw`A\hat{\mathbf{x}}`)} と残差は
      ${eq(String.raw`A\hat{\mathbf{x}} = \begin{pmatrix} 0.8 \\ 1.8 \\ 2.8 \\ 3.8 \\ 4.8 \end{pmatrix}, \qquad \hat{\mathbf{r}} = \mathbf{b} - A\hat{\mathbf{x}} = \begin{pmatrix} 0.2 \\ 0.2 \\ -0.8 \\ 0.2 \\ 0.2 \end{pmatrix}, \qquad \|\hat{\mathbf{r}}\|^2 = 4 \cdot 0.04 + 0.64 = 0.8`)}
      です。残差は ${tex('A')} のどちらの列とも直交します。
      ${eq(String.raw`A^T\hat{\mathbf{r}} = \begin{pmatrix} 0.2 + 0.2 - 0.8 + 0.2 + 0.2 \\ 0 + 0.2 - 1.6 + 0.6 + 0.8 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}`)}
      したがって ${tex(String.raw`A\hat{\mathbf{x}}`)} は、${tex(String.raw`\mathbf{b}`)} を ${tex('A')} の列空間（${tex(String.raw`A\mathbf{x}`)} の全体）へ直交射影したベクトルで、三平方の定理
      ${eq(String.raw`\|\mathbf{b}\|^2 = \|A\hat{\mathbf{x}}\|^2 + \|\hat{\mathbf{r}}\|^2, \qquad 50 = 49.2 + 0.8`)}
      が成り立ちます。`,
    `QR 分解では、${tex('A')} を直交行列 ${tex('Q')}（${tex('m \\times m')}）と上三角行列 ${tex('R')} の積 ${tex('A = QR')} に分けます。${tex('Q^T')} は長さを変えないので、${tex(String.raw`Q^T\mathbf{b}`)} の上の ${tex('n')} 個を ${tex(String.raw`\mathbf{c}_1`)}、残りを ${tex(String.raw`\mathbf{c}_2`)}、${tex('R')} の上の ${tex('n \\times n')} を ${tex('R_1')} として
      ${eq(String.raw`\|\mathbf{b} - A\mathbf{x}\|^2 = \|Q^T\mathbf{b} - R\mathbf{x}\|^2 = \|\mathbf{c}_1 - R_1\mathbf{x}\|^2 + \|\mathbf{c}_2\|^2`)}
      です。第1項は後退代入 ${tex(String.raw`R_1\mathbf{x} = \mathbf{c}_1`)} で 0 になり、最小値は ${tex(String.raw`\|\mathbf{c}_2\|^2`)} です（${coreDoc('linalg', 'least_squares_qr', 'QR 分解による最小二乗解の説明')}）。`,
    `Householder 変換は、ベクトル ${tex(String.raw`\mathbf{a}`)} を ${tex(String.raw`\alpha\mathbf{e}_1`)} に写す鏡映
      ${eq(String.raw`H = I - 2\frac{\mathbf{v}\mathbf{v}^T}{\mathbf{v}^T\mathbf{v}}, \qquad \mathbf{v} = \mathbf{a} - \alpha\mathbf{e}_1, \qquad \alpha = -\operatorname{sign}(a_1)\|\mathbf{a}\|`)}
      です（${coreDoc('linalg', 'householder_qr', 'Householder 変換の説明')}）。第1列 ${tex(String.raw`\mathbf{a} = (1, 1, 1, 1, 1)^T`)} では ${tex(String.raw`\alpha = -\sqrt{5}`)} です。例の ${tex('A')} では
      ${eq(String.raw`R_1 = \begin{pmatrix} -\sqrt{5} & -2\sqrt{5} \\ 0 & \sqrt{10} \end{pmatrix}, \qquad R_1^T R_1 = \begin{pmatrix} 5 & 10 \\ 10 & 30 \end{pmatrix} = A^T A`)}
      ${eq(String.raw`\mathbf{c}_1 = \begin{pmatrix} -14/\sqrt{5} \\ \sqrt{10} \end{pmatrix}, \qquad \sqrt{10}\,c_1 = \sqrt{10} \;\Rightarrow\; c_1 = 1, \qquad -\sqrt{5}\,c_0 - 2\sqrt{5} = -\frac{14}{\sqrt{5}} \;\Rightarrow\; c_0 = 0.8`)}
      となり、正規方程式と同じ解です。`,
    `二つの方法の違いは、解く行列の条件数 ${tex(String.raw`\kappa_2 = \sigma_{\max}/\sigma_{\min}`)}（${tex(String.raw`\sigma`)} は特異値）に現れます（${coreDoc('linalg', 'condition_number', '条件数の説明')}）。${tex(String.raw`\kappa_2(A^T A) = \kappa_2(A)^2`)}、${tex(String.raw`\kappa_2(R_1) = \kappa_2(A)`)} です。観測の時刻を ${tex(String.raw`t_i + 10^5`)} にずらすと、${tex(String.raw`\kappa_2(A)`)} は約 ${tex(String.raw`7 \times 10^{9}`)}、${tex(String.raw`\kappa_2(A^T A)`)} は約 ${tex(String.raw`5 \times 10^{19}`)} になります。厳密な傾きは同じ ${tex('c_1 = 1')} ですが、正規方程式で求めた傾きの誤差は ${tex('10^{-6}')} 程度、QR 分解で求めた傾きの誤差は ${tex('10^{-12}')} より小さくなります。`,
  ],
  figureAlt: '散布図の観測点に残差の2乗和を最小にする直線を引き、各点から直線への縦の残差と、列空間への直交射影を示す図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">当てはめた直線と残差、列空間への射影</h2><div class="legend"><span><i class="numerical"></i>計算した解</span><span><i class="analytical"></i>厳密解</span><span><i class="difference"></i>残差</span></div></div>
      ${methodTabs('最小二乗解の求め方', [{ id: 'normal', label: '正規方程式' }, { id: 'householder', label: 'QR 分解（Householder 変換）' }])}
      <div class="plot-pair">
        <div><h3>観測点と直線 ${tex('b = c_0 + c_1 t')}</h3><canvas id="fit-chart" role="img"></canvas><p>横軸 ${tex('t')}、縦軸 ${tex('b')}。煉瓦色の線分は残差 ${tex('r_i')}</p></div>
        <div><h3>${tex(String.raw`\mathbf{b}`)} の列空間への直交射影</h3><canvas id="projection-chart" role="img"></canvas><p>横軸は列空間の中の向き ${tex(String.raw`A\hat{\mathbf{x}}/\|A\hat{\mathbf{x}}\|`)}、縦軸は残差の向き</p></div>
      </div>
      <div class="readouts">
        <div><span>切片 c₀（近似）</span><output id="c0">—</output></div>
        <div><span>傾き c₁（近似）</span><output id="c1">—</output></div>
        <div><span>残差の2乗和 ‖r‖²</span><output id="residual2">—</output></div>
        <div><span>解く行列の条件数 κ₂</span><output id="kappa">—</output></div>
      </div>
      <div class="result-equation" id="solved">—</div>
      <p>時刻を ${tex(String.raw`t_i + 10^5`)} にずらした同じ観測値（厳密な傾きは 1）</p>
      <div class="readouts">
        <div><span>切片 c₀（近似）</span><output id="shifted-c0">—</output></div>
        <div><span>傾き c₁（近似）</span><output id="shifted-c1">—</output></div>
        <div><span>条件数 κ₂(A)</span><output id="shifted-kappa">—</output></div>
        <div><span>傾きの誤差 |c₁ − 1|</span><output id="shifted-error">—</output></div>
      </div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('t = 2')} の観測点 ${tex('(2, 2)')} では、直線の値は ${tex(String.raw`0.8 + 2 = 2.8`)}、残差は ${tex(String.raw`2 - 2.8 = -0.8`)} です。ほかの4点の残差はどれも ${tex('0.2')} で、
      ${eq(String.raw`\|\hat{\mathbf{r}}\|^2 = 0.2^2 + 0.2^2 + (-0.8)^2 + 0.2^2 + 0.2^2 = 0.16 + 0.64 = 0.8`)}
      です。これは厳密な値で、画面の残差の2乗和 0.8 は近似値です。`,
    `直線を少しずらして ${tex('c_0 = 1')}、${tex('c_1 = 1')} にすると、残差は ${tex('(0, 0, -1, 0, 0)')} で2乗和は ${tex('1')} になり、${tex('0.8')} より大きくなります。正規方程式の解では ${tex(String.raw`\mathbf{d} = (0.2, 0)^T`)} のずれに対して ${tex(String.raw`\|A\mathbf{d}\|^2 = 5 \cdot 0.04 = 0.2`)} だけ増え、${tex(String.raw`0.8 + 0.2 = 1`)} です。これは証明の式 ${tex(String.raw`\|\mathbf{b} - A(\hat{\mathbf{x}} + \mathbf{d})\|^2 = \|\hat{\mathbf{r}}\|^2 + \|A\mathbf{d}\|^2`)} の一例です。`,
  ],
  related: [
    { href: './regression.html', title: '線形回帰' },
    { href: './lu.html', title: 'LU 分解' },
    { href: './elimination.html', title: '連立1次方程式と消去法' },
  ],
  footer: 'この画面の計算は、5個の観測点への直線の最小二乗の当てはめです。',
  proof: writtenProof([{
    statement: `${tex('A')} を列が1次独立な ${tex('m \\times n')} 行列、${tex(String.raw`\mathbf{b} \in \mathbb{R}^m`)} とします。${tex(String.raw`\hat{\mathbf{x}}`)} が ${tex(String.raw`\|\mathbf{b} - A\mathbf{x}\|^2`)} を最小にするのは、${tex(String.raw`A^T A\hat{\mathbf{x}} = A^T\mathbf{b}`)} のとき、かつそのときに限ります。この ${tex(String.raw`\hat{\mathbf{x}}`)} はただ一つで、${tex(String.raw`\hat{\mathbf{x}} = (A^T A)^{-1}A^T\mathbf{b}`)} です。`,
    proof: [
      `${tex(String.raw`\hat{\mathbf{r}} = \mathbf{b} - A\hat{\mathbf{x}}`)} と置き、任意の ${tex(String.raw`\mathbf{d} \in \mathbb{R}^n`)} をとります。${tex(String.raw`\mathbf{b} - A(\hat{\mathbf{x}} + \mathbf{d}) = \hat{\mathbf{r}} - A\mathbf{d}`)} なので、内積を展開して
        ${eq(String.raw`\|\mathbf{b} - A(\hat{\mathbf{x}} + \mathbf{d})\|^2 = \|\hat{\mathbf{r}}\|^2 - 2(A\mathbf{d})^T\hat{\mathbf{r}} + \|A\mathbf{d}\|^2 = \|\hat{\mathbf{r}}\|^2 - 2\,\mathbf{d}^T(A^T\hat{\mathbf{r}}) + \|A\mathbf{d}\|^2`)}
        です。`,
      `${tex(String.raw`A^T A\hat{\mathbf{x}} = A^T\mathbf{b}`)} ならば ${tex(String.raw`A^T\hat{\mathbf{r}} = A^T\mathbf{b} - A^T A\hat{\mathbf{x}} = \mathbf{0}`)} なので、
        ${eq(String.raw`\|\mathbf{b} - A(\hat{\mathbf{x}} + \mathbf{d})\|^2 = \|\hat{\mathbf{r}}\|^2 + \|A\mathbf{d}\|^2 \ge \|\hat{\mathbf{r}}\|^2`)}
        です。等号は ${tex(String.raw`A\mathbf{d} = \mathbf{0}`)} のときだけで、列が1次独立なのでそれは ${tex(String.raw`\mathbf{d} = \mathbf{0}`)} のときだけです。したがって ${tex(String.raw`\hat{\mathbf{x}}`)} はただ一つの最小点です。`,
      `逆に ${tex(String.raw`\hat{\mathbf{x}}`)} が最小点だとします。${tex(String.raw`\mathbf{g} = A^T\hat{\mathbf{r}}`)}、${tex(String.raw`\mathbf{d} = s\mathbf{g}`)}（${tex('s')} は実数）と置くと、第1の式は
        ${eq(String.raw`\varphi(s) = \|\hat{\mathbf{r}}\|^2 - 2s\|\mathbf{g}\|^2 + s^2\|A\mathbf{g}\|^2`)}
        で、${tex(String.raw`\varphi`)} はすべての ${tex('s')} で ${tex(String.raw`\varphi(s) \ge \varphi(0)`)} を満たします。微分できる関数が内点 ${tex('s = 0')} で最小なので ${tex(String.raw`\varphi'(0) = -2\|\mathbf{g}\|^2 = 0`)} です。したがって ${tex(String.raw`\|\mathbf{g}\|^2 = 0`)} です。${tex(String.raw`\|\mathbf{g}\|^2 = \mathbf{g}\cdot\mathbf{g}`)} で、この内積が 0 になるのは ${tex(String.raw`\mathbf{g} = \mathbf{0}`)} のときだけなので ${tex(String.raw`\mathbf{g} = \mathbf{0}`)} です。${tex(String.raw`\mathbf{g} = A^T\hat{\mathbf{r}}`)} と置いたので ${tex(String.raw`A^T\hat{\mathbf{r}} = \mathbf{0}`)} で、これは ${tex(String.raw`A^T A\hat{\mathbf{x}} = A^T\mathbf{b}`)} です。`,
      `最後に、${tex(String.raw`A^T A`)} は正則です。${tex(String.raw`A^T A\mathbf{y} = \mathbf{0}`)} ならば ${tex(String.raw`\mathbf{y}^T A^T A\mathbf{y} = \|A\mathbf{y}\|^2 = 0`)} なので ${tex(String.raw`A\mathbf{y} = \mathbf{0}`)}、列が1次独立なので ${tex(String.raw`\mathbf{y} = \mathbf{0}`)} です。よって正規方程式の解は ${tex(String.raw`\hat{\mathbf{x}} = (A^T A)^{-1}A^T\mathbf{b}`)} として存在し、ただ一つです。`,
    ],
  }]),
});

let method = 'normal';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const fit = document.getElementById('fit-chart') as HTMLCanvasElement;
  const projection = document.getElementById('projection-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(fit);
    clearFigure(projection);
    return;
  }
  const figure = current;
  const residuals = figure.arrows
    .filter(arrow => arrow.name.startsWith('residual-'))
    .map(arrow => ({ x: [arrow.x1, arrow.x2], y: [arrow.y1, arrow.y2], role: arrow.role, width: 2.5 }));
  drawPlot(fit, {
    label: '5個の観測点と、残差の2乗和を最小にする直線。縦の線分は残差。',
    lines: [...residuals, line(figure, 'fit'), line(figure, 'exact-fit')],
    dots: figure.points.filter(point => point.name.startsWith('data-')).map(point => ({ x: point.x, y: point.y, role: point.role })),
    xMin: -0.5,
    xMax: 4.5,
    yMin: 0,
    yMax: 6,
  });
  const labels: Record<string, string> = { 'projection-b': 'b', 'projection-Ax': 'Ax̂', 'projection-r': 'r̂' };
  drawPlot(projection, {
    label: 'b を列空間へ直交射影した Ax̂ と、それに直交する残差 r̂。',
    lines: [line(figure, 'column-space')],
    vectors: figure.arrows.filter(arrow => arrow.name.startsWith('projection-')).map(arrow => ({ ...arrow, label: labels[arrow.name] })),
    equalAspect: true,
    xMin: -0.4,
    xMax: 8,
    yMin: -0.6,
    yMax: 1.6,
  });
}

function fill() {
  if (!current) return;
  const { arrays, values } = current;
  show('c0', fullNumber(arrays.x[0]));
  show('c1', fullNumber(arrays.x[1]));
  show('residual2', fullNumber(values.residual2));
  show('kappa', plainNumber(values.kappa));
  show('shifted-c0', fullNumber(values.shifted_c0));
  show('shifted-c1', fullNumber(values.shifted_c1));
  show('shifted-kappa', plainNumber(values.shifted_kappa_a, 3));
  show('shifted-error', plainNumber(values.shifted_slope_error, 3));
  const solved = method === 'normal'
    ? String.raw`A^T A = ${texMatrix(arrays.solved, 2, 2)}, \qquad A^T\mathbf{b} = ${texVector(arrays.Atb)}`
    : String.raw`R_1 = ${texMatrix(arrays.solved, 2, 2)}, \qquad \mathbf{c}_1 = ${texVector(arrays.Qtb.slice(0, 2))}, \qquad \mathbf{c}_2 = ${texVector(arrays.Qtb.slice(2))}`;
  document.getElementById('solved')!.innerHTML = tex(solved, true);
}

async function load() {
  try {
    current = await lessonFigure('linalg/least-squares', { method });
    fill();
    paint();
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

bindMethodTabs<string>(next => {
  method = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
