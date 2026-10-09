import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

const degrees = [1, 2, 3, 4];

renderLesson({
  id: 'taylor',
  section: { label: '微分積分' },
  title: 'Taylor 展開',
  description: `点 ${tex('a')} の近くで何回も微分できる関数 ${tex('f')} を、${tex('n')} 次の多項式と剰余項の和に書きます。指数関数 ${tex('e^x')} を例に、Taylor 多項式の値（近似値）と厳密値の差を、Lagrange 形の剰余項から得られる上界と比べます。`,
  equation: [
    String.raw`f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k + R_{n+1}(x)`,
    String.raw`R_{n+1}(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}(x - a)^{n+1}`,
  ],
  equationNote: 'ξ は a と x のあいだの点',
  studyHeading: '係数の決め方と剰余項の評価',
  steps: [
    `記号を定めます。${tex('f')} は ${tex('a')} と ${tex('x')} を含む開区間で ${tex('n + 1')} 回微分できる実関数、${tex('f^{(k)}')} は ${tex('k')} 階導関数（${tex('f^{(0)} = f')}）、${tex('k! = 1 \\cdot 2 \\cdots k')}（${tex('0! = 1')}）は階乗です。${tex('a')} を展開の中心と呼びます。和の部分を ${tex('n')} 次の Taylor 多項式 ${tex('P_n(x)')}、残り ${tex('R_{n+1}(x) = f(x) - P_n(x)')} を剰余項と呼びます。`,
    `${tex('P_n')} の係数は、点 ${tex('a')} で ${tex('n')} 階までの導関数の値が ${tex('f')} と一致するように決めます。係数を ${tex('c_k')} として
      ${eq(String.raw`P_n(x) = c_0 + c_1 (x - a) + c_2 (x - a)^2 + \cdots + c_n (x - a)^n`)}
      と置きます。${tex('j')} 回微分すると、${tex('k < j')} の項は消え、${tex('k \\ge j')} の項は
      ${eq(String.raw`P_n^{(j)}(x) = \sum_{k=j}^{n} k(k-1)\cdots(k-j+1)\,c_k\,(x - a)^{k-j}`)}
      です。${tex('x = a')} を代入すると ${tex('(x - a)^{k-j}')} は ${tex('k = j')} の項だけが 1 で、ほかは 0 です。
      ${eq(String.raw`P_n^{(j)}(a) = j(j-1)\cdots 1 \cdot c_j = j!\,c_j`)}
      これが ${tex('f^{(j)}(a)')} に等しいので
      ${eq(String.raw`c_j = \frac{f^{(j)}(a)}{j!}`)}
      です。`,
    `剰余項は、${tex('a')} と ${tex('x')} のあいだのある点 ${tex(String.raw`\xi`)} を用いて Lagrange 形
      ${eq(String.raw`R_{n+1}(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}(x - a)^{n+1}`)}
      に書けます。これが Taylor の定理で、証明はページの最後にあります。${tex(String.raw`\xi`)} の位置は分かりませんが、${tex('f^{(n+1)}')} の大きさを抑えれば、差 ${tex('|f(x) - P_n(x)|')} の上界が得られます。`,
    `${tex('f(x) = e^x')}、${tex('a = 0')} とします。${tex('(e^x)\' = e^x')} なので、すべての ${tex('k')} で
      ${eq(String.raw`f^{(k)}(x) = e^x,\qquad f^{(k)}(0) = e^0 = 1`)}
      です。係数は ${tex('1/k!')} で、
      ${eq(String.raw`P_n(x) = \sum_{k=0}^{n} \frac{x^k}{k!} = 1 + x + \frac{x^2}{2} + \cdots + \frac{x^n}{n!}`)}
      です（${coreDoc('calculus', 'exp_taylor_polynomial', 'Taylor 多項式の説明')}）。剰余項は ${tex(String.raw`\xi`)} を ${tex('0')} と ${tex('x')} のあいだの点として
      ${eq(String.raw`R_{n+1}(x) = \frac{e^{\xi}}{(n+1)!}\,x^{n+1}`)}
      です。${tex('e^t')} は増加関数なので ${tex(String.raw`e^{\xi} \le e^{\max(x, 0)}`)} で、絶対値をとると
      ${eq(String.raw`|R_{n+1}(x)| \le \frac{e^{\max(x, 0)}\,|x|^{n+1}}{(n+1)!}`)}
      です（${coreDoc('calculus', 'exp_taylor_remainder_bound', '剰余項の上界の説明')}）。`,
    `次数を一つ上げると、上界は ${tex(String.raw`\frac{|x|}{n+2}`)} 倍になります。
      ${eq(String.raw`\frac{|x|^{n+2}/(n+2)!}{|x|^{n+1}/(n+1)!} = \frac{|x|}{n+2}`)}
      ${tex('n + 2 > 2|x|')} となる次数からは、この比は ${tex(String.raw`\frac{1}{2}`)} より小さいので、上界は 0 に近づきます。したがって、どの ${tex('x')} でも ${tex('P_n(x) \\to e^x')} で、無限級数 ${tex(String.raw`e^x = \sum_{k=0}^{\infty} x^k/k!`)} が成り立ちます。展開の中心 ${tex('x = 0')} から離れるほど ${tex('|x|^{n+1}')} が大きく、同じ次数では差が広がります。`,
  ],
  figureAlt: '指数関数 e^x と、次数 1 から 4 の Taylor 多項式。中心 x = 0 の近くでは曲線が重なり、離れるほど差が広がる。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">指数関数と Taylor 多項式 ${tex('P_n(x)')}</h2><div class="legend"><span><i class="numerical"></i>選んだ次数の多項式</span><span><i class="analytical"></i>厳密な指数関数</span></div></div>
        ${methodTabs('Taylor 多項式の次数', degrees.map(n => ({ id: String(n), label: `n = ${n}` })))}
        <div class="plot-pair">
          <div><h3>曲線 ${tex('y = e^x')} と ${tex('y = P_n(x)')}</h3><canvas id="taylor-chart" role="img"></canvas><p>横軸 ${tex('x')}。灰色の破線はほかの次数の多項式です。</p></div>
          <div><h3>差 ${tex('|e - P_k(1)|')} と剰余項の上界</h3><canvas id="remainder-chart" role="img"></canvas><p>横軸は次数 ${tex('k')}、縦軸は常用対数 ${tex(String.raw`\log_{10}`)}。破線は上界 ${tex(String.raw`e/(k+1)!`)}。</p></div>
        </div>
        <div class="readouts">
          <div><span>Taylor 多項式 ${tex('P_n(1)')}（近似値）</span><output id="polynomial">—</output></div>
          <div><span>厳密値 ${tex('e')} の小数（近似値）</span><output id="exact">—</output></div>
          <div><span>剰余項の上界（近似値）</span><output id="bound">—</output></div>
          <div><span>差 ${tex('e - P_n(1)')}（近似値）</span><output id="difference">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="x = 1 における次数ごとの値">
          <thead><tr><th>次数 ${tex('k')}</th><th>${tex('P_k(1)')}（近似値）</th><th>差 ${tex('e - P_k(1)')}（近似値）</th><th>上界 ${tex(String.raw`e/(k+1)!`)}（近似値）</th></tr></thead>
          <tbody id="taylor-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('x = 1')}、${tex('n = 3')} とします。Taylor 多項式の値は
      ${eq(String.raw`P_3(1) = 1 + 1 + \frac{1}{2} + \frac{1}{6} = \frac{6 + 6 + 3 + 1}{6} = \frac{16}{6} = \frac{8}{3}`)}
      で、厳密に ${tex('8/3')}、小数では ${tex(String.raw`2.666667`)}（近似）です。`,
    `厳密値は ${tex(String.raw`e \approx 2.718282`)} なので、差は
      ${eq(String.raw`e - \frac{8}{3} \approx 2.718282 - 2.666667 = 0.051615`)}
      です（近似値）。`,
    `Lagrange 形では ${tex(String.raw`R_4(1) = \frac{e^{\xi}}{4!} = \frac{e^{\xi}}{24}`)}、${tex(String.raw`0 < \xi < 1`)} です。${tex(String.raw`1 < e^{\xi} < e`)} より
      ${eq(String.raw`\frac{1}{24} < R_4(1) < \frac{e}{24},\qquad 0.041667 < R_4(1) < 0.113262`)}
      で（小数は近似値）、差 ${tex('0.051615')} はこの範囲に入ります。上界の式で ${tex('x = 1')}、${tex('n = 3')} とすると ${tex(String.raw`\frac{e^{1} \cdot 1^4}{4!} = \frac{e}{24} \approx 0.113262`)} です。画面の ${tex('n = 3')} のタブの計器は、ライブラリが返した ${tex('P_3(1)')}、${tex('e')}、上界、差を示します。`,
  ],
  related: [
    { href: './series.html', title: 'べき級数' },
    { href: './mean-value.html', title: '平均値の定理' },
    { href: './numerical-differentiation.html', title: '数値微分' },
  ],
  footer: 'この画面の計算は、指数関数 e^x の Taylor 多項式と剰余項の上界です。',
  proof: writtenProof([{
    statement: `（Taylor の定理）${tex('f')} が ${tex('a')} と ${tex('x')}（${tex('x \\ne a')}）を含む開区間で ${tex('n + 1')} 回微分できるならば、${tex('a')} と ${tex('x')} のあいだに点 ${tex(String.raw`\xi`)} があって
      ${eq(String.raw`f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k + \frac{f^{(n+1)}(\xi)}{(n+1)!}(x - a)^{n+1}`)}
      が成り立ちます。`,
    proof: [
      `${tex('(x - a)^{n+1} \\ne 0')} なので、定数 ${tex('K')} を
        ${eq(String.raw`f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k + \frac{K}{(n+1)!}(x - a)^{n+1}`)}
        が成り立つように一つに決められます。示すことは、ある ${tex(String.raw`\xi`)} で ${tex(String.raw`K = f^{(n+1)}(\xi)`)} となることです。`,
      `${tex('a')} と ${tex('x')} を両端とする閉区間の点 ${tex('t')} について、関数
        ${eq(String.raw`g(t) = f(x) - \sum_{k=0}^{n} \frac{f^{(k)}(t)}{k!}(x - t)^k - \frac{K}{(n+1)!}(x - t)^{n+1}`)}
        を定めます。${tex('k \\le n')} の ${tex('f^{(k)}')} は微分できるので、${tex('g')} はこの閉区間で連続、内部で微分できます。`,
      `${tex('t = x')} では ${tex('(x - x)^k = 0')}（${tex('k \\ge 1')}）なので、和は ${tex('k = 0')} の項 ${tex('f(x)')} だけが残ります。
        ${eq(String.raw`g(x) = f(x) - f(x) - 0 = 0`)}
        ${tex('t = a')} では、${tex('K')} の決め方により
        ${eq(String.raw`g(a) = f(x) - \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k - \frac{K}{(n+1)!}(x - a)^{n+1} = 0`)}
        です。Rolle の定理により、${tex('a')} と ${tex('x')} のあいだの点 ${tex(String.raw`\xi`)} で ${tex(String.raw`g'(\xi) = 0`)} です。`,
      `和の各項を積の微分で微分します。${tex('k = 0')} の項は ${tex(String.raw`\frac{d}{dt} f(t) = f'(t)`)}、${tex('k \\ge 1')} の項は
        ${eq(String.raw`\frac{d}{dt}\left[\frac{f^{(k)}(t)}{k!}(x - t)^k\right] = \frac{f^{(k+1)}(t)}{k!}(x - t)^k - \frac{f^{(k)}(t)}{(k-1)!}(x - t)^{k-1}`)}
        です。足し合わせると
        ${eq(String.raw`\frac{d}{dt}\sum_{k=0}^{n} \frac{f^{(k)}(t)}{k!}(x - t)^k = \sum_{k=0}^{n} \frac{f^{(k+1)}(t)}{k!}(x - t)^k - \sum_{k=1}^{n} \frac{f^{(k)}(t)}{(k-1)!}(x - t)^{k-1}`)}
        です。後の和で ${tex('j = k - 1')} と置くと
        ${eq(String.raw`\sum_{k=1}^{n} \frac{f^{(k)}(t)}{(k-1)!}(x - t)^{k-1} = \sum_{j=0}^{n-1} \frac{f^{(j+1)}(t)}{j!}(x - t)^{j}`)}
        で、前の和の ${tex('k = 0, \\ldots, n - 1')} の項と打ち消し合い、${tex('k = n')} の項だけが残ります。
        ${eq(String.raw`\frac{d}{dt}\sum_{k=0}^{n} \frac{f^{(k)}(t)}{k!}(x - t)^k = \frac{f^{(n+1)}(t)}{n!}(x - t)^n`)}`,
      `最後の項は ${tex(String.raw`\frac{d}{dt}(x - t)^{n+1} = -(n+1)(x - t)^n`)} より
        ${eq(String.raw`\frac{d}{dt}\left[\frac{K}{(n+1)!}(x - t)^{n+1}\right] = -\frac{K (n+1)}{(n+1)!}(x - t)^n = -\frac{K}{n!}(x - t)^n`)}
        です。したがって
        ${eq(String.raw`g'(t) = -\frac{f^{(n+1)}(t)}{n!}(x - t)^n + \frac{K}{n!}(x - t)^n = \frac{(x - t)^n}{n!}\bigl(K - f^{(n+1)}(t)\bigr)`)}
        です。`,
      `${tex(String.raw`\xi \ne x`)} なので ${tex(String.raw`(x - \xi)^n \ne 0`)} です。${tex(String.raw`g'(\xi) = 0`)} から
        ${eq(String.raw`K - f^{(n+1)}(\xi) = 0,\qquad K = f^{(n+1)}(\xi)`)}
        です。これを最初の式に代入すると、示す等式が得られます。`,
    ],
  }]),
});

let degree = 3;
let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  const muted = figure.series.filter(item => /^p\d$/.test(item.name)).map(item => line(figure, item.name));
  drawPlot(document.querySelector<HTMLCanvasElement>('#taylor-chart')!, {
    label: `指数関数と ${degree} 次の Taylor 多項式のグラフ。実線は Taylor 多項式、破線は e の x 乗。`,
    xMin: -3,
    xMax: 3,
    yMin: -2,
    yMax: 10,
    lines: [...muted, line(figure, 'exp', 'eˣ'), line(figure, 'selected', `P${degree}`)],
    dots: [dot(figure, 'exact', undefined, true), dot(figure, 'approx')],
    zeroLabel: 'y = 0',
  });
  const k = figure.values.degree;
  const differences = figure.series.find(item => item.name === 'log_difference')!;
  const at = differences.x.indexOf(k);
  drawPlot(document.querySelector<HTMLCanvasElement>('#remainder-chart')!, {
    label: '次数 k に対する差の大きさと剰余項の上界の常用対数。実線は差、破線は上界。',
    xMin: 0,
    xMax: 10,
    yMin: -10,
    yMax: 2,
    lines: [line(figure, 'log_bound'), line(figure, 'log_difference')],
    dots: at >= 0 ? [{ x: k, y: differences.y[at], role: 'numerical', label: `k = ${k}` }] : [],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('polynomial', figure.values.polynomial.toFixed(6));
  value('exact', figure.values.exact.toFixed(6));
  value('bound', figure.values.bound.toFixed(6));
  value('difference', figure.values.difference.toFixed(6));
  const rows = figure.arrays.degrees.map((k, i) =>
    `<tr><td>${k}</td><td>${figure.arrays.table_polynomial[i].toFixed(9)}</td><td>${figure.arrays.table_difference[i].toExponential(3)}</td><td>${figure.arrays.table_bound[i].toExponential(3)}</td></tr>`);
  document.querySelector('#taylor-table')!.innerHTML = rows.join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('calculus/taylor', { degree, x: 1 }));
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>('.method-tab')) {
  button.setAttribute('aria-selected', button.dataset.method === String(degree) ? 'true' : 'false');
}
bindMethodTabs<string>(next => {
  degree = Number(next);
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
