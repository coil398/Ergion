import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Rule = 'left' | 'right' | 'midpoint';
const ruleNames: Record<Rule, string> = { left: '左端', right: '右端', midpoint: '中点' };
const N = 4;

renderLesson({
  id: 'fundamental-theorem',
  section: { label: '微分積分' },
  title: '定積分と微分積分学の基本定理',
  description: `区間を ${tex('n')} 等分した長方形の面積の和、すなわち Riemann 和の極限として定積分を定めます。微分積分学の基本定理により、定積分は原始関数の値の差で計算でき、${tex(String.raw`\int_0^1 x^2\,dx = \frac{1}{3}`)} です。`,
  equation: [
    String.raw`S_n = \sum_{i=1}^{n} f(x_i^*)\,\Delta x`,
    String.raw`\int_a^b f(x)\,dx = \lim_{n \to \infty} S_n`,
    String.raw`\frac{d}{dx}\int_a^x f(t)\,dt = f(x)`,
    String.raw`\int_a^b f(x)\,dx = G(b) - G(a)`,
  ],
  equationLabel: 'Riemann 和 S n は長方形の面積の和で、定積分はその極限。積分の上端で微分すると被積分関数に戻り、定積分は原始関数の差に等しい。',
  studyHeading: 'Riemann 和から定積分への手順',
  steps: [
    `記号を定めます。${tex('f')} は閉区間 ${tex('[a, b]')} で連続な関数、${tex('n')} は分割数、${tex(String.raw`\Delta x = \frac{b - a}{n}`)} は小区間の幅、${tex(String.raw`x_i = a + i\,\Delta x`)} は分点です。第 ${tex('i')} 小区間 ${tex(String.raw`[x_{i-1}, x_i]`)} から標本点 ${tex(String.raw`x_i^*`)} を一つ選びます。左端は ${tex(String.raw`x_i^* = x_{i-1}`)}、右端は ${tex(String.raw`x_i^* = x_i`)}、中点は ${tex(String.raw`x_i^* = \frac{x_{i-1} + x_i}{2}`)} です。Riemann 和
      ${eq(String.raw`S_n = \sum_{i=1}^{n} f(x_i^*)\,\Delta x`)}
      は、高さ ${tex(String.raw`f(x_i^*)`)}、幅 ${tex(String.raw`\Delta x`)} の長方形の面積の和です（${coreDoc('calculus', 'riemann_sum', 'Riemann 和の説明')}）。${tex(String.raw`n \to \infty`)} の極限が定積分 ${tex(String.raw`\int_a^b f(x)\,dx`)} です。`,
    `例として ${tex('f(x) = x^2')}、${tex('[a, b] = [0, 1]')} をとります。${tex(String.raw`\Delta x = \frac{1}{n}`)} で、右端の標本点は ${tex(String.raw`x_i^* = \frac{i}{n}`)} です。
      ${eq(String.raw`S_n^{\mathrm{R}} = \sum_{i=1}^{n} \left(\frac{i}{n}\right)^2 \frac{1}{n} = \frac{1}{n^3} \sum_{i=1}^{n} i^2`)}
      和の公式 ${tex(String.raw`\sum_{i=1}^{n} i^2 = \frac{n(n + 1)(2n + 1)}{6}`)} を代入します。
      ${eq(String.raw`S_n^{\mathrm{R}} = \frac{1}{n^3} \cdot \frac{n(n + 1)(2n + 1)}{6} = \frac{(n + 1)(2n + 1)}{6n^2}`)}
      分子を展開すると ${tex('(n + 1)(2n + 1) = 2n^2 + 3n + 1')} なので
      ${eq(String.raw`S_n^{\mathrm{R}} = \frac{2n^2 + 3n + 1}{6n^2} = \frac{1}{3} + \frac{1}{2n} + \frac{1}{6n^2}`)}
      です。${tex(String.raw`n \to \infty`)} で ${tex(String.raw`S_n^{\mathrm{R}} \to \frac{1}{3}`)} です（${coreDoc('calculus', 'square_riemann_sum_exact', '和の公式で整理した式の説明')}）。`,
    `左端の標本点 ${tex(String.raw`x_i^* = \frac{i - 1}{n}`)} では、${tex(String.raw`\sum_{i=1}^{n} (i - 1)^2 = \frac{(n - 1)n(2n - 1)}{6}`)} より
      ${eq(String.raw`S_n^{\mathrm{L}} = \frac{(n - 1)(2n - 1)}{6n^2} = \frac{2n^2 - 3n + 1}{6n^2} = \frac{1}{3} - \frac{1}{2n} + \frac{1}{6n^2}`)}
      です。中点 ${tex(String.raw`x_i^* = \frac{2i - 1}{2n}`)} では、${tex(String.raw`\sum_{i=1}^{n} (2i - 1)^2 = \frac{n(4n^2 - 1)}{3}`)} より
      ${eq(String.raw`S_n^{\mathrm{M}} = \frac{1}{4n^2} \cdot \frac{1}{n} \cdot \frac{n(4n^2 - 1)}{3} = \frac{4n^2 - 1}{12n^2} = \frac{1}{3} - \frac{1}{12n^2}`)}
      です。左端と右端の差は ${tex(String.raw`\frac{1}{2n}`)} 程度で ${tex('n')} に反比例し、中点の差は ${tex(String.raw`\frac{1}{12n^2}`)} で ${tex('n^2')} に反比例します。`,
    `微分積分学の基本定理は二つの主張です。第一に、${tex(String.raw`F(x) = \int_a^x f(t)\,dt`)} は ${tex(`F'(x) = f(x)`)} を満たします。第二に、${tex(`G' = f`)} となる原始関数 ${tex('G')} があれば
      ${eq(String.raw`\int_a^b f(x)\,dx = G(b) - G(a)`)}
      です。${tex('f(x) = x^2')} では ${tex(String.raw`G(x) = \frac{x^3}{3}`)} が原始関数（${tex(String.raw`G'(x) = \frac{3x^2}{3} = x^2`)}）なので
      ${eq(String.raw`\int_0^1 x^2\,dx = \frac{1^3}{3} - \frac{0^3}{3} = \frac{1}{3}`)}
      です。Riemann 和の極限と同じ値です。`,
  ],
  figureAlt: '曲線 y = x² の下に並ぶ長方形の和が、分割を細かくするにつれて面積 1/3 へ近づく様子。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">曲線 ${tex('y = x^2')} の下の長方形と Riemann 和 ${tex('S_n')}</h2><div class="legend"><span><i class="numerical"></i>Riemann 和（計算値）</span><span><i class="analytical"></i>厳密な値 1/3</span></div></div>
        ${methodTabs('Riemann 和の標本点', [
          { id: 'left', label: '左端 Riemann 和' },
          { id: 'right', label: '右端 Riemann 和' },
          { id: 'midpoint', label: '中点 Riemann 和' },
        ])}
        <div class="plot-pair">
          <div><h3>${tex(`n = ${N}`)} 本の長方形</h3><canvas id="rect-chart" role="img"></canvas><p>横軸 ${tex('x')}。青の点は標本点 ${tex(String.raw`(x_i^*, f(x_i^*))`)} です。</p></div>
          <div><h3>分割数 ${tex('n')} と Riemann 和 ${tex('S_n')}</h3><canvas id="sum-chart" role="img"></canvas><p>横軸 分割数 ${tex('n')}。破線は厳密な値 ${tex(String.raw`\frac{1}{3}`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>標本点</span><output id="rule">—</output></div>
          <div><span>n = ${N} の Riemann 和（計算値）</span><output id="sum">—</output></div>
          <div><span>和の公式の値（厳密）</span><output id="closed">—</output></div>
          <div><span>差 S_n − 1/3</span><output id="sum-error">—</output></div>
        </div>
        <h3>分割数 ${tex('n')} を2倍ずつ増やしたときの Riemann 和</h3>
        <div id="sum-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('n = 4')} とします。${tex(String.raw`\Delta x = \frac{1}{4}`)} です。右端の標本点は ${tex(String.raw`\frac{1}{4}, \frac{2}{4}, \frac{3}{4}, 1`)} で
      ${eq(String.raw`S_4^{\mathrm{R}} = \frac{1}{4}\left(\frac{1}{16} + \frac{4}{16} + \frac{9}{16} + \frac{16}{16}\right) = \frac{1}{4} \cdot \frac{30}{16} = \frac{15}{32} = 0.46875`)}
      です。公式 ${tex(String.raw`\frac{(4 + 1)(8 + 1)}{6 \cdot 16} = \frac{45}{96} = \frac{15}{32}`)} と一致し、厳密な値との差は ${tex(String.raw`\frac{15}{32} - \frac{1}{3} = \frac{13}{96} = 0.135416\ldots`)} です。`,
    `左端の標本点は ${tex(String.raw`0, \frac{1}{4}, \frac{2}{4}, \frac{3}{4}`)} で
      ${eq(String.raw`S_4^{\mathrm{L}} = \frac{1}{4}\left(0 + \frac{1}{16} + \frac{4}{16} + \frac{9}{16}\right) = \frac{1}{4} \cdot \frac{14}{16} = \frac{7}{32} = 0.21875`)}
      で、差は ${tex(String.raw`\frac{7}{32} - \frac{1}{3} = -\frac{11}{96} = -0.114583\ldots`)} です。`,
    `中点の標本点は ${tex(String.raw`\frac{1}{8}, \frac{3}{8}, \frac{5}{8}, \frac{7}{8}`)} で
      ${eq(String.raw`S_4^{\mathrm{M}} = \frac{1}{4}\left(\frac{1}{64} + \frac{9}{64} + \frac{25}{64} + \frac{49}{64}\right) = \frac{1}{4} \cdot \frac{84}{64} = \frac{21}{64} = 0.328125`)}
      で、差は ${tex(String.raw`-\frac{1}{12 \cdot 16} = -\frac{1}{192} = -0.005208\ldots`)} です。三つの値はどれも有限個の分数の和なので、画面の計算値は厳密な分数の値を小数で表したものです。タブで標本点を替えると、計器と表がこの値に替わります。`,
  ],
  related: [
    { href: './integrate.html', title: '積分して解く', description: '右辺が未知関数を含まない微分方程式を、この定理で積分して解きます。' },
    { href: './numerical-integration.html', title: '数値積分', description: '台形則と Simpson 則で、Riemann 和より速く定積分を近似します。' },
    { href: './integration-techniques.html', title: '置換積分と部分積分', description: 'この定理と微分の公式から導く積分の計算法です。' },
    { href: './mean-value.html', title: '平均値の定理', description: '基本定理の第二の主張の証明に使います。' },
  ],
  footer: 'この画面の計算は、∫₀¹ x² dx の左端、右端、中点の Riemann 和です。',
  proof: writtenProof([
    {
      statement: `（基本定理の第一の主張）${tex('f')} が ${tex('[a, b]')} で連続ならば、${tex(String.raw`F(x) = \int_a^x f(t)\,dt`)} は ${tex('(a, b)')} で微分可能で ${tex(`F'(x) = f(x)`)} です。`,
      proof: [
        `${tex(String.raw`x \in (a, b)`)} と、${tex(String.raw`x + h \in [a, b]`)} となる ${tex(String.raw`h \neq 0`)} をとります。積分の区間についての加法性により
          ${eq(String.raw`F(x + h) - F(x) = \int_a^{x + h} f(t)\,dt - \int_a^x f(t)\,dt = \int_x^{x + h} f(t)\,dt`)}
          です。`,
        `${tex('x')} と ${tex('x + h')} を端とする閉区間で、${tex('f')} の最小値を ${tex('m_h')}、最大値を ${tex('M_h')} とします。最大値・最小値の定理により、これらは存在します。${tex('h > 0')} のとき
          ${eq(String.raw`m_h\,h \le \int_x^{x + h} f(t)\,dt \le M_h\,h`)}
          両辺を ${tex('h > 0')} で割ると
          ${eq(String.raw`m_h \le \frac{F(x + h) - F(x)}{h} \le M_h`)}
          です。`,
        `${tex('h < 0')} のときは ${tex(String.raw`\int_x^{x + h} f(t)\,dt = -\int_{x + h}^{x} f(t)\,dt`)} で、${tex(String.raw`m_h |h| \le \int_{x + h}^{x} f(t)\,dt \le M_h |h|`)} です。${tex(String.raw`|h| = -h`)} で割ると、同じ不等式
          ${eq(String.raw`m_h \le \frac{F(x + h) - F(x)}{h} \le M_h`)}
          が成り立ちます。`,
        `${tex('m_h')} と ${tex('M_h')} は、${tex('x')} との距離が ${tex('|h|')} 以下の点での ${tex('f')} の値です。${tex('f')} は ${tex('x')} で連続なので、${tex(String.raw`h \to 0`)} で ${tex(String.raw`m_h \to f(x)`)}、${tex(String.raw`M_h \to f(x)`)} です。はさみうちの原理により
          ${eq(String.raw`F'(x) = \lim_{h \to 0} \frac{F(x + h) - F(x)}{h} = f(x)`)}
          です。`,
      ],
    },
    {
      statement: `（基本定理の第二の主張）${tex('f')} が ${tex('[a, b]')} で連続で、${tex('G')} が ${tex('[a, b]')} で連続、${tex('(a, b)')} で ${tex(`G' = f`)} を満たすならば、${tex(String.raw`\int_a^b f(x)\,dx = G(b) - G(a)`)} です。`,
      proof: [
        `${tex('H(x) = F(x) - G(x)')} と置きます。${tex('F')} は ${tex('[a, b]')} で連続で、第一の主張により ${tex('(a, b)')} で
          ${eq(String.raw`H'(x) = F'(x) - G'(x) = f(x) - f(x) = 0`)}
          です。`,
        `${tex(String.raw`x \in (a, b]`)} をとり、区間 ${tex('[a, x]')} に平均値の定理を使うと、ある ${tex(String.raw`c \in (a, x)`)} で
          ${eq(String.raw`H(x) - H(a) = H'(c)(x - a) = 0`)}
          です。したがって ${tex('H')} は定数で、${tex('F(a) = 0')} より ${tex('H(x) = H(a) = -G(a)')} です。`,
        `${tex('x = b')} とすると ${tex('F(b) - G(b) = -G(a)')}、すなわち
          ${eq(String.raw`\int_a^b f(x)\,dx = F(b) = G(b) - G(a)`)}
          です。`,
      ],
    },
  ]),
});

let rule: Rule = 'left';
let figure: LessonFigure | undefined;

function table(headers: string[], rows: string[][]): string {
  return `<div class="table-scroll"><table class="value-table"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function paint() {
  if (!figure) return;
  const f = figure;
  const bars = f.bars.map(b => ({ edges: b.x, heights: b.y, role: b.role }));
  const samples = f.points.filter(p => p.name.startsWith('sample-')).map(p => ({ x: p.x, y: p.y, role: p.role }));
  drawPlot(document.getElementById('rect-chart') as HTMLCanvasElement, {
    label: `曲線 y = x² の下の ${N} 本の長方形。標本点は${ruleNames[rule]}。`,
    bars,
    lines: [line(f, 'curve', 'y = x²')],
    dots: samples,
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
  });
  drawPlot(document.getElementById('sum-chart') as HTMLCanvasElement, {
    key: 'riemann-sums',
    label: `分割数 n と${ruleNames[rule]} Riemann 和。実線は計算値、破線は厳密な値 1/3。`,
    lines: [line(f, 'sums'), line(f, 'exact')],
    xMin: 0,
    xMax: 40,
    yMin: 0,
    yMax: 1,
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/fundamental-theorem', { n: N, method: rule });
    const v = figure.values;
    document.getElementById('rule')!.textContent = ruleNames[rule];
    document.getElementById('sum')!.textContent = v.sum.toFixed(6);
    document.getElementById('closed')!.textContent = v.closed.toFixed(6);
    document.getElementById('sum-error')!.textContent = v.error.toFixed(6);
    const a = figure.arrays;
    document.getElementById('sum-table')!.innerHTML = table(
      [tex('n'), `${tex('S_n')}（計算値）`, '和の公式（厳密）', tex(String.raw`S_n - \frac{1}{3}`)],
      a.n.map((n, i) => [String(n), a.sum[i].toFixed(10), a.closed[i].toFixed(10), a.error[i].toExponential(4)]),
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
bindMethodTabs<Rule>(next => {
  rule = next;
  void load();
});
void load();
