import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed, linesWith, pointsWith } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'regression',
  section: { label: '統計学' },
  title: '線形回帰',
  description: `2変量の標本 ${tex('(x_i, y_i)')} に直線 ${tex(String.raw`y = \beta_0 + \beta_1 x`)} を当てはめます。残差の2乗和を最小にする係数 ${tex(String.raw`\hat{\beta}_0`)}、${tex(String.raw`\hat{\beta}_1`)} を偏微分から導き、直線が ${tex('y')} の変動のどれだけを説明するかを決定係数 ${tex('R^2')} で表します。`,
  equation: [
    String.raw`\hat{\beta}_1 = \frac{\sum_{i}(x_i - \bar{x})(y_i - \bar{y})}{\sum_{i}(x_i - \bar{x})^2}, \qquad \hat{\beta}_0 = \bar{y} - \hat{\beta}_1\bar{x}`,
    String.raw`R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}`,
  ],
  studyHeading: '残差平方和の最小化から回帰係数への手順',
  steps: [
    `記号を定めます。${tex('n')} 組の標本 ${tex('(x_i, y_i)')}（${tex('i = 1, \\ldots, n')}）が、モデル ${tex(String.raw`y_i = \beta_0 + \beta_1 x_i + \varepsilon_i`)} に従うとします。${tex(String.raw`\beta_0`)} は切片、${tex(String.raw`\beta_1`)} は傾き、${tex(String.raw`\varepsilon_i`)} は平均 0、分散 ${tex(String.raw`\sigma^2`)} の誤差です。${tex(String.raw`\bar{x}`)}、${tex(String.raw`\bar{y}`)} は標本平均で、偏差の積の和を
      ${eq(String.raw`S_{xx} = \sum_{i=1}^{n}(x_i - \bar{x})^2, \qquad S_{xy} = \sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y}), \qquad S_{yy} = \sum_{i=1}^{n}(y_i - \bar{y})^2`)}
      と書きます。${tex(String.raw`S_{xx} > 0`)}（${tex('x_i')} がすべて等しくはない）とします。`,
    `係数の候補 ${tex(String.raw`(\beta_0, \beta_1)`)} に対する残差平方和は
      ${eq(String.raw`Q(\beta_0, \beta_1) = \sum_{i=1}^{n}(y_i - \beta_0 - \beta_1 x_i)^2`)}
      です。最小点では二つの偏導関数が 0 です。
      ${eq(String.raw`\frac{\partial Q}{\partial \beta_0} = -2\sum_{i=1}^{n}(y_i - \beta_0 - \beta_1 x_i) = 0`)}
      ${eq(String.raw`\frac{\partial Q}{\partial \beta_1} = -2\sum_{i=1}^{n}x_i(y_i - \beta_0 - \beta_1 x_i) = 0`)}`,
    `第1式の和を項ごとに分けると
      ${eq(String.raw`\sum_{i=1}^{n} y_i - n\beta_0 - \beta_1\sum_{i=1}^{n} x_i = 0`)}
      で、${tex('n')} で割ると ${tex(String.raw`\bar{y} - \beta_0 - \beta_1\bar{x} = 0`)}、すなわち
      ${eq(String.raw`\beta_0 = \bar{y} - \beta_1\bar{x}`)}
      で、直線は点 ${tex(String.raw`(\bar{x}, \bar{y})`)} を通ります。これを第2式に代入すると、${tex(String.raw`y_i - \beta_0 - \beta_1 x_i = (y_i - \bar{y}) - \beta_1(x_i - \bar{x})`)} なので
      ${eq(String.raw`\sum_{i=1}^{n}x_i\left[(y_i - \bar{y}) - \beta_1(x_i - \bar{x})\right] = 0`)}
      です。偏差の和は 0 なので ${tex(String.raw`\sum_i \bar{x}(y_i - \bar{y}) = 0`)}、${tex(String.raw`\sum_i \bar{x}(x_i - \bar{x}) = 0`)} で、これらを左辺から引くと ${tex('x_i')} が ${tex(String.raw`x_i - \bar{x}`)} に置きかわります。
      ${eq(String.raw`\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y}) - \beta_1\sum_{i=1}^{n}(x_i - \bar{x})^2 = 0`)}
      ${eq(String.raw`S_{xy} - \beta_1 S_{xx} = 0, \qquad \hat{\beta}_1 = \frac{S_{xy}}{S_{xx}}, \qquad \hat{\beta}_0 = \bar{y} - \hat{\beta}_1\bar{x}`)}
      です（${coreDoc('statistics', 'linear_regression', '回帰係数の説明')}）。${tex('Q')} は係数の2次式で、2階の偏導関数を並べた行列とその行列式は
      ${eq(String.raw`\begin{pmatrix} Q_{\beta_0\beta_0} & Q_{\beta_0\beta_1} \\ Q_{\beta_1\beta_0} & Q_{\beta_1\beta_1} \end{pmatrix} = 2\begin{pmatrix} n & \sum_i x_i \\ \sum_i x_i & \sum_i x_i^2 \end{pmatrix}`)}
      ${eq(String.raw`\det = 4\left(n\sum_i x_i^2 - \Bigl(\sum_i x_i\Bigr)^2\right) = 4n\left(\sum_i x_i^2 - n\bar{x}^2\right) = 4nS_{xx} > 0`)}
      です（${tex(String.raw`S_{xx} = \sum_i x_i^2 - n\bar{x}^2`)}）。左上の成分 ${tex('2n')} も正なので、この点が最小点です。`,
    `予測値を ${tex(String.raw`\hat{y}_i = \hat{\beta}_0 + \hat{\beta}_1 x_i`)}、残差を ${tex(String.raw`e_i = y_i - \hat{y}_i`)} とします。図の煉瓦色の縦の線分は ${tex('e_i')} です。${tex('y')} の全変動 ${tex(String.raw`S_{yy}`)} は、直線で説明できる回帰平方和と、残りの残差平方和に分かれます（ページの最後の証明）。
      ${eq(String.raw`\sum_{i}(y_i - \bar{y})^2 = \sum_{i}(\hat{y}_i - \bar{y})^2 + \sum_{i} e_i^2`)}
      決定係数 ${tex(String.raw`R^2 = 1 - \sum_i e_i^2 / S_{yy}`)} は、全変動のうち直線が説明する割合で、${tex(String.raw`0 \le R^2 \le 1`)} です。`,
  ],
  figureAlt: '5個の標本点の散布図と、残差の2乗和を最小にする回帰直線、各点から直線へ下ろした縦の残差の線分。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">標本点と回帰直線、残差</h2><div class="legend"><span><i class="numerical"></i>回帰直線</span><span><i class="difference"></i>残差 eᵢ</span></div></div>
      <canvas id="fit-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。黒い点は標本、灰色の点は ${tex(String.raw`(\bar{x}, \bar{y}) = (3, 4)`)}</p>
      <div class="readouts">
        <div><span>切片 β̂₀（近似）</span><output id="intercept">—</output></div>
        <div><span>傾き β̂₁（近似）</span><output id="slope">—</output></div>
        <div><span>決定係数 R²（近似）</span><output id="r2">—</output></div>
        <div><span>残差平方和 Σeᵢ²（近似）</span><output id="rss">—</output></div>
      </div>
      <h3>各標本の予測値と残差（小数6桁の近似）</h3>
      <div class="table-scroll"><table class="value-table" id="residual-table"></table></div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `5組の標本を ${tex('(1, 2), (2, 4), (3, 5), (4, 4), (5, 5)')} とします。平均は
      ${eq(String.raw`\bar{x} = \frac{1 + 2 + 3 + 4 + 5}{5} = \frac{15}{5} = 3, \qquad \bar{y} = \frac{2 + 4 + 5 + 4 + 5}{5} = \frac{20}{5} = 4`)}
      です。偏差は ${tex(String.raw`x_i - \bar{x} = -2, -1, 0, 1, 2`)}、${tex(String.raw`y_i - \bar{y} = -2, 0, 1, 0, 1`)} です。`,
    `偏差の積の和は
      ${eq(String.raw`S_{xx} = (-2)^2 + (-1)^2 + 0^2 + 1^2 + 2^2 = 4 + 1 + 0 + 1 + 4 = 10`)}
      ${eq(String.raw`S_{xy} = (-2)(-2) + (-1)(0) + (0)(1) + (1)(0) + (2)(1) = 4 + 0 + 0 + 0 + 2 = 6`)}
      ${eq(String.raw`S_{yy} = (-2)^2 + 0^2 + 1^2 + 0^2 + 1^2 = 4 + 0 + 1 + 0 + 1 = 6`)}
      で、係数は
      ${eq(String.raw`\hat{\beta}_1 = \frac{6}{10} = 0.6, \qquad \hat{\beta}_0 = 4 - 0.6 \cdot 3 = 2.2`)}
      です。回帰直線は ${tex('y = 2.2 + 0.6x')} で、これらは厳密な値です。`,
    `予測値は ${tex(String.raw`\hat{y}_i = 2.8, 3.4, 4.0, 4.6, 5.2`)}、残差は ${tex('e_i = -0.8, 0.6, 1.0, -0.6, -0.2')} です。残差の和は ${tex('0')} で、
      ${eq(String.raw`\sum_i e_i^2 = 0.64 + 0.36 + 1.00 + 0.36 + 0.04 = 2.4`)}
      ${eq(String.raw`\sum_i (\hat{y}_i - \bar{y})^2 = 1.44 + 0.36 + 0 + 0.36 + 1.44 = 3.6 = 6 - 2.4`)}
      ${eq(String.raw`R^2 = 1 - \frac{2.4}{6} = 0.6`)}
      です。直線は ${tex('y')} の全変動 6 のうち 3.6、つまり 60% を説明します。画面の計器の値は、ライブラリが計算した近似です。`,
  ],
  related: [
    { href: './least-squares.html', title: '最小二乗法' },
    { href: './sample-stats.html', title: '標本・平均・分散' },
  ],
  footer: 'この画面の計算は、5組の2変量標本への回帰直線の当てはめです。',
  proof: writtenProof([{
    statement: `${tex(String.raw`S_{xx} > 0`)} のとき、最小二乗の係数 ${tex(String.raw`\hat{\beta}_0, \hat{\beta}_1`)} による予測値 ${tex(String.raw`\hat{y}_i`)} と残差 ${tex(String.raw`e_i = y_i - \hat{y}_i`)} について ${tex(String.raw`\sum_i (y_i - \bar{y})^2 = \sum_i (\hat{y}_i - \bar{y})^2 + \sum_i e_i^2`)} が成り立ちます。したがって ${tex(String.raw`S_{yy} > 0`)} なら ${tex(String.raw`0 \le R^2 \le 1`)} です。`,
    proof: [
      `${tex(String.raw`\hat{\beta}_0, \hat{\beta}_1`)} は手順2の二つの式を満たすので、${tex('-2')} で割って
        ${eq(String.raw`\sum_{i=1}^{n} e_i = 0, \qquad \sum_{i=1}^{n} x_i e_i = 0`)}
        です。`,
      `${tex(String.raw`\hat{y}_i - \bar{y} = \hat{\beta}_0 + \hat{\beta}_1 x_i - \bar{y}`)} に ${tex(String.raw`\hat{\beta}_0 = \bar{y} - \hat{\beta}_1\bar{x}`)} を代入すると ${tex(String.raw`\hat{y}_i - \bar{y} = \hat{\beta}_1(x_i - \bar{x})`)} です。よって交差項は
        ${eq(String.raw`\sum_{i}(\hat{y}_i - \bar{y})\,e_i = \hat{\beta}_1\left(\sum_i x_i e_i - \bar{x}\sum_i e_i\right) = \hat{\beta}_1(0 - 0) = 0`)}
        です。`,
      `${tex(String.raw`y_i - \bar{y} = (\hat{y}_i - \bar{y}) + e_i`)} を2乗して足すと
        ${eq(String.raw`\sum_i (y_i - \bar{y})^2 = \sum_i (\hat{y}_i - \bar{y})^2 + 2\sum_i (\hat{y}_i - \bar{y})e_i + \sum_i e_i^2 = \sum_i (\hat{y}_i - \bar{y})^2 + \sum_i e_i^2`)}
        です。`,
      `右辺の二つの和はどちらも 0 以上なので ${tex(String.raw`0 \le \sum_i e_i^2 \le S_{yy}`)} です。${tex(String.raw`S_{yy}`)} で割って ${tex(String.raw`0 \le \sum_i e_i^2/S_{yy} \le 1`)}、すなわち ${tex(String.raw`0 \le R^2 \le 1`)} です。`,
    ],
  }]),
});

