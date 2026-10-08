import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed, linesWith, pointsWith } from './figures/statistics';
import { eq, lessonFigure, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'pca',
  section: { label: '統計学' },
  title: '主成分分析',
  description: `2変量の標本の広がりが最も大きい向きを、共分散行列の固有ベクトルとして求めます。2次の対称行列の固有値を閉じた式で書き、第1主成分の軸への射影と、各主成分が説明する分散の割合（寄与率）を計算します。`,
  equation: [
    String.raw`\Sigma = \frac{1}{n - 1}X^T X, \qquad \Sigma\mathbf{v}_k = \lambda_k\mathbf{v}_k`,
    String.raw`\lambda_{1,2} = \frac{a + c}{2} \pm \sqrt{\left(\frac{a - c}{2}\right)^2 + b^2}`,
  ],
  equationLabel: '共分散行列シグマは中心化標本行列 X の転置と X の積を n − 1 で割ったもの。その固有値は a + c の半分 プラスマイナス 根号。',
  equationNote: `${tex(String.raw`\Sigma = \begin{pmatrix} a & b \\ b & c \end{pmatrix}`)}`,
  studyHeading: '共分散行列の固有値問題から主成分への手順',
  steps: [
    `記号を定めます。${tex('n')} 組の標本 ${tex('(x_i, y_i)')} の平均を ${tex(String.raw`(\bar{x}, \bar{y})`)} とし、平均を引いた中心化標本行列 ${tex(String.raw`X \in \mathbb{R}^{n \times 2}`)} の第 ${tex('i')} 行を ${tex(String.raw`(x_i - \bar{x},\ y_i - \bar{y})`)} とします。標本共分散行列は
      ${eq(String.raw`\Sigma = \frac{1}{n - 1}X^T X = \begin{pmatrix} a & b \\ b & c \end{pmatrix}`)}
      ${eq(String.raw`a = \frac{\sum_i (x_i - \bar{x})^2}{n - 1}, \qquad b = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{n - 1}, \qquad c = \frac{\sum_i (y_i - \bar{y})^2}{n - 1}`)}
      で、${tex('a')}、${tex('c')} は各変数の不偏分散、${tex('b')} は不偏共分散です（${coreDoc('statistics', 'covariance_2x2', '共分散行列の説明')}）。`,
    `長さ 1 の向き ${tex(String.raw`\mathbf{u}`)} への射影 ${tex(String.raw`z_i = X_i\mathbf{u}`)}（${tex('X_i')} は ${tex('X')} の第 ${tex('i')} 行）の不偏分散は、${tex(String.raw`\sum_i z_i = 0`)} なので
      ${eq(String.raw`\frac{1}{n - 1}\sum_{i=1}^{n} z_i^2 = \frac{1}{n - 1}(X\mathbf{u})^T(X\mathbf{u}) = \frac{1}{n - 1}\mathbf{u}^T X^T X\,\mathbf{u} = \mathbf{u}^T\Sigma\mathbf{u}`)}
      です。主成分分析は、${tex(String.raw`\|\mathbf{u}\| = 1`)} の条件のもとでこれを最大にする向きを求めます。最大にする ${tex(String.raw`\mathbf{u}`)} は ${tex(String.raw`\Sigma`)} の最大の固有値 ${tex(String.raw`\lambda_1`)} の固有ベクトル ${tex(String.raw`\mathbf{v}_1`)} で、最大値は ${tex(String.raw`\lambda_1`)} です（ページの最後の証明）。`,
    `固有値は ${tex(String.raw`\det(\Sigma - \lambda I) = 0`)} の根です（${tex('I')} は2次の単位行列）。行列式を定義どおりに展開し、括弧を外して、${tex(String.raw`\lambda`)} について同類項をまとめます。
      ${eq(String.raw`\det(\Sigma - \lambda I) = \det\begin{pmatrix} a - \lambda & b \\ b & c - \lambda \end{pmatrix} = (a - \lambda)(c - \lambda) - b \cdot b`)}
      ${eq(String.raw`= ac - a\lambda - c\lambda + \lambda^2 - b^2`)}
      ${eq(String.raw`= \lambda^2 - (a + c)\lambda + (ac - b^2)`)}
      この特性多項式を 0 とおいた2次方程式に解の公式を使うと
      ${eq(String.raw`\lambda = \frac{(a + c) \pm \sqrt{(a + c)^2 - 4(ac - b^2)}}{2}`)}
      です。根号の中を展開してまとめます。
      ${eq(String.raw`(a + c)^2 - 4(ac - b^2) = a^2 + 2ac + c^2 - 4ac + 4b^2`)}
      ${eq(String.raw`= a^2 - 2ac + c^2 + 4b^2 = (a - c)^2 + 4b^2 \ge 0`)}
      なので、固有値は実数です。分母の 2 を根号の中へ入れると ${tex(String.raw`\frac{1}{2}\sqrt{(a - c)^2 + 4b^2} = \sqrt{\frac{(a - c)^2}{4} + b^2}`)} なので
      ${eq(String.raw`\lambda_{1,2} = \frac{a + c}{2} \pm \sqrt{\left(\frac{a - c}{2}\right)^2 + b^2}`)}
      です（${coreDoc('statistics', 'symmetric_eigen_2x2', '2次の対称行列の固有値の説明')}）。${tex(String.raw`\lambda_1`)} は大きいほう、${tex(String.raw`\lambda_2`)} は小さいほうの固有値です。`,
    `固有ベクトル ${tex(String.raw`\mathbf{v} = (v_x, v_y)^T`)} は ${tex(String.raw`(\Sigma - \lambda_1 I)\mathbf{v} = \mathbf{0}`)} を満たします。その第1行は
      ${eq(String.raw`(a - \lambda_1)v_x + b\,v_y = 0`)}
      で、${tex(String.raw`b \ne 0`)} のとき ${tex(String.raw`(v_x, v_y) = (b,\ \lambda_1 - a)`)} がこれを満たします（${tex(String.raw`(a - \lambda_1)b + b(\lambda_1 - a) = 0`)}）。長さ ${tex(String.raw`\sqrt{b^2 + (\lambda_1 - a)^2}`)} で割って長さを 1 にすると
      ${eq(String.raw`\mathbf{v}_1 = \frac{1}{\sqrt{b^2 + (\lambda_1 - a)^2}}\begin{pmatrix} b \\ \lambda_1 - a \end{pmatrix}, \qquad \mathbf{v}_2 = \begin{pmatrix} -v_{1y} \\ v_{1x} \end{pmatrix}`)}
      です（${tex(String.raw`v_{1x}, v_{1y}`)} は ${tex(String.raw`\mathbf{v}_1`)} の成分）。${tex(String.raw`\lambda_1 \ne \lambda_2`)} のとき、対称行列の固有ベクトルは直交するので、${tex(String.raw`\mathbf{v}_1`)} を ${tex(String.raw`90^\circ`)} 回した ${tex(String.raw`\mathbf{v}_2`)} が第2主成分の向きです。`,
    `第 ${tex('k')} 主成分得点は ${tex(String.raw`\mathbf{z}_k = X\mathbf{v}_k`)}、その不偏分散は、手順2の式で ${tex(String.raw`\mathbf{u} = \mathbf{v}_k`)} とおいて
      ${eq(String.raw`\mathbf{v}_k^T\Sigma\mathbf{v}_k = \mathbf{v}_k^T(\lambda_k\mathbf{v}_k) = \lambda_k\|\mathbf{v}_k\|^2 = \lambda_k`)}
      です。閉じた式の二つの根を足すと根号が打ち消し合い、分散の合計は ${tex(String.raw`\lambda_1 + \lambda_2 = a + c`)}（行列の対角和）です。第 ${tex('k')} 主成分の寄与率は
      ${eq(String.raw`\frac{\lambda_k}{\lambda_1 + \lambda_2}`)}
      です。図の矢印は平均から ${tex(String.raw`\sqrt{\lambda_k}\,\mathbf{v}_k`)} まで伸び、長さは各主成分の標準偏差です。煉瓦色の線分は、各点から第1主成分の軸への射影です。`,
  ],
  figureAlt: '5個の標本点と、平均から最大分散の向きへ伸びる第1主成分の矢印、直交する第2主成分の矢印、各点から第1主成分の軸への射影、および主成分得点の散布図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">主成分の軸と主成分得点</h2><div class="legend"><span><i class="numerical"></i>第1主成分</span><span><i class="difference"></i>軸への射影</span></div></div>
      <div class="plot-pair">
        <div><h3>標本点と主成分の向き ${tex(String.raw`\sqrt{\lambda_k}\,\mathbf{v}_k`)}</h3><canvas id="pca-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。青の矢印は第1主成分、橙の矢印は第2主成分</p></div>
        <div><h3>主成分得点 ${tex('(z_1, z_2)')}</h3><canvas id="score-chart" role="img"></canvas><p>横軸 ${tex('z_1')}、縦軸 ${tex('z_2')}（縦横の縮尺は同じ）</p></div>
      </div>
      <div class="readouts">
        <div><span>第1固有値 λ₁（近似）</span><output id="lambda1">—</output></div>
        <div><span>第1主成分の向き v₁（近似）</span><output id="v1">—</output></div>
        <div><span>第1主成分の寄与率（近似）</span><output id="ratio1">—</output></div>
        <div><span>第2固有値 λ₂ = 射影の残りの分散（近似）</span><output id="lambda2">—</output></div>
      </div>
      <p id="covariance">—</p>
      <h3>各標本の主成分得点（小数6桁の近似）</h3>
      <div class="table-scroll"><table class="value-table" id="score-table"></table></div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `5組の標本を ${tex('(1, 3), (3, 5), (5, 6), (7, 9), (9, 7)')} とします。平均は
      ${eq(String.raw`\bar{x} = \frac{1 + 3 + 5 + 7 + 9}{5} = 5, \qquad \bar{y} = \frac{3 + 5 + 6 + 9 + 7}{5} = 6`)}
      で、中心化した値は ${tex(String.raw`x_i - \bar{x} = -4, -2, 0, 2, 4`)}、${tex(String.raw`y_i - \bar{y} = -3, -1, 0, 3, 1`)} です。`,
    `共分散行列の成分は
      ${eq(String.raw`a = \frac{16 + 4 + 0 + 4 + 16}{4} = 10, \qquad c = \frac{9 + 1 + 0 + 9 + 1}{4} = 5`)}
      ${eq(String.raw`b = \frac{(-4)(-3) + (-2)(-1) + 0 \cdot 0 + 2 \cdot 3 + 4 \cdot 1}{4} = \frac{12 + 2 + 0 + 6 + 4}{4} = 6`)}
      です。特性多項式は
      ${eq(String.raw`\det\begin{pmatrix} 10 - \lambda & 6 \\ 6 & 5 - \lambda \end{pmatrix} = (10 - \lambda)(5 - \lambda) - 6 \cdot 6`)}
      ${eq(String.raw`= 50 - 10\lambda - 5\lambda + \lambda^2 - 36`)}
      ${eq(String.raw`= \lambda^2 - 15\lambda + 14 = (\lambda - 14)(\lambda - 1)`)}
      で、手順3の閉じた式でも
      ${eq(String.raw`\lambda_{1,2} = \frac{10 + 5}{2} \pm \sqrt{\left(\frac{10 - 5}{2}\right)^2 + 6^2} = 7.5 \pm \sqrt{6.25 + 36} = 7.5 \pm \sqrt{42.25} = 7.5 \pm 6.5`)}
      です。${tex(String.raw`\lambda_1 = 14`)}、${tex(String.raw`\lambda_2 = 1`)} で、どちらも厳密な値です。`,
    `第1主成分の向きは ${tex(String.raw`(b,\ \lambda_1 - a) = (6,\ 14 - 10) = (6, 4)`)} に比例します。長さは ${tex(String.raw`\sqrt{36 + 16} = \sqrt{52} = 2\sqrt{13}`)} なので、長さ 1 にすると
      ${eq(String.raw`\mathbf{v}_1 = \frac{1}{2\sqrt{13}}\begin{pmatrix} 6 \\ 4 \end{pmatrix} = \frac{1}{\sqrt{13}}\begin{pmatrix} 3 \\ 2 \end{pmatrix} \approx \begin{pmatrix} 0.832050 \\ 0.554700 \end{pmatrix}, \qquad \mathbf{v}_2 = \frac{1}{\sqrt{13}}\begin{pmatrix} -2 \\ 3 \end{pmatrix}`)}
      です（分数は厳密な値、小数は6桁の近似）。確かに ${tex(String.raw`\Sigma\,(3, 2)^T = (10\cdot 3 + 6\cdot 2,\ 6\cdot 3 + 5\cdot 2)^T = (42, 28)^T = 14\,(3, 2)^T`)} です。寄与率は ${tex(String.raw`14/(14 + 1) = 14/15 \approx 0.933333`)}（分数は厳密、小数は近似）で、分散の約 93% が第1主成分の向きにあります。`,
    `第1主成分得点は ${tex(String.raw`z_{1i} = (3(x_i - \bar{x}) + 2(y_i - \bar{y}))/\sqrt{13}`)} です。分子は
      ${eq(String.raw`3(-4) + 2(-3) = -18,\quad 3(-2) + 2(-1) = -8,\quad 3 \cdot 0 + 2 \cdot 0 = 0,\quad 3 \cdot 2 + 2 \cdot 3 = 12,\quad 3 \cdot 4 + 2 \cdot 1 = 14`)}
      なので、得点は ${tex(String.raw`(-18, -8, 0, 12, 14)/\sqrt{13}`)} です。その不偏分散は
      ${eq(String.raw`\frac{1}{4}\cdot\frac{(-18)^2 + (-8)^2 + 0^2 + 12^2 + 14^2}{13} = \frac{1}{4}\cdot\frac{324 + 64 + 0 + 144 + 196}{13} = \frac{728}{52} = 14 = \lambda_1`)}
      で、厳密に手順5の式と一致します。`,
  ],
  related: [
    { href: './eigen.html', title: '固有値と固有ベクトル' },
    { href: './sample-stats.html', title: '標本・平均・分散' },
    { href: './regression.html', title: '線形回帰' },
  ],
  footer: 'この画面の計算は、5組の2変量標本の共分散行列と、その固有値と固有ベクトルです。',
  proof: writtenProof([{
    statement: `${tex(String.raw`\Sigma`)} を2次の実対称行列、${tex(String.raw`\lambda_1 \ge \lambda_2`)} をその固有値、${tex(String.raw`\mathbf{v}_1, \mathbf{v}_2`)} を長さ 1 の直交する固有ベクトルとします。長さ 1 のすべての ${tex(String.raw`\mathbf{u}`)} について ${tex(String.raw`\lambda_2 \le \mathbf{u}^T\Sigma\mathbf{u} \le \lambda_1`)} で、右の等号は ${tex(String.raw`\mathbf{u} = \pm\mathbf{v}_1`)} のとき（${tex(String.raw`\lambda_1 > \lambda_2`)} ならそのときだけ）成り立ちます。`,
    proof: [
      `手順3と手順4で、固有値は実数で、${tex(String.raw`\mathbf{v}_2`)} は ${tex(String.raw`\mathbf{v}_1`)} に直交することを示しました。${tex(String.raw`\mathbf{v}_1, \mathbf{v}_2`)} は平面の正規直交基底なので、長さ 1 の ${tex(String.raw`\mathbf{u}`)} は
        ${eq(String.raw`\mathbf{u} = \alpha\mathbf{v}_1 + \beta\mathbf{v}_2, \qquad \alpha^2 + \beta^2 = \|\mathbf{u}\|^2 = 1`)}
        と書けます。`,
      `${tex(String.raw`\Sigma\mathbf{v}_k = \lambda_k\mathbf{v}_k`)} と ${tex(String.raw`\mathbf{v}_1^T\mathbf{v}_2 = 0`)} により
        ${eq(String.raw`\mathbf{u}^T\Sigma\mathbf{u} = (\alpha\mathbf{v}_1 + \beta\mathbf{v}_2)^T(\alpha\lambda_1\mathbf{v}_1 + \beta\lambda_2\mathbf{v}_2) = \lambda_1\alpha^2 + \lambda_2\beta^2`)}
        です。`,
      `${tex(String.raw`\beta^2 = 1 - \alpha^2`)} を代入すると
        ${eq(String.raw`\mathbf{u}^T\Sigma\mathbf{u} = \lambda_1 - (\lambda_1 - \lambda_2)\beta^2 = \lambda_2 + (\lambda_1 - \lambda_2)\alpha^2`)}
        で、${tex(String.raw`0 \le \alpha^2, \beta^2 \le 1`)} と ${tex(String.raw`\lambda_1 - \lambda_2 \ge 0`)} から ${tex(String.raw`\lambda_2 \le \mathbf{u}^T\Sigma\mathbf{u} \le \lambda_1`)} です。`,
      `${tex(String.raw`\lambda_1 > \lambda_2`)} のとき、右の等号 ${tex(String.raw`\lambda_1 - (\lambda_1 - \lambda_2)\beta^2 = \lambda_1`)} は ${tex(String.raw`(\lambda_1 - \lambda_2)\beta^2 = 0`)}、すなわち ${tex(String.raw`\beta^2 = 0`)}、${tex(String.raw`\beta = 0`)} のときです。${tex(String.raw`\alpha^2 + \beta^2 = 1`)} に ${tex(String.raw`\beta^2 = 0`)} を入れると ${tex(String.raw`\alpha^2 = 1`)}、${tex(String.raw`\alpha = \pm 1`)}、${tex(String.raw`\mathbf{u} = \pm\mathbf{v}_1`)} です。射影の分散 ${tex(String.raw`\mathbf{u}^T\Sigma\mathbf{u}`)} を最大にする向きは第1主成分の向きで、最大値は ${tex(String.raw`\lambda_1`)} です。`,
    ],
  }]),
});

