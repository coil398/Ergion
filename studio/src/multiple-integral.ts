import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

const divisions = [2, 4, 8, 16];

renderLesson({
  id: 'multiple-integral',
  section: { label: '微分積分' },
  title: '重積分',
  description: `平面の有界な領域 ${tex('D')} の上で、2変数関数 ${tex('f(x, y)')} を積分します。正方形の上の ${tex('xy')} の積分を累次積分と中点の格子和で求め、単位円板の面積を直交座標の格子と極座標の二通りで計算します。`,
  equation: [
    String.raw`\iint_{[0,1]^2} xy\,dA = \int_0^1\!\left(\int_0^1 xy\,dy\right) dx = \frac{1}{4}`,
    String.raw`\int_0^{2\pi}\!\!\int_0^1 r\,dr\,d\theta = \pi`,
  ],
  equationLabel: '正方形の上の xy の二重積分は 4 分の 1。極座標による単位円板の面積は π。',
  studyHeading: '累次積分と格子和の手順',
  steps: [
    `記号を定めます。${tex('D')} は平面の有界な領域、${tex('f(x, y)')} は ${tex('D')} で連続な関数、${tex('dA')} は面積要素です。長方形 ${tex('[x_0, x_1] \\times [y_0, y_1]')} を横に ${tex('n_x')} 個、縦に ${tex('n_y')} 個の小さな長方形に分け、幅を ${tex(String.raw`\Delta x = (x_1 - x_0)/n_x`)}、高さを ${tex(String.raw`\Delta y = (y_1 - y_0)/n_y`)}、中点を ${tex('(x_i^*, y_j^*)')} とします。`,
    `中点の格子和は、小さな長方形ごとに中点の値と面積の積を足したものです。
      ${eq(String.raw`M = \sum_{i=1}^{n_x}\sum_{j=1}^{n_y} f(x_i^*, y_j^*)\,\Delta x\,\Delta y`)}
      ${tex('f')} が連続ならば、格子を細かくすると ${tex('M')} は二重積分 ${tex(String.raw`\iint_D f\,dA`)} に近づきます（${coreDoc('calculus', 'midpoint_double_sum', '中点の格子和の説明')}）。`,
    `長方形の領域では、Fubini の定理により二重積分は累次積分に等しく、内側から順に1変数の積分を計算できます。${tex('f(x, y) = xy')}、${tex('D = [0, 1]^2')} では、内側の積分は ${tex('x')} を定数とみなして
      ${eq(String.raw`\int_0^1 xy\,dy = x \left[\frac{y^2}{2}\right]_0^1 = \frac{x}{2}`)}
      外側の積分は
      ${eq(String.raw`\int_0^1 \frac{x}{2}\,dx = \left[\frac{x^2}{4}\right]_0^1 = \frac{1}{4}`)}
      です。`,
    `${tex('xy')} の中点和は、${tex('x')} の和と ${tex('y')} の和の積に分かれます。${tex('n_x = n_y = n')}、${tex(String.raw`\Delta x = \Delta y = 1/n`)}、${tex(String.raw`x_i^* = (i - \tfrac{1}{2})/n`)} として
      ${eq(String.raw`M_n = \left(\sum_{i=1}^{n} x_i^*\,\Delta x\right)\left(\sum_{j=1}^{n} y_j^*\,\Delta y\right)`)}
      ${eq(String.raw`\sum_{i=1}^{n} \frac{i - \frac{1}{2}}{n}\cdot\frac{1}{n} = \frac{1}{n^2}\left(\frac{n(n+1)}{2} - \frac{n}{2}\right) = \frac{1}{n^2}\cdot\frac{n^2}{2} = \frac{1}{2}`)}
      ${eq(String.raw`M_n = \frac{1}{2}\cdot\frac{1}{2} = \frac{1}{4}`)}
      です。中点の値は1次式の積分を厳密に与えるので、どの ${tex('n')} でも中点和は厳密値 ${tex('1/4')} に等しくなります。`,
    `極座標 ${tex(String.raw`x = r\cos\theta`)}、${tex(String.raw`y = r\sin\theta`)} では、Jacobi 行列式は
      ${eq(String.raw`\frac{\partial(x, y)}{\partial(r, \theta)} = \begin{vmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{vmatrix} = r\cos^2\theta + r\sin^2\theta = r`)}
      で、面積要素は ${tex(String.raw`dA = r\,dr\,d\theta`)} です。単位円板の面積は
      ${eq(String.raw`\int_0^{2\pi}\!\!\int_0^1 r\,dr\,d\theta = \int_0^{2\pi} \left[\frac{r^2}{2}\right]_0^1 d\theta = \int_0^{2\pi} \frac{1}{2}\,d\theta = \pi`)}
      です。被積分関数 ${tex('r')} は1次式なので、動径 ${tex('n_r')} 等分、角 ${tex(String.raw`n_\theta`)} 等分の中点和も、上と同じ計算で厳密に ${tex(String.raw`\pi`)} です（${coreDoc('calculus', 'polar_disk_area_sum', '極座標の中点和の説明')}）。`,
    `同じ面積を直交座標で求めるには、正方形 ${tex('[-1, 1]^2')} を ${tex('n \\times n')} に分け、中点が円板に入る小さな正方形の面積を足します（${coreDoc('calculus', 'disk_area_grid_sum', '直交格子の和の説明')}）。被積分関数は円の上で 1 から 0 へ跳ぶので、境界をまたぐ正方形の数え方の差が残ります。差は格子を細かくすると小さくなりますが、減り方は一様ではありません。`,
  ],
  figureAlt: '正方形を覆う中点の格子と、単位円板を覆う格子。格子を細かくすると、円板の格子和と π の差が小さくなる。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">中点の格子と格子和</h2><div class="legend"><span><i class="numerical"></i>中点（格子和に使う点）</span><span><i class="analytical"></i>厳密な境界（単位円）</span></div></div>
        ${methodTabs('格子の分割数', divisions.map(n => ({ id: String(n), label: `n = ${n}` })))}
        <div class="plot-pair">
          <div><h3>正方形 ${tex('[0, 1]^2')} の中点 ${tex('(x_i^*, y_j^*)')}</h3><canvas id="square-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。和は中点の値 ${tex('x_i^* y_j^*')} に面積 ${tex('1/n^2')} を掛けて足したものです。</p></div>
          <div><h3>単位円板を覆う ${tex('n \\times n')} の格子</h3><canvas id="disk-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。塗った正方形は中点が円板に入るもので、その面積の和が格子和です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex('xy')} の中点和（厳密値 ${tex('1/4')}）</span><output id="square-sum">—</output></div>
          <div><span>極座標の中点和（厳密値 ${tex(String.raw`\pi`)}）</span><output id="polar-sum">—</output></div>
          <div><span>円板の直交格子和（近似値）</span><output id="disk-grid">—</output></div>
          <div><span>差 直交格子和 ${tex(String.raw`- \pi`)}</span><output id="disk-difference">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="分割数ごとの格子和と厳密値の差">
          <thead><tr><th>分割数 ${tex('n')}</th><th>${tex('xy')} の中点和 ${tex('- 1/4')}</th><th>直交格子和</th><th>直交格子和 ${tex(String.raw`- \pi`)}</th><th>極座標の和 ${tex(String.raw`- \pi`)}</th></tr></thead>
          <tbody id="integral-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('n = 4')} とします。正方形 ${tex('[0, 1]^2')} の中点の座標は ${tex(String.raw`\tfrac{1}{8}, \tfrac{3}{8}, \tfrac{5}{8}, \tfrac{7}{8}`)} で、
      ${eq(String.raw`\sum_{i=1}^{4} x_i^*\,\Delta x = \left(\frac{1}{8} + \frac{3}{8} + \frac{5}{8} + \frac{7}{8}\right)\cdot\frac{1}{4} = \frac{16}{8}\cdot\frac{1}{4} = \frac{1}{2}`)}
      ${eq(String.raw`M_4 = \frac{1}{2}\cdot\frac{1}{2} = \frac{1}{4}`)}
      です。厳密値 ${tex('1/4')} に等しく、差は 0 です。`,
    `正方形 ${tex('[-1, 1]^2')} を ${tex('4 \\times 4')} に分けると、小さな正方形の一辺は ${tex(String.raw`\tfrac{1}{2}`)}、面積は ${tex(String.raw`\tfrac{1}{4}`)}、中点の座標は ${tex(String.raw`\pm\tfrac{1}{4}, \pm\tfrac{3}{4}`)} です。四隅の中点は
      ${eq(String.raw`\left(\tfrac{3}{4}\right)^2 + \left(\tfrac{3}{4}\right)^2 = \frac{18}{16} > 1`)}
      で円板の外、ほかの 12 個は内側です（たとえば ${tex(String.raw`\left(\tfrac{3}{4}\right)^2 + \left(\tfrac{1}{4}\right)^2 = \tfrac{10}{16} \le 1`)}）。格子和は
      ${eq(String.raw`12 \cdot \frac{1}{4} = 3`)}
      で、${tex(String.raw`\pi \approx 3.141593`)} との差は ${tex('-0.141593')}（近似値）です。`,
    `極座標で ${tex('n_r = 4')}、${tex(String.raw`n_\theta = 16`)} とすると、動径の中点は ${tex(String.raw`\tfrac{1}{8}, \tfrac{3}{8}, \tfrac{5}{8}, \tfrac{7}{8}`)}、${tex(String.raw`\Delta r = \tfrac{1}{4}`)} で
      ${eq(String.raw`\sum_{i=1}^{4} r_i^*\,\Delta r = \frac{1}{2},\qquad \frac{1}{2}\cdot 16 \cdot \frac{2\pi}{16} = \pi`)}
      です。画面の ${tex('n = 4')} のタブの計器は、この三つの値をライブラリから示します。`,
  ],
  related: [
    { href: './partial.html', title: '偏微分', description: '2変数関数の一つの変数についての変化率です。' },
    { href: './fundamental-theorem.html', title: '定積分と微分積分学の基本定理', description: '累次積分の内側と外側は、それぞれ1変数の定積分です。' },
    { href: './gauss.html', title: 'Gauss の法則', description: '電荷密度の体積積分と、電場の面積分を結びます。' },
    { href: './monte-carlo.html', title: 'Monte Carlo 法', description: '乱数の点で円板の面積を見積もる、格子とは別の方法です。' },
  ],
  footer: 'この画面の計算は、正方形の上の xy の二重積分と、単位円板の面積の格子和です。',
});

let n = 4;
let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  const named = (prefix: string) => figure.series.filter(item => item.name.startsWith(prefix)).map(item => line(figure, item.name));
  const points = (prefix: string) => figure.points.filter(item => item.name.startsWith(prefix))
    .map(item => ({ x: item.x, y: item.y, role: item.role, radius: n > 8 ? 2 : 3.5 }));
  drawPlot(document.querySelector<HTMLCanvasElement>('#square-chart')!, {
    label: `正方形を ${n} 行 ${n} 列に分けた格子と、その中点。`,
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
    equalAspect: true,
    lines: named('square'),
    dots: points('square mid'),
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#disk-chart')!, {
    label: `単位円板を覆う ${n} 行 ${n} 列の格子。塗った正方形は中点が円板に入るもの。`,
    xMin: -1.2,
    xMax: 1.2,
    yMin: -1.2,
    yMax: 1.2,
    equalAspect: true,
    polygons: figure.polygons.map(item => ({ x: item.x, y: item.y })),
    lines: [...named('disk'), line(figure, 'circle')],
    dots: points('disk mid'),
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('square-sum', figure.values.square_sum.toFixed(6));
  value('polar-sum', figure.values.disk_polar.toFixed(6));
  value('disk-grid', figure.values.disk_grid.toFixed(6));
  value('disk-difference', figure.values.disk_grid_difference.toFixed(6));
  const a = figure.arrays;
  const small = (v: number) => (v === 0 ? '0' : v.toExponential(2));
  document.querySelector('#integral-table')!.innerHTML = a.table_n.map((m, i) =>
    `<tr><td>${m}</td><td>${small(a.table_square_difference[i])}</td><td>${a.table_grid[i].toFixed(6)}</td><td>${a.table_grid_difference[i].toFixed(6)}</td><td>${small(a.table_polar_difference[i])}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('calculus/multiple-integral', { n }));
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
  button.setAttribute('aria-selected', button.dataset.method === String(n) ? 'true' : 'false');
}
bindMethodTabs<string>(next => {
  n = Number(next);
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