let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const canvas = document.getElementById('fit-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(canvas);
    return;
  }
  drawPlot(canvas, {
    label: '5個の標本点と回帰直線 y = 2.2 + 0.6x。縦の線分は残差。',
    lines: [...linesWith(current, 'residual-', 2.5), line(current, 'fit')],
    dots: [...pointsWith(current, 'data-', 5), ...pointsWith(current, 'mean', 4)],
    xMin: 0,
    xMax: 6,
    yMin: 1,
    yMax: 6,
  });
}

function fill() {
  if (!current) return;
  const { values: v, arrays: a } = current;
  show('intercept', fixed(v.intercept));
  show('slope', fixed(v.slope));
  show('rss', fixed(v.rss));
  show('r2', fixed(v.r2));
  const row = (cells: (string | number)[], tag = 'td') => `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
  document.getElementById('residual-table')!.innerHTML = row(['i', 'xᵢ', 'yᵢ', 'ŷᵢ', 'eᵢ = yᵢ − ŷᵢ'], 'th')
    + a.x.map((x, i) => row([i + 1, fixed(x, 0), fixed(a.y[i], 0), fixed(a.fitted[i]), fixed(a.residuals[i])])).join('');
}

async function load() {
  try {
    current = await lessonFigure('statistics/regression');
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
