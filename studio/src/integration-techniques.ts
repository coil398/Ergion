import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'integration-techniques',
  section: { label: '微分積分' },
  title: '置換積分と部分積分',
  description: `合成関数の微分から置換積分の公式を、積の微分から部分積分の公式を、微分積分学の基本定理を使って導きます。例 ${tex(String.raw`\int_0^1 2t\,e^{t^2}\,dt = e - 1`)} と ${tex(String.raw`\int_0^1 x e^x\,dx = 1`)} の厳密な値を、Simpson 則の近似値と比べます。`,
  equation: [String.raw`\int_a^b f(g(t))\,g'(t)\,dt = \int_{g(a)}^{g(b)} f(x)\,dx`, String.raw`\int_a^b u\,v'\,dx = \bigl[uv\bigr]_a^b - \int_a^b u'\,v\,dx`],
  equationLabel: '置換積分の公式と部分積分の公式。',
  studyHeading: '二つの公式と例の計算の手順',
  steps: [
    `記号を定めます。置換 ${tex('x = g(t)')} の ${tex('g')} は ${tex('[a, b]')} で連続な導関数 ${tex(`g'`)} をもち、${tex('f')} は ${tex('g')} の値の範囲で連続です。部分積分の ${tex('u')}、${tex('v')} は ${tex('[a, b]')} で連続な導関数をもつ関数で、${tex(String.raw`\bigl[uv\bigr]_a^b = u(b)v(b) - u(a)v(a)`)} は境界の項です。`,
    `置換積分の例です。${tex('g(t) = t^2')} とすると ${tex(`g'(t) = 2t`)}、${tex('g(0) = 0')}、${tex('g(1) = 1')} です。${tex('f(x) = e^x')} とすると、被積分関数は ${tex(String.raw`2t\,e^{t^2} = f(g(t))\,g'(t)`)} の形です。
      ${eq(String.raw`\int_0^1 2t\,e^{t^2}\,dt = \int_0^1 e^{g(t)}\,g'(t)\,dt = \int_{g(0)}^{g(1)} e^x\,dx = \int_0^1 e^x\,dx`)}
      ${eq(String.raw`\int_0^1 e^x\,dx = \bigl[e^x\bigr]_0^1 = e^1 - e^0 = e - 1 = 1.718281\ldots`)}
      です。${tex('e - 1')} は厳密な値、${tex(String.raw`1.718281\ldots`)} は近似値です（${coreDoc('calculus', 'exp_substitution_exact', '置換積分の例の説明')}）。`,
    `置換積分の公式は、合成関数の微分を積分し直した式です。${tex(`F' = f`)} とすると、合成関数の微分により
      ${eq(String.raw`\frac{d}{dt} F(g(t)) = F'(g(t))\,g'(t) = f(g(t))\,g'(t)`)}
      です。両辺を ${tex('a')} から ${tex('b')} まで積分すると、基本定理により
      ${eq(String.raw`\int_a^b f(g(t))\,g'(t)\,dt = \int_a^b \frac{d}{dt} F(g(t))\,dt = F(g(b)) - F(g(a))`)}
      です。一方、${tex(`F' = f`)} なので、同じ定理により
      ${eq(String.raw`\int_{g(a)}^{g(b)} f(x)\,dx = F(g(b)) - F(g(a))`)}
      です。右辺が等しいので、二つの積分は等しい値です（${coreDoc('calculus', 'integrate_by_substitution', '置換したあとの積分の説明')}）。`,
    `部分積分の例です。${tex('u = x')}、${tex(`v' = e^x`)} とすると ${tex(`u' = 1`)}、${tex('v = e^x')} です。
      ${eq(String.raw`\int_0^1 x\,e^x\,dx = \bigl[x\,e^x\bigr]_0^1 - \int_0^1 1 \cdot e^x\,dx`)}
      境界の項は
      ${eq(String.raw`\bigl[x\,e^x\bigr]_0^1 = 1 \cdot e^1 - 0 \cdot e^0 = e`)}
      残りの積分は上で求めた ${tex('e - 1')} なので
      ${eq(String.raw`\int_0^1 x\,e^x\,dx = e - (e - 1) = 1`)}
      です（${coreDoc('calculus', 'x_exp_by_parts_exact', '部分積分の例の説明')}、${coreDoc('calculus', 'integrate_by_parts', '部分積分の右辺の説明')}）。`,
    `部分積分を面積で見ます。${tex('u = x')}、${tex('v = e^x')}（${tex(String.raw`0 \le x \le 1`)}）は、${tex('(u, v)')} 平面の曲線 ${tex('v = e^u')} を描きます。長方形 ${tex(String.raw`[0, 1] \times [0, e]`)} の面積は ${tex('u(1)v(1) - u(0)v(0) = e')} で、曲線はこれを二つに分けます。曲線の下の面積は ${tex(String.raw`\int_0^1 v\,du = \int_0^1 e^x\,dx = e - 1`)}、曲線と縦軸のあいだの面積は、${tex(String.raw`dv = e^x\,dx`)} より ${tex(String.raw`\int u\,dv = \int_0^1 x\,e^x\,dx = 1`)} で、和は ${tex('e')} です。`,
    `近似値は Simpson 則で求めます（${coreDoc('calculus', 'simpson_rule', 'Simpson 則の説明')}）。置換の前の ${tex(String.raw`2t\,e^{t^2}`)} と置換の後の ${tex('e^x')} は別の関数なので、積分の厳密な値は等しくても、同じ分割数の近似値は異なります。`,
  ],
  figureAlt: '置換の前後で等しい二つの面積と、部分積分で長方形を分ける曲線。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">置換の前後の面積と、部分積分の長方形</h2><div class="legend"><span><i class="numerical"></i>Simpson 則の節点 n = 2</span></div></div>
        <div class="plot-pair">
          <div><h3>置換の前 ${tex(String.raw`y = 2t\,e^{t^2}`)}</h3><canvas id="before-chart" role="img"></canvas><p>横軸 ${tex('t')}。塗った面積は ${tex('e - 1')} です。</p></div>
          <div><h3>置換の後 ${tex('y = e^x')}</h3><canvas id="after-chart" role="img"></canvas><p>横軸 ${tex('x = t^2')}。塗った面積は同じ ${tex('e - 1')} です。</p></div>
        </div>
        <div>
          <h3>曲線 ${tex('v = e^u')} で分けた長方形 ${tex(String.raw`[0, 1] \times [0, e]`)}</h3>
          <canvas id="parts-chart" role="img"></canvas>
          <p>横軸 ${tex('u = x')}、縦軸 ${tex('v = e^x')}。塗った領域は ${tex(String.raw`\int u\,dv = \int_0^1 x\,e^x\,dx = 1`)}、曲線の下の白い領域は ${tex(String.raw`\int v\,du = e - 1`)} です。</p>
        </div>
        <div class="readouts">
          <div><span>置換の前の Simpson 則 n = 2（近似値）</span><output id="before">—</output></div>
          <div><span>置換の後の Simpson 則 n = 2（近似値）</span><output id="after">—</output></div>
          <div><span>厳密な値 e − 1</span><output id="sub-exact">—</output></div>
          <div><span>∫ x eˣ dx の Simpson 則 n = 2（近似値）</span><output id="direct">—</output></div>
        </div>
        <h3>置換積分 ${tex(String.raw`\int_0^1 2t\,e^{t^2}\,dt = e - 1`)} の Simpson 則（近似値）</h3>
        <div id="substitution-table"></div>
        <h3>部分積分 ${tex(String.raw`\int_0^1 x\,e^x\,dx = 1`)} の Simpson 則（近似値）</h3>
        <div id="parts-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `分割数 ${tex('n = 2')}、刻み ${tex(String.raw`h = \frac{1}{2}`)}、節点 ${tex(String.raw`0, \frac{1}{2}, 1`)} の Simpson 則 ${tex(String.raw`S_2 = \frac{h}{3}\bigl[f(0) + 4f(\tfrac{1}{2}) + f(1)\bigr]`)} を使います。この式の ${tex('f')} は積分する関数を表し、${tex(String.raw`\frac{h}{3} = \frac{1}{6}`)} です。以下の例の小数はすべて近似値です。置換の前の被積分関数の値は ${tex('0')}、${tex(String.raw`2 \cdot \frac{1}{2} \cdot e^{1/4} = e^{1/4} = 1.284025\ldots`)}、${tex('2e = 5.436563\\ldots')} なので
      ${eq(String.raw`S_2 = \frac{1}{6}\bigl[0 + 4 \cdot 1.284025\ldots + 5.436563\ldots\bigr] = \frac{10.572665\ldots}{6} = 1.762110\ldots`)}
      で、厳密な値 ${tex('e - 1 = 1.718281\\ldots')} との差は ${tex('0.043829\\ldots')} です。`,
    `置換の後の ${tex('e^x')} の値は ${tex('1')}、${tex(String.raw`e^{1/2} = 1.648721\ldots`)}、${tex('e = 2.718281\\ldots')} なので
      ${eq(String.raw`S_2 = \frac{1}{6}\bigl[1 + 4 \cdot 1.648721\ldots + 2.718281\ldots\bigr] = \frac{10.313166\ldots}{6} = 1.718861\ldots`)}
      で、差は ${tex('0.000579\\ldots')} です。同じ積分でも、置換の後の関数のほうが近似の差は小さくなっています。`,
    `部分積分の例では、${tex('x e^x')} をそのまま積分すると、値 ${tex('0')}、${tex(String.raw`\frac{1}{2}e^{1/2} = 0.824360\ldots`)}、${tex('e')} から
      ${eq(String.raw`S_2 = \frac{1}{6}\bigl[0 + 4 \cdot 0.824360\ldots + 2.718281\ldots\bigr] = \frac{6.015724\ldots}{6} = 1.002620\ldots`)}
      です。部分積分の右辺では、境界の項 ${tex('e')}（厳密）から ${tex('e^x')} の Simpson 則を引いて ${tex(String.raw`2.718281\ldots - 1.718861\ldots = 0.999420\ldots`)} です。厳密な値はどちらも 1 です。`,
  ],
  related: [
    { href: './fundamental-theorem.html', title: '定積分と微分積分学の基本定理' },
    { href: './product-chain.html', title: '積の微分と合成関数の微分' },
    { href: './numerical-integration.html', title: '数値積分' },
  ],
  footer: 'この画面の計算は、∫₀¹ 2t e^(t²) dt と ∫₀¹ x eˣ dx の厳密な値と Simpson 則です。',
  proof: writtenProof([
    {
      statement: `（置換積分）${tex(`g'`)} が ${tex('[a, b]')} で連続で、${tex('f')} が ${tex('g')} の値の範囲で連続ならば、${tex(String.raw`\int_a^b f(g(t))\,g'(t)\,dt = \int_{g(a)}^{g(b)} f(x)\,dx`)} です。`,
      proof: [
        `${tex('g')} の値の範囲の点 ${tex('g(a)')} を起点に ${tex(String.raw`F(x) = \int_{g(a)}^{x} f(s)\,ds`)} と置きます。基本定理の第一の主張により ${tex(`F'(x) = f(x)`)} です。`,
        `合成関数の微分により
          ${eq(String.raw`\frac{d}{dt} F(g(t)) = F'(g(t))\,g'(t) = f(g(t))\,g'(t)`)}
          です。右辺は ${tex('t')} について連続なので、${tex(String.raw`F \circ g`)} はその原始関数です。`,
        `基本定理の第二の主張を ${tex(String.raw`F \circ g`)} に使うと
          ${eq(String.raw`\int_a^b f(g(t))\,g'(t)\,dt = F(g(b)) - F(g(a))`)}
          です。`,
        `同じ主張を ${tex('F')} に使うと
          ${eq(String.raw`\int_{g(a)}^{g(b)} f(x)\,dx = F(g(b)) - F(g(a))`)}
          です。右辺が等しいので、二つの積分は等しい値です。`,
      ],
    },
    {
      statement: `（部分積分）${tex('u')}、${tex('v')} が ${tex('[a, b]')} で連続な導関数をもつならば、${tex(String.raw`\int_a^b u\,v'\,dx = \bigl[uv\bigr]_a^b - \int_a^b u'\,v\,dx`)} です。`,
      proof: [
        `積の微分により
          ${eq(String.raw`(uv)' = u'v + uv'`)}
          で、右辺は連続です。`,
        `両辺を ${tex('a')} から ${tex('b')} まで積分します。左辺は基本定理の第二の主張により
          ${eq(String.raw`\int_a^b (uv)'\,dx = u(b)v(b) - u(a)v(a) = \bigl[uv\bigr]_a^b`)}
          です。`,
        `右辺は積分の線形性により二つに分かれます。
          ${eq(String.raw`\bigl[uv\bigr]_a^b = \int_a^b u'\,v\,dx + \int_a^b u\,v'\,dx`)}`,
        `${tex(String.raw`\int_a^b u'\,v\,dx`)} を左辺へ移すと
          ${eq(String.raw`\int_a^b u\,v'\,dx = \bigl[uv\bigr]_a^b - \int_a^b u'\,v\,dx`)}
          です。`,
      ],
    },
  ]),
});

let figure: LessonFigure | undefined;

function table(headers: string[], rows: string[][]): string {
  return `<div class="table-scroll"><table class="value-table"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function polygon(f: LessonFigure, name: string) {
  const p = f.polygons.find(item => item.name === name);
  if (!p) throw new Error(`図の値 ${name} がありません。`);
  return { x: p.x, y: p.y };
}

function nodes(f: LessonFigure, prefix: string) {
  return f.points.filter(p => p.name.startsWith(prefix)).map(p => ({ x: p.x, y: p.y, role: p.role }));
}

function paint() {
  if (!figure) return;
  const f = figure;
  drawPlot(document.getElementById('before-chart') as HTMLCanvasElement, {
    label: '置換の前の被積分関数 2t e^(t²) と、その下の面積 e − 1。点は Simpson 則の節点。',
    polygons: [polygon(f, 'area-t')],
    lines: [line(f, 'integrand-t')],
    dots: nodes(f, 'node-t-'),
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 6,
  });
  drawPlot(document.getElementById('after-chart') as HTMLCanvasElement, {
    label: '置換の後の被積分関数 e^x と、その下の面積 e − 1。点は Simpson 則の節点。',
    polygons: [polygon(f, 'area-x')],
    lines: [line(f, 'integrand-x')],
    dots: nodes(f, 'node-x-'),
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 6,
  });
  drawPlot(document.getElementById('parts-chart') as HTMLCanvasElement, {
    label: '曲線 v = e^u が長方形 [0, 1] × [0, e] を面積 1 と e − 1 に分ける図。',
    polygons: [polygon(f, 'u-dv')],
    lines: [line(f, 'rectangle'), line(f, 'v-of-u', 'v = eᵘ')],
    dots: nodes(f, 'node-uv-'),
    xMin: -0.1,
    xMax: 1.1,
    yMin: 0,
    yMax: 3,
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/integration-techniques', { n: 2 });
    const v = figure.values;
    document.getElementById('before')!.textContent = v.before.toFixed(6);
    document.getElementById('after')!.textContent = v.after.toFixed(6);
    document.getElementById('sub-exact')!.textContent = v.substitution_exact.toFixed(6);
    document.getElementById('direct')!.textContent = v.direct.toFixed(6);
    const a = figure.arrays;
    document.getElementById('substitution-table')!.innerHTML = table(
      [tex('n'), '置換の前', '差', '置換の後', '差'],
      a.n.map((n, i) => [String(n), a.before[i].toFixed(10), a.before_gap[i].toExponential(4), a.after[i].toFixed(10), a.after_gap[i].toExponential(4)]),
    );
    document.getElementById('parts-table')!.innerHTML = table(
      [tex('n'), tex(String.raw`x\,e^x`) + ' をそのまま', '差', tex(String.raw`e - \int e^x\,dx`), '差'],
      a.n.map((n, i) => [String(n), a.direct[i].toFixed(10), a.direct_gap[i].toExponential(4), a.parts[i].toFixed(10), a.parts_gap[i].toExponential(4)]),
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
