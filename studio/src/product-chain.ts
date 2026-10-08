import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'product-chain',
  section: { label: '微分積分' },
  title: '積の微分と合成関数の微分',
  description: `微分の定義から、積 ${tex('uv')} の導関数と合成関数 ${tex('f(g(x))')} の導関数の公式を導きます。例 ${tex(String.raw`x^2 \sin x`)} と ${tex('e^{x^2}')} について、公式の厳密な値と中心差分の近似値を比べます。`,
  equation: [String.raw`(uv)' = u'v + uv'`, String.raw`\frac{d}{dx} f(g(x)) = f'(g(x))\,g'(x)`],
  equationLabel: '積の微分は u プライム v 足す u v プライム。合成関数の微分は f プライム g x 掛ける g プライム x。',
  studyHeading: '微分の定義から二つの公式への手順',
  steps: [
    `記号を定めます。${tex('u')}、${tex('v')} は点 ${tex('x')} で微分可能な関数です。合成関数では、${tex('g')} は ${tex('x')} で微分可能、${tex('f')} は点 ${tex('g(x)')} で微分可能とします。${tex(`u'`)} などは導関数、${tex(String.raw`h \neq 0`)} は刻みです。`,
    `積の差分商を二つに分けます。${tex('u(x)v(x + h)')} を引いて加えると
      ${eq(String.raw`u(x + h)v(x + h) - u(x)v(x) = \bigl(u(x + h) - u(x)\bigr)v(x + h) + u(x)\bigl(v(x + h) - v(x)\bigr)`)}
      です。両辺を ${tex('h')} で割ります。
      ${eq(String.raw`\frac{u(x + h)v(x + h) - u(x)v(x)}{h} = \frac{u(x + h) - u(x)}{h}\,v(x + h) + u(x)\,\frac{v(x + h) - v(x)}{h}`)}
      ${tex(String.raw`h \to 0`)} で、第1の差分商は ${tex(`u'(x)`)} に、${tex('v(x + h)')} は ${tex('v')} の連続性により ${tex('v(x)')} に、第2の差分商は ${tex(`v'(x)`)} に近づきます。
      ${eq(String.raw`(uv)'(x) = u'(x)\,v(x) + u(x)\,v'(x)`)}
      です（${coreDoc('calculus', 'product_derivative', '積の微分の説明')}）。`,
    `例として ${tex('u = x^2')}、${tex(String.raw`v = \sin x`)} とすると ${tex(`u' = 2x`)}、${tex(String.raw`v' = \cos x`)} です。
      ${eq(String.raw`\frac{d}{dx}\left(x^2 \sin x\right) = 2x \cdot \sin x + x^2 \cdot \cos x`)}
      第1項 ${tex(String.raw`2x \sin x`)} は ${tex(`u'v`)}、第2項 ${tex(String.raw`x^2 \cos x`)} は ${tex(`uv'`)} です（${coreDoc('calculus', 'square_sine_derivative', 'x² sin x の導関数の説明')}）。`,
    `合成関数では、内側の増分を ${tex('k = g(x + h) - g(x)')} と置きます。${tex(String.raw`k \neq 0`)} のとき
      ${eq(String.raw`\frac{f(g(x + h)) - f(g(x))}{h} = \frac{f(g(x) + k) - f(g(x))}{k} \cdot \frac{k}{h}`)}
      です。${tex(String.raw`h \to 0`)} で ${tex('g')} の連続性により ${tex(String.raw`k \to 0`)} となり、第1因子は ${tex(`f'(g(x))`)} に、第2因子は ${tex(`g'(x)`)} に近づきます。${tex('k = 0')} となる ${tex('h')} がある場合も含めた証明は、ページの最後にあります。
      ${eq(String.raw`\frac{d}{dx} f(g(x)) = f'(g(x))\,g'(x)`)}
      です（${coreDoc('calculus', 'chain_derivative', '合成関数の微分の説明')}）。`,
    `例として外側を ${tex('f(u) = e^u')}、内側を ${tex('g(x) = x^2')} とすると、${tex(`f'(u) = e^u`)}、${tex(`g'(x) = 2x`)} です。
      ${eq(String.raw`\frac{d}{dx} e^{x^2} = e^{x^2} \cdot 2x = 2x\,e^{x^2}`)}
      です（${coreDoc('calculus', 'exp_square_derivative', 'e の x² 乗の導関数の説明')}）。`,
    `近似値は中心差分
      ${eq(String.raw`D_0 F(x) = \frac{F(x + h) - F(x - h)}{2h}`)}
      で求めます（${coreDoc('calculus', 'central_difference', '中心差分の説明')}）。公式の値との差はおよそ ${tex('h^2')} に比例し、${tex('h')} を ${tex(String.raw`\frac{1}{10}`)} にすると約 ${tex(String.raw`\frac{1}{100}`)} になります。`,
  ],
  figureAlt: '関数 x² sin x の導関数が、二つの項 2x sin x と x² cos x の和として組み上がる曲線。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">関数と導関数の曲線</h2><div class="legend"><span><i class="numerical"></i>中心差分 h = 0.1（近似値）</span><span><i class="analytical"></i>公式の導関数（厳密）</span></div></div>
        <div class="plot-pair">
          <div><h3>${tex(String.raw`x^2 \sin x`)} と導関数</h3><canvas id="product-chart" role="img"></canvas><p>横軸 ${tex('x')}。黒の実線は ${tex(String.raw`x^2 \sin x`)}、灰色の実線は第1項 ${tex(String.raw`2x \sin x`)}、灰色の破線は第2項 ${tex(String.raw`x^2 \cos x`)} です。</p></div>
          <div><h3>${tex('e^{x^2}')} と導関数</h3><canvas id="chain-chart" role="img"></canvas><p>横軸 ${tex('x')}。黒の実線は ${tex('e^{x^2}')} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex(String.raw`(x^2 \sin x)'`)} の ${tex('x = 1')} の値（厳密な式）</span><output id="product-exact">—</output></div>
          <div><span>中心差分 h = 0.1（近似値）</span><output id="product-central">—</output></div>
          <div><span>${tex(String.raw`(e^{x^2})'`)} の ${tex('x = 1')} の値 ${tex('2e')}（厳密な式）</span><output id="chain-exact">—</output></div>
          <div><span>中心差分 h = 0.1（近似値）</span><output id="chain-central">—</output></div>
        </div>
        <h3>点 ${tex('x = 1')} の中心差分と公式の値の差</h3>
        <div id="difference-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('x = 1')} とします。${tex(String.raw`\sin 1 = 0.841471\ldots`)}、${tex(String.raw`\cos 1 = 0.540302\ldots`)}（近似値）です。積の微分の公式に代入すると
      ${eq(String.raw`2 \cdot 1 \cdot \sin 1 + 1^2 \cdot \cos 1 = 1.682942\ldots + 0.540302\ldots = 2.223244\ldots`)}
      です。第1項と第2項の値は、図の灰色の2本の曲線の ${tex('x = 1')} における高さです。`,
    `合成関数の微分の公式に代入すると、厳密に
      ${eq(String.raw`2 \cdot 1 \cdot e^{1^2} = 2e = 5.436563\ldots`)}
      です。`,
    `中心差分を ${tex('h = 0.1')} で手計算します。${tex(String.raw`e^{1.1^2} = e^{1.21} = 3.353485\ldots`)}、${tex(String.raw`e^{0.9^2} = e^{0.81} = 2.247908\ldots`)} なので
      ${eq(String.raw`\frac{e^{1.21} - e^{0.81}}{2 \cdot 0.1} = \frac{1.105576\ldots}{0.2} = 5.527883\ldots`)}
      で、厳密な値 ${tex('2e')} との差は ${tex('0.0913\\ldots')} です。表では ${tex('h')} を ${tex(String.raw`\frac{1}{10}`)} にするごとに、差がほぼ ${tex(String.raw`\frac{1}{100}`)} になります。`,
  ],
  related: [
    { href: './derivative-definition.html', title: '微分の定義', description: '二つの公式の出発点である差分商の極限です。' },
    { href: './integration-techniques.html', title: '置換積分と部分積分', description: '合成関数の微分から置換積分を、積の微分から部分積分を導きます。' },
    { href: './taylor.html', title: 'Taylor 展開', description: '高い階数の導関数を使って関数を多項式で近似します。' },
    { href: './numerical-differentiation.html', title: '数値微分', description: '中心差分の誤差が刻みの2乗に比例することを示します。' },
  ],
  footer: 'この画面の計算は、x² sin x と e の x² 乗の導関数の公式の値と中心差分です。',
  proof: writtenProof([
    {
      statement: `${tex('u')}、${tex('v')} が点 ${tex('x')} で微分可能ならば、${tex('uv')} も ${tex('x')} で微分可能で、${tex(String.raw`(uv)'(x) = u'(x)v(x) + u(x)v'(x)`)} です。`,
      proof: [
        `${tex(String.raw`h \neq 0`)} に対して、${tex('u(x)v(x + h)')} を引いて加えます。
          ${eq(String.raw`u(x + h)v(x + h) - u(x)v(x) = u(x + h)v(x + h) - u(x)v(x + h) + u(x)v(x + h) - u(x)v(x)`)}
          ${eq(String.raw`= \bigl(u(x + h) - u(x)\bigr)v(x + h) + u(x)\bigl(v(x + h) - v(x)\bigr)`)}`,
        `両辺を ${tex('h')} で割ります。
          ${eq(String.raw`\frac{(uv)(x + h) - (uv)(x)}{h} = \frac{u(x + h) - u(x)}{h}\,v(x + h) + u(x)\,\frac{v(x + h) - v(x)}{h}`)}`,
        `${tex('v')} は ${tex('x')} で微分可能なので連続であり、${tex(String.raw`\lim_{h \to 0} v(x + h) = v(x)`)} です。極限の和と積の性質により
          ${eq(String.raw`\lim_{h \to 0} \frac{(uv)(x + h) - (uv)(x)}{h} = u'(x)\,v(x) + u(x)\,v'(x)`)}
          です。`,
      ],
    },
    {
      statement: `${tex('g')} が点 ${tex('x')} で微分可能で、${tex('f')} が点 ${tex('g(x)')} で微分可能ならば、${tex(String.raw`f \circ g`)} は ${tex('x')} で微分可能で、${tex(String.raw`(f \circ g)'(x) = f'(g(x))\,g'(x)`)} です。`,
      proof: [
        `${tex('y = g(x)')} と置き、関数 ${tex(String.raw`\varphi`)} を次で定めます。
          ${eq(String.raw`\varphi(k) = \begin{cases} \dfrac{f(y + k) - f(y)}{k} & (k \neq 0) \\ f'(y) & (k = 0) \end{cases}`)}
          ${tex('f')} は ${tex('y')} で微分可能なので ${tex(String.raw`\lim_{k \to 0} \varphi(k) = f'(y) = \varphi(0)`)} であり、${tex(String.raw`\varphi`)} は ${tex('0')} で連続です。`,
        `${tex(String.raw`k \neq 0`)} でも ${tex('k = 0')} でも、両辺が 0 になることを含めて
          ${eq(String.raw`f(y + k) - f(y) = \varphi(k)\,k`)}
          が成り立ちます。`,
        `${tex('k = g(x + h) - g(x)')} を代入すると、${tex('y + k = g(x + h)')} なので
          ${eq(String.raw`f(g(x + h)) - f(g(x)) = \varphi\bigl(g(x + h) - g(x)\bigr)\,\bigl(g(x + h) - g(x)\bigr)`)}
          両辺を ${tex(String.raw`h \neq 0`)} で割ります。
          ${eq(String.raw`\frac{f(g(x + h)) - f(g(x))}{h} = \varphi\bigl(g(x + h) - g(x)\bigr) \cdot \frac{g(x + h) - g(x)}{h}`)}`,
        `${tex(String.raw`h \to 0`)} で、${tex('g')} の連続性により ${tex(String.raw`g(x + h) - g(x) \to 0`)} です。${tex(String.raw`\varphi`)} は 0 で連続なので第1因子は ${tex(String.raw`\varphi(0) = f'(g(x))`)} に、第2因子は ${tex(`g'(x)`)} に近づきます。
          ${eq(String.raw`(f \circ g)'(x) = f'(g(x))\,g'(x)`)}`,
      ],
    },
  ]),
});

let figure: LessonFigure | undefined;

function table(headers: string[], rows: string[][]): string {
  return `<div class="table-scroll"><table class="value-table"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function paint() {
  if (!figure) return;
  const f = figure;
  drawPlot(document.getElementById('product-chart') as HTMLCanvasElement, {
    label: 'x² sin x と、その導関数、第1項 2x sin x、第2項 x² cos x。実線の青は中心差分、破線は公式の導関数。',
    lines: [line(f, 'term1'), line(f, 'term2'), line(f, 'product'), line(f, 'product-central'), line(f, 'product-exact')],
    dots: [dot(f, 'product-at-one')],
    xMin: -3,
    xMax: 3,
    yMin: -10,
    yMax: 6,
    zeroLabel: 'y = 0',
  });
  drawPlot(document.getElementById('chain-chart') as HTMLCanvasElement, {
    label: 'e の x² 乗と、その導関数。実線の青は中心差分、破線は公式の導関数。',
    lines: [line(f, 'chain'), line(f, 'chain-central'), line(f, 'chain-exact')],
    dots: [dot(f, 'chain-at-one')],
    xMin: -1.2,
    xMax: 1.2,
    yMin: -12,
    yMax: 12,
    zeroLabel: 'y = 0',
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/product-chain', { h: 0.1 });
    const v = figure.values;
    document.getElementById('product-exact')!.textContent = v.product_exact.toFixed(6);
    document.getElementById('product-central')!.textContent = v.product_central.toFixed(6);
    document.getElementById('chain-exact')!.textContent = v.chain_exact.toFixed(6);
    document.getElementById('chain-central')!.textContent = v.chain_central.toFixed(6);
    const a = figure.arrays;
    document.getElementById('difference-table')!.innerHTML = table(
      [tex('h'), `${tex(String.raw`x^2 \sin x`)} の中心差分`, '公式との差', `${tex('e^{x^2}')} の中心差分`, '公式との差'],
      a.h.map((h, i) => [String(h), a.product_central[i].toFixed(10), a.product_gap[i].toExponential(4), a.chain_central[i].toFixed(10), a.chain_gap[i].toExponential(4)]),
    );
    paint();
    setStatus('finished');
  } catch (error) {
    const box = document.getElementById('error')!;
    box.textContent = String(error);
    box.hidden = false;
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