let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const data = document.getElementById('pca-chart') as HTMLCanvasElement;
  const scores = document.getElementById('score-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(data);
    clearFigure(scores);
    return;
  }
  const labels: Record<string, string> = { pc1: '√λ₁ v₁', pc2: '√λ₂ v₂' };
  drawPlot(data, {
    label: '5個の標本点、第1主成分と第2主成分の矢印、第1主成分の軸への射影。',
    lines: [...linesWith(current, 'axis'), ...linesWith(current, 'projection-', 2)],
    vectors: current.arrows.map(arrow => ({ ...arrow, label: labels[arrow.name] })),
    dots: [...pointsWith(current, 'data-', 5), ...pointsWith(current, 'mean', 4)],
    equalAspect: true,
    xMin: 0,
    xMax: 10,
    yMin: 2,
    yMax: 10,
  });
  drawPlot(scores, {
    label: '主成分得点 z₁ と z₂ の散布図。',
    dots: pointsWith(current, 'score-', 5),
    equalAspect: true,
    xMin: -5.5,
    xMax: 5.5,
    yMin: -2,
    yMax: 2,
    zeroLabel: 'z = 0',
  });
}

function fill() {
  if (!current) return;
  const { values: v, arrays: a } = current;
  show('lambda1', fixed(v.lambda1));
  show('lambda2', fixed(v.lambda2));
  show('v1', `(${fixed(v.v1x)}, ${fixed(v.v1y)})`);
  show('ratio1', fixed(v.ratio1));
  document.getElementById('covariance')!.textContent = `共分散行列の成分 a = ${fixed(v.a)}、b = ${fixed(v.b)}、c = ${fixed(v.c)}（ライブラリの値、小数6桁の近似）`;
  const row = (cells: (string | number)[], tag = 'td') => `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
  document.getElementById('score-table')!.innerHTML = row(['i', 'z₁ᵢ', 'z₂ᵢ'], 'th')
    + a.scores1.map((z, i) => row([i + 1, fixed(z), fixed(a.scores2[i])])).join('');
}

async function load() {
  try {
    current = await lessonFigure('statistics/pca');
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
