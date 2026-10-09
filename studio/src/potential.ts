import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, vectors, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'potential',
  section: { label: '電磁気学' },
  title: '静電ポテンシャルと電位',
  description: `静電場は、スカラーの静電ポテンシャル ${tex(String.raw`\phi`)} の勾配に負号を付けたものとして表せます。電荷 ${tex('+1')} と ${tex('-1')} の組の電位を求め、中心差分で求めた ${tex(String.raw`-\nabla\phi`)} を厳密な電場と比べ、2点間の電場の線積分が経路によらず電位差に等しいことを確かめます。`,
  equation: [
    String.raw`\mathbf{E} = -\nabla \phi,\qquad \phi(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|}`,
    String.raw`\phi(A) - \phi(B) = \int_A^B \mathbf{E} \cdot d\mathbf{r}`,
  ],
  equationNote: 'このページの単位 1/(4πε₀) = 1',
  studyHeading: '電位から電場と電位差を求める手順',
  steps: [
    `記号を定めます。${tex(String.raw`\phi(\mathbf{r})`)} は位置 ${tex(String.raw`\mathbf{r}`)} の静電ポテンシャル（電位）、${tex(String.raw`\nabla\phi = (\partial\phi/\partial x,\ \partial\phi/\partial y)`)} はその勾配、${tex('q_i')} と ${tex(String.raw`\mathbf{r}_i`)} は点電荷の電気量と位置です。無限遠で ${tex(String.raw`\phi = 0`)} となるように基準をとります。${tex('A')} から ${tex('B')} への曲線に沿った ${tex(String.raw`\int_A^B \mathbf{E}\cdot d\mathbf{r}`)} を電場の線積分と呼び、${tex(String.raw`V = \phi(A) - \phi(B)`)} を ${tex('A')} と ${tex('B')} の電位差と呼びます。このページでは ${tex(String.raw`\frac{1}{4\pi\varepsilon_0} = 1`)} の単位を使います。`,
    `点電荷1個の電位 ${tex(String.raw`\phi = \frac{q}{\rho}`)}（${tex(String.raw`\rho = \sqrt{(x - x_i)^2 + (y - y_i)^2}`)}）を偏微分します。${tex(String.raw`\frac{\partial\rho}{\partial x} = \frac{x - x_i}{\rho}`)} なので
      ${eq(String.raw`\frac{\partial\phi}{\partial x} = -\frac{q}{\rho^2}\cdot\frac{x - x_i}{\rho} = -\frac{q\,(x - x_i)}{\rho^3}`)}
      ${eq(String.raw`-\frac{\partial\phi}{\partial x} = \frac{q\,(x - x_i)}{\rho^3} = E_x`)}
      です。${tex('y')} も同じで、電荷ごとに足せば ${tex(String.raw`\mathbf{E} = -\nabla\phi`)} が Coulomb の電場に一致します（${coreDoc('electromagnetism', 'coulomb_potential', '電位の説明')}）。`,
    `電荷 ${tex('+1')} を ${tex('(-1, 0)')}、${tex('-1')} を ${tex('(1, 0)')} に置くと
      ${eq(String.raw`\phi(x, y) = \frac{1}{\sqrt{(x + 1)^2 + y^2}} - \frac{1}{\sqrt{(x - 1)^2 + y^2}}`)}
      です。二つの電荷のあいだの ${tex('x')} 軸上（${tex('-1 < x < 1')}、${tex('y = 0')}）では、
      ${eq(String.raw`\phi(x, 0) = \frac{1}{1 + x} - \frac{1}{1 - x} = \frac{(1 - x) - (1 + x)}{1 - x^2} = -\frac{2x}{1 - x^2}`)}
      です。`,
    `中心差分で電場を近似します。刻みを ${tex('h')} として
      ${eq(String.raw`E_x \approx -D_x\phi = -\frac{\phi(x + h, y) - \phi(x - h, y)}{2h}`)}
      です（${coreDoc('electromagnetism', 'potential_gradient_field', '中心差分による電場の説明')}）。原点では ${tex(String.raw`\phi(\pm h, 0) = \mp\frac{2h}{1 - h^2}`)} なので
      ${eq(String.raw`-D_x\phi(0, 0) = -\frac{1}{2h}\left(-\frac{2h}{1 - h^2} - \frac{2h}{1 - h^2}\right) = \frac{2}{1 - h^2}`)}
      です。厳密な電場は ${tex(String.raw`E_x(0, 0) = \frac{1}{1^2} + \frac{1}{1^2} = 2`)} なので、差は
      ${eq(String.raw`\frac{2}{1 - h^2} - 2 = \frac{2h^2}{1 - h^2}`)}
      で、${tex('h')} の2次で小さくなります。${tex('y')} 方向は ${tex(String.raw`\phi(0, \pm h) = 0`)} なので ${tex(String.raw`-D_y\phi(0, 0) = 0`)} で、厳密な ${tex('E_y = 0')} に一致します。`,
    `点 ${tex('A = (-0.5, 0)')} と ${tex('B = (0.5, 0)')} の電位は
      ${eq(String.raw`\phi(A) = \frac{1}{0.5} - \frac{1}{1.5} = 2 - \frac{2}{3} = \frac{4}{3},\qquad \phi(B) = \frac{1}{1.5} - \frac{1}{0.5} = -\frac{4}{3}`)}
      なので、電位差は ${tex(String.raw`\phi(A) - \phi(B) = \frac{8}{3}`)} です。`,
    `${tex('A')} から ${tex('B')} への2本の経路で線積分を求めます。直線は ${tex(String.raw`\mathbf{r}(t) = (-0.5 + t,\ 0)`)}、上半分の半円は ${tex(String.raw`\mathbf{r}(t) = (-0.5\cos\pi t,\ 0.5\sin\pi t)`)}（${tex(String.raw`0 \le t \le 1`)}）です。どちらも
      ${eq(String.raw`\int_A^B \mathbf{E}\cdot d\mathbf{r} = \int_0^1 \mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t)\,dt`)}
      と書き直し、右辺を ${tex('n')} 等分の Simpson 則で近似します（${coreDoc('electromagnetism', 'field_line_integral', '線積分の説明')}）。直線の経路では ${tex(String.raw`\mathbf{r}'(t) = (1, 0)`)} で、被積分関数は
      ${eq(String.raw`E_x(-0.5 + t,\ 0) = \frac{1}{(0.5 + t)^2} + \frac{1}{(1.5 - t)^2}`)}
      です。`,
    `等電位線 ${tex(String.raw`\phi = \text{一定}`)} の接線は ${tex(String.raw`\nabla\phi`)} に垂直なので、${tex(String.raw`\frac{d\mathbf{r}}{ds} = \frac{(-E_y,\ E_x)}{|\mathbf{E}|}`)} を刻み ${tex(String.raw`\Delta s = 0.01`)} の古典的 RK4 でたどって描きます（${coreDoc('electromagnetism', 'equipotential_line', '等電位線をたどる計算の説明')}）。電場の矢印は等電位線に垂直で、電位の高い側から低い側へ向きます。`,
  ],
  figureAlt: '正電荷と負電荷のまわりの等電位線と、等電位線に垂直な電場の矢印、および点 A から B への直線と半円の経路。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">等電位線と電場 ${tex(String.raw`\mathbf{E} = -\nabla\phi`)}</h2><div class="legend"><span><i class="numerical"></i>直線の経路</span></div></div>
        <div class="plot-pair">
          <div><h3>等電位線と電場の向き</h3><canvas id="level-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。灰色の線は等電位線、橙の矢印は厳密な電場の向き（長さはそろえた）、青の線分と黒の半円は ${tex('A')} から ${tex('B')} への2本の経路です。</p></div>
          <div><h3>線積分の被積分関数 ${tex(String.raw`\mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t)`)}</h3><canvas id="integrand-chart" role="img"></canvas><p>横軸 ${tex('t')}。青は直線、黒は半円の経路です。どちらの曲線の下の面積も ${tex(String.raw`\frac{8}{3}`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>電位差 ${tex(String.raw`\phi(A) - \phi(B)`)}（厳密な値）</span><output id="difference">—</output></div>
          <div><span>直線の経路の Simpson 則 ${tex('S_8')}（近似値）</span><output id="straight">—</output></div>
          <div><span>半円の経路の Simpson 則 ${tex('S_8')}（近似値）</span><output id="arc">—</output></div>
          <div><span>中心差分 ${tex(String.raw`-D_x\phi(0, 0)`)}、${tex('h = 0.1')}（近似値）</span><output id="central">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="分割数ごとの線積分">
          <thead><tr><th>分割数 ${tex('n')}</th><th>直線の経路 ${tex('S_n')}</th><th>直線の差</th><th>半円の経路 ${tex('S_n')}</th><th>半円の差</th></tr></thead>
          <tbody id="integral-table"></tbody>
        </table></div>
        <div class="table-scroll"><table class="value-table" aria-label="刻みごとの中心差分の電場">
          <thead><tr><th>刻み ${tex('h')}</th><th>${tex(String.raw`-D_x\phi(0, 0)`)}</th><th>厳密な ${tex('E_x = 2')} との差</th></tr></thead>
          <tbody id="central-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `原点で刻み ${tex('h = 0.1')} の中心差分を手で計算します。${tex(String.raw`\phi(0.1, 0) = \frac{1}{1.1} - \frac{1}{0.9} = -\frac{0.2}{0.99}`)}、${tex(String.raw`\phi(-0.1, 0) = \frac{0.2}{0.99}`)} なので
      ${eq(String.raw`-D_x\phi(0, 0) = -\frac{1}{0.2}\left(-\frac{0.2}{0.99} - \frac{0.2}{0.99}\right) = \frac{2}{0.99} = \frac{200}{99} \approx 2.020202`)}
      です。厳密な ${tex('E_x(0, 0) = 2')} との差は ${tex(String.raw`\frac{2}{99} \approx 0.020202`)} です。`,
    `直線の経路を2等分の Simpson 則で計算します。被積分関数の値は
      ${eq(String.raw`f(0) = \frac{1}{0.25} + \frac{1}{2.25} = \frac{40}{9},\qquad f(0.5) = 1 + 1 = 2,\qquad f(1) = \frac{40}{9}`)}
      で、刻みは ${tex('0.5')} なので
      ${eq(String.raw`S_2 = \frac{0.5}{3}\left(\frac{40}{9} + 4 \cdot 2 + \frac{40}{9}\right) = \frac{1}{6}\cdot\frac{152}{9} = \frac{76}{27} \approx 2.814815`)}
      です。厳密な電位差 ${tex(String.raw`\frac{8}{3} = \frac{72}{27}`)} との差は ${tex(String.raw`\frac{4}{27} \approx 0.148148`)} で、分割を増やすと表のように小さくなります。半円の経路の値も ${tex(String.raw`\frac{8}{3}`)} に近づきます。表の値はライブラリが返した値です。`,
  ],
  related: [
    { href: './coulomb.html', title: 'Coulomb の法則と静電場' },
    { href: './partial.html', title: '偏微分' },
    { href: './exact.html', title: '完全微分' },
    { href: './hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式' },
  ],
  footer: 'この画面の計算は、点電荷の組の電位、中心差分による電場、Simpson 則による電場の線積分です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`\phi`)} の偏導関数が連続な領域の中で、${tex('A')} から ${tex('B')} への微分できる曲線 ${tex(String.raw`\mathbf{r}(t)`)}（${tex(String.raw`0 \le t \le 1`)}、${tex(String.raw`\mathbf{r}(0) = A`)}、${tex(String.raw`\mathbf{r}(1) = B`)}）のどれについても、${tex(String.raw`\mathbf{E} = -\nabla\phi`)} ならば
      ${eq(String.raw`\int_0^1 \mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t)\,dt = \phi(A) - \phi(B)`)}
      です。電場の線積分は経路によりません。`,
    proof: [
      `${tex(String.raw`g(t) = \phi(\mathbf{r}(t))`)} と置きます。${tex(String.raw`\mathbf{r}(t) = (x(t), y(t))`)} とすると、連鎖律（偏微分のページの証明）により
        ${eq(String.raw`g'(t) = \frac{\partial\phi}{\partial x}\,x'(t) + \frac{\partial\phi}{\partial y}\,y'(t) = \nabla\phi(\mathbf{r}(t))\cdot\mathbf{r}'(t)`)}
        です。`,
      `${tex(String.raw`\mathbf{E} = -\nabla\phi`)} を代入すると
        ${eq(String.raw`\mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t) = -g'(t)`)}
        です。`,
      `微分積分学の基本定理により
        ${eq(String.raw`\int_0^1 \mathbf{E}(\mathbf{r}(t))\cdot\mathbf{r}'(t)\,dt = -\int_0^1 g'(t)\,dt = -\bigl(g(1) - g(0)\bigr) = \phi(A) - \phi(B)`)}
        です。右辺は端点 ${tex('A')}、${tex('B')} だけで決まり、曲線の形によりません。`,
    ],
  }]),
});

let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  drawPlot(document.querySelector<HTMLCanvasElement>('#level-chart')!, {
    label: '電荷の組の等電位線と電場の向き、A から B への2本の経路。',
    xMin: -3,
    xMax: 3,
    yMin: -2.2,
    yMax: 2.2,
    equalAspect: true,
    lines: [
      ...figure.series.filter(item => item.name.startsWith('level')).map(item => line(figure, item.name)),
      line(figure, 'straight path'),
      line(figure, 'arc path'),
    ],
    vectors: vectors(figure, 'grid'),
    dots: [dot(figure, 'plus', '+1'), dot(figure, 'minus', '−1'), dot(figure, 'A', 'A'), dot(figure, 'B', 'B')],
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#integrand-chart')!, {
    label: '2本の経路に沿った線積分の被積分関数。',
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 5,
    lines: [line(figure, 'straight integrand', '直線'), line(figure, 'arc integrand', '半円')],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const { values: v, arrays: a } = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('difference', v.exact_difference.toFixed(6));
  value('straight', v.simpson_straight.toFixed(6));
  value('arc', v.simpson_arc.toFixed(6));
  value('central', v.central_x.toFixed(6));
  document.querySelector('#integral-table')!.innerHTML = a.counts.map((n, i) =>
    `<tr><td>${n}</td><td>${a.straight_by_n[i].toFixed(6)}</td><td>${a.straight_error[i].toExponential(2)}</td><td>${a.arc_by_n[i].toFixed(6)}</td><td>${a.arc_error[i].toExponential(2)}</td></tr>`).join('');
  document.querySelector('#central-table')!.innerHTML = a.steps.map((h, i) =>
    `<tr><td>${h}</td><td>${a.central_by_h[i].toFixed(6)}</td><td>${a.central_error_by_h[i].toExponential(2)}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('em/potential', { h: 0.1, n: 8 }));
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
