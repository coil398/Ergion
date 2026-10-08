import { coreDoc } from './chrome';
import { clearFigure } from './figures';
import { drawMatrixBlocks, fullNumber, plainNumber, texMatrix, texVector } from './figures/linalg';
import { eq, lessonFigure, renderLesson, setStatus } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'lu',
  section: { label: '線形代数' },
  title: 'LU 分解',
  description: `正方行列 ${tex('A')} の行を置換行列 ${tex('P')} で並べ替え、対角成分が 1 の下三角行列 ${tex('L')} と上三角行列 ${tex('U')} の積 ${tex('PA = LU')} に分けます。連立1次方程式 ${tex(String.raw`A\mathbf{x} = \mathbf{b}`)} は、二つの三角行列の連立方程式を順に解くことで解けます。`,
  equation: [String.raw`PA = LU`, String.raw`L\mathbf{y} = P\mathbf{b}, \quad U\mathbf{x} = \mathbf{y}`],
  equationLabel: 'P A は L U に等しい。L y は P b、U x は y。',
  studyHeading: 'Doolittle 法による分解と代入の手順',
  steps: [
    `記号を定めます。${tex('A')} は ${tex('n \\times n')} の正則行列、${tex('P')} は単位行列の行を並べ替えた置換行列、${tex('L = (l_{ij})')} は対角成分が 1 の下三角行列、${tex('U = (u_{ij})')} は上三角行列です。${tex('P\\mathbf{b}')} は ${tex(String.raw`\mathbf{b}`)} の成分を同じ順に並べ替えたベクトルです。Gauss の消去法の乗数 ${tex('m_{ik}')} を ${tex('L')} の対角の下に ${tex('l_{ik} = m_{ik}')} として残し、消去を終えた係数行列を ${tex('U')} とする方法を Doolittle 法と呼びます。`,
    `${tex('PA = LU')} が分かれば、${tex(String.raw`A\mathbf{x} = \mathbf{b}`)} の両辺に左から ${tex('P')} を掛けて
      ${eq(String.raw`PA\mathbf{x} = P\mathbf{b} \quad\Longleftrightarrow\quad L(U\mathbf{x}) = P\mathbf{b}`)}
      です。${tex(String.raw`\mathbf{y} = U\mathbf{x}`)} と置くと、前進代入 ${tex(String.raw`L\mathbf{y} = P\mathbf{b}`)} で ${tex(String.raw`\mathbf{y}`)} を、後退代入 ${tex(String.raw`U\mathbf{x} = \mathbf{y}`)} で ${tex(String.raw`\mathbf{x}`)} を求めます。
      ${eq(String.raw`y_i = (P\mathbf{b})_i - \sum_{j=1}^{i-1} l_{ij} y_j, \qquad x_i = \frac{1}{u_{ii}}\Big(y_i - \sum_{j=i+1}^{n} u_{ij} x_j\Big)`)}
      分解は一度だけ行い、右辺 ${tex(String.raw`\mathbf{b}`)} が変わるたびに二つの代入だけを繰り返します。`,
    `連立1次方程式と消去法のページと同じ行列を、部分ピボット選択付きで分解します。
      ${eq(String.raw`A = \begin{pmatrix} 2 & 1 & -1 \\ -3 & -1 & 2 \\ -2 & 1 & 2 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 8 \\ -11 \\ -3 \end{pmatrix}`)}
      第1段では、第1列の成分 ${tex('2, -3, -2')} のうち絶対値が最大の ${tex('-3')} を持つ第2行を第1行と入れ替えます。
      ${eq(String.raw`\begin{pmatrix} -3 & -1 & 2 \\ 2 & 1 & -1 \\ -2 & 1 & 2 \end{pmatrix}`)}
      乗数は
      ${eq(String.raw`l_{21} = \frac{2}{-3} = -\frac{2}{3}, \qquad l_{31} = \frac{-2}{-3} = \frac{2}{3}`)}
      で、各行から乗数を掛けた第1行を引きます。第2行には ${tex(String.raw`-l_{21} = \tfrac{2}{3}`)} 倍を加えます。
      ${eq(String.raw`(2,\ 1,\ -1) + \tfrac{2}{3}(-3,\ -1,\ 2) = (2,\ 1,\ -1) + (-2,\ -\tfrac{2}{3},\ \tfrac{4}{3})`)}
      ${eq(String.raw`= (2 - 2,\ 1 - \tfrac{2}{3},\ -1 + \tfrac{4}{3}) = (0,\ \tfrac{1}{3},\ \tfrac{1}{3})`)}
      第3行からは ${tex(String.raw`l_{31} = \tfrac{2}{3}`)} 倍を引きます。
      ${eq(String.raw`(-2,\ 1,\ 2) - \tfrac{2}{3}(-3,\ -1,\ 2) = (-2,\ 1,\ 2) - (-2,\ -\tfrac{2}{3},\ \tfrac{4}{3})`)}
      ${eq(String.raw`= (-2 + 2,\ 1 + \tfrac{2}{3},\ 2 - \tfrac{4}{3}) = (0,\ \tfrac{5}{3},\ \tfrac{2}{3})`)}
      第1段のあとの行列は、乗数を対角の下の 0 の位置に括弧で書くと
      ${eq(String.raw`\begin{pmatrix} -3 & -1 & 2 \\ (-\tfrac{2}{3}) & \tfrac{1}{3} & \tfrac{1}{3} \\ (\tfrac{2}{3}) & \tfrac{5}{3} & \tfrac{2}{3} \end{pmatrix}`)}
      です。`,
    `第2段では、第2列の対角から下の成分 ${tex(String.raw`\tfrac{1}{3}, \tfrac{5}{3}`)} のうち大きい ${tex(String.raw`\tfrac{5}{3}`)} の行を第2行に上げます。すでに決まった乗数も同じ行と一緒に入れ替わります。
      ${eq(String.raw`\begin{pmatrix} -3 & -1 & 2 \\ (\tfrac{2}{3}) & \tfrac{5}{3} & \tfrac{2}{3} \\ (-\tfrac{2}{3}) & \tfrac{1}{3} & \tfrac{1}{3} \end{pmatrix}`)}
      したがって ${tex(String.raw`l_{21} = \tfrac{2}{3}`)}、${tex(String.raw`l_{31} = -\tfrac{2}{3}`)} です。第2段の乗数と引き算は
      ${eq(String.raw`l_{32} = \frac{1/3}{5/3} = \frac{1}{3}\cdot\frac{3}{5} = \frac{1}{5}`)}
      ${eq(String.raw`(0,\ \tfrac{1}{3},\ \tfrac{1}{3}) - \tfrac{1}{5}(0,\ \tfrac{5}{3},\ \tfrac{2}{3}) = (0,\ \tfrac{1}{3},\ \tfrac{1}{3}) - (0,\ \tfrac{1}{3},\ \tfrac{2}{15})`)}
      ${eq(String.raw`= (0,\ \tfrac{1}{3} - \tfrac{1}{3},\ \tfrac{5}{15} - \tfrac{2}{15}) = (0,\ 0,\ \tfrac{3}{15}) = (0,\ 0,\ \tfrac{1}{5})`)}
      です。行は元の第2行、第3行、第1行の順に並んだので、
      ${eq(String.raw`P = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 1 & 0 & 0 \end{pmatrix}, \quad L = \begin{pmatrix} 1 & 0 & 0 \\ \tfrac{2}{3} & 1 & 0 \\ -\tfrac{2}{3} & \tfrac{1}{5} & 1 \end{pmatrix}, \quad U = \begin{pmatrix} -3 & -1 & 2 \\ 0 & \tfrac{5}{3} & \tfrac{2}{3} \\ 0 & 0 & \tfrac{1}{5} \end{pmatrix}`)}
      です（${coreDoc('linalg', 'lu_decompose', 'LU 分解の説明')}）。どの乗数も絶対値が 1 以下です。`,
    `前進代入 ${tex(String.raw`L\mathbf{y} = P\mathbf{b}`)} を解きます。${tex(String.raw`P\mathbf{b} = (-11,\ -3,\ 8)^T`)} です。
      ${eq(String.raw`y_1 = -11`)}
      ${eq(String.raw`y_2 = -3 - \tfrac{2}{3}\,y_1 = -3 + \tfrac{22}{3} = \tfrac{13}{3}`)}
      ${eq(String.raw`y_3 = 8 + \tfrac{2}{3}\,y_1 - \tfrac{1}{5}\,y_2 = 8 - \tfrac{22}{3} - \tfrac{13}{15} = -\tfrac{1}{5}`)}
      （${coreDoc('linalg', 'forward_substitution', '前進代入の説明')}）`,
    `後退代入 ${tex(String.raw`U\mathbf{x} = \mathbf{y}`)} を下の行から解きます。
      ${eq(String.raw`x_3 = \frac{-1/5}{1/5} = -1`)}
      ${eq(String.raw`x_2 = \frac{\tfrac{13}{3} - \tfrac{2}{3}x_3}{5/3} = \frac{15/3}{5/3} = 3`)}
      ${eq(String.raw`x_1 = \frac{-11 + x_2 - 2x_3}{-3} = \frac{-11 + 3 + 2}{-3} = 2`)}
      解は ${tex(String.raw`\mathbf{x} = (2,\ 3,\ -1)^T`)} で、消去法の結果と同じ厳密な値です。`,
  ],
  figureAlt: '密な行列 PA が、対角成分が 1 の下三角行列 L と上三角行列 U の積に分かれるブロック構造の図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">分解 ${tex('PA = LU')} の成分</h2><div class="legend"><span><i class="numerical"></i>0 でない成分</span></div></div>
      <canvas id="lu-chart" role="img"></canvas><p>升目の数はライブラリが返した成分（有効数字3桁の近似）。枠のない升は 0 です。</p>
      <div class="readouts">
        <div><span>解 x（近似）</span><output id="lu-x">—</output></div>
        <div><span>残差 ‖Ax − b‖</span><output id="lu-residual">—</output></div>
        <div><span>乗数 l₂₁（近似）</span><output id="lu-l21">—</output></div>
        <div><span>PA − LU の成分の最大の絶対値</span><output id="lu-gap">—</output></div>
      </div>
      <p>ライブラリが返した置換、分解、代入の結果（有効数字6桁の近似）</p>
      <div class="solution-equation" id="lu-factors">—</div>
      <div class="solution-equation" id="lu-solve">—</div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('L')} の第3行と ${tex('U')} の積が ${tex('PA')} の第3行、つまり元の第1行 ${tex('(2,\\ 1,\\ -1)')} になることを確かめます。
      ${eq(String.raw`-\tfrac{2}{3}\cdot(-3) = 2, \qquad -\tfrac{2}{3}\cdot(-1) + \tfrac{1}{5}\cdot\tfrac{5}{3} = \tfrac{2}{3} + \tfrac{1}{3} = 1`)}
      ${eq(String.raw`-\tfrac{2}{3}\cdot 2 + \tfrac{1}{5}\cdot\tfrac{2}{3} + 1\cdot\tfrac{1}{5} = -\tfrac{20}{15} + \tfrac{2}{15} + \tfrac{3}{15} = -1`)}
      どれも厳密に一致します。`,
    `画面のライブラリの値は、${tex(String.raw`l_{21} = \tfrac{2}{3}`)} が 0.666667、${tex(String.raw`u_{22} = \tfrac{5}{3}`)} が 1.66667、${tex(String.raw`u_{33} = \tfrac{1}{5}`)} が 0.2 で、どれも有効数字6桁で手計算の分数と一致する近似値です。${tex('PA - LU')} の成分と残差 ${tex(String.raw`\|A\mathbf{x} - \mathbf{b}\|`)} は ${tex('10^{-15}')} 程度で、厳密には 0 です。`,
  ],
  related: [
    { href: './elimination.html', title: '連立1次方程式と消去法' },
    { href: './least-squares.html', title: '最小二乗法' },
    { href: './heat.html', title: '熱伝導方程式' },
  ],
  footer: 'この画面の計算は、3行3列の行列の部分ピボット選択付き LU 分解です。',
});

let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const canvas = document.getElementById('lu-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(canvas);
    return;
  }
  const { arrays } = current;
  drawMatrixBlocks(canvas, [
    { label: 'PA', rows: 3, cols: 3, values: arrays.PA },
    { label: 'L', rows: 3, cols: 3, values: arrays.L },
    { label: 'U', rows: 3, cols: 3, values: arrays.U },
  ], ['=', '·'], '行を並べ替えた行列 PA と、下三角行列 L、上三角行列 U の成分。');
}

function fill() {
  if (!current) return;
  const { arrays, values } = current;
  show('lu-x', `(${arrays.x.map(fullNumber).join(', ')})`);
  show('lu-residual', plainNumber(values.residual, 3));
  show('lu-l21', plainNumber(arrays.L[3]));
  show('lu-gap', plainNumber(values.factor_gap, 3));
  document.getElementById('lu-factors')!.innerHTML = tex(String.raw`P = ${texMatrix(arrays.P, 3, 3)}, \quad L = ${texMatrix(arrays.L, 3, 3)}, \quad U = ${texMatrix(arrays.U, 3, 3)}`, true);
  document.getElementById('lu-solve')!.innerHTML = tex(String.raw`P\mathbf{b} = ${texVector(arrays.Pb)}, \quad \mathbf{y} = ${texVector(arrays.y)}, \quad \mathbf{x} = ${texVector(arrays.x)}`, true);
}

async function load() {
  try {
    current = await lessonFigure('linalg/lu');
    fill();
    paint();
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
