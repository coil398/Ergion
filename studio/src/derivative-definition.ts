import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'derivative-definition',
  section: { label: '微分積分' },
  title: '微分の定義',
  description: `関数の2点を結ぶ割線の傾き、すなわち差分商の、刻み ${tex('h')} を 0 に近づけたときの極限として導関数を定めます。${tex('f(x) = x^2')} では差分商が ${tex('2a + h')} と整理でき、極限は ${tex('2a')} です。`,
  equation: [String.raw`f'(a) = \lim_{h \to 0} \frac{f(a + h) - f(a)}{h}`, String.raw`\frac{(a + h)^2 - a^2}{h} = 2a + h`],
  equationLabel: '点 a における導関数は、差分商の h を 0 に近づけたときの極限。',
  studyHeading: '差分商から導関数への手順',
  steps: [
    `記号を定めます。${tex('f')} は点 ${tex('a')} の近くで定義された実関数、${tex(String.raw`h \neq 0`)} は刻みです。差分商
      ${eq(String.raw`\frac{f(a + h) - f(a)}{h}`)}
      は、曲線 ${tex('y = f(x)')} 上の2点 ${tex('(a, f(a))')} と ${tex('(a + h, f(a + h))')} を結ぶ割線の傾きです。${tex(String.raw`h \to 0`)} の極限が存在するとき、${tex('f')} は ${tex('a')} で微分可能であるといい、極限 ${tex(`f'(a)`)} を ${tex('a')} における微分係数と呼びます。${tex('a')} の関数とみた ${tex(`f'`)} が導関数です。`,
    `例として ${tex('f(x) = x^2')} をとります。${tex('f(a + h)')} を展開します。
      ${eq(String.raw`f(a + h) = (a + h)^2 = a^2 + 2ah + h^2`)}
      ${tex('f(a) = a^2')} を引きます。
      ${eq(String.raw`f(a + h) - f(a) = a^2 + 2ah + h^2 - a^2 = 2ah + h^2`)}
      ${tex(String.raw`h \neq 0`)} なので ${tex('h')} で割れます。
      ${eq(String.raw`\frac{f(a + h) - f(a)}{h} = \frac{2ah + h^2}{h} = 2a + h`)}
      です（${coreDoc('calculus', 'square_difference_quotient', '差分商を整理した式の説明')}）。`,
    `極限をとります。差分商と ${tex('2a')} の差は
      ${eq(String.raw`\left|\frac{f(a + h) - f(a)}{h} - 2a\right| = |(2a + h) - 2a| = |h|`)}
      です。任意の ${tex(String.raw`\varepsilon > 0`)} に対して ${tex(String.raw`\delta = \varepsilon`)} とすると、${tex(String.raw`0 < |h| < \delta`)} ならば差は ${tex(String.raw`\varepsilon`)} より小さくなります。したがって
      ${eq(String.raw`f'(a) = \lim_{h \to 0} (2a + h) = 2a`)}
      です。`,
    `点 ${tex('(a, f(a))')} を通り傾き ${tex(`f'(a)`)} の直線を接線と呼びます（${coreDoc('calculus', 'point_slope_line', '直線の式の説明')}）。
      ${eq(String.raw`y = f(a) + f'(a)(x - a) = a^2 + 2a(x - a) = 2ax - a^2`)}
      割線の傾き ${tex('2a + h')} は ${tex(String.raw`h \to 0`)} で接線の傾き ${tex('2a')} に近づき、割線は接線に近づきます。`,
    `画面の差分商は、定義の式 ${tex(String.raw`\frac{f(a + h) - f(a)}{h}`)} をそのまま計算した近似値です（${coreDoc('calculus', 'forward_difference', '差分商の計算の説明')}）。${tex('x^2')} では、この値から ${tex('2a')} を引いた差は厳密には ${tex('h')} で、刻みに比例して小さくなります。`,
  ],
  figureAlt: '曲線 y = x² 上の2点を結ぶ割線が、刻み h を縮めるにつれて接線へ近づく様子。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">割線と接線、差分商と刻み ${tex('h')}</h2><div class="legend"><span><i class="numerical"></i>割線と差分商（計算値）</span><span><i class="analytical"></i>接線と厳密な式 2a + h</span></div></div>
        <div class="plot-pair">
          <div><h3>曲線 ${tex('y = x^2')} の割線と接線</h3><canvas id="secant-chart" role="img"></canvas><p>横軸 ${tex('x')}。割線の刻みは ${tex('h = 1, 0.5, 0.25')}、点 ${tex('a = 1')} です。</p></div>
          <div><h3>差分商と刻み ${tex('h')}</h3><canvas id="quotient-chart" role="img"></canvas><p>横軸 ${tex('h')}。白抜きの点は極限値 ${tex(`f'(1) = 2`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>導関数 f′(1) = 2a（厳密）</span><output id="slope">—</output></div>
          <div><span>h = 0.1 の差分商（近似値）</span><output id="quotient">—</output></div>
          <div><span>差 差分商 − f′(1)（近似値）</span><output id="gap">—</output></div>
        </div>
        <h3>刻み ${tex('h')} を縮めたときの差分商</h3>
        <div id="quotient-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('a = 1')}、${tex('h = 0.1')} とします。定義の式に代入すると
      ${eq(String.raw`\frac{(1 + 0.1)^2 - 1^2}{0.1} = \frac{1.21 - 1}{0.1} = \frac{0.21}{0.1} = 2.1`)}
      で、整理した式 ${tex(String.raw`2a + h = 2 + 0.1 = 2.1`)} と一致します。導関数は厳密に ${tex(`f'(1) = 2`)} で、差は ${tex('0.1')} です。`,
    `${tex('h = 0.01')} では
      ${eq(String.raw`\frac{1.01^2 - 1}{0.01} = \frac{1.0201 - 1}{0.01} = \frac{0.0201}{0.01} = 2.01`)}
      で、差は ${tex('0.01')} です。表の差は、刻み ${tex('h')} と同じ値になっています。`,
    `${tex('h = 1')} の割線は2点 ${tex('(1, 1)')} と ${tex('(2, 4)')} を通り、傾きは ${tex(String.raw`\frac{4 - 1}{2 - 1} = 3`)}、式は ${tex('y = 3x - 2')} です。接線は ${tex('y = 2x - 1')} です。`,
  ],
  related: [
    { href: './derivative.html', title: '位置の時間微分', description: '速度を、位置の時間についての導関数として定めます。' },
    { href: './limits.html', title: '極限と連続', description: '差分商の極限に使う ε-δ の定義です。' },
    { href: './numerical-differentiation.html', title: '数値微分', description: '極限をとらずに、差分商で導関数を近似したときの誤差です。' },
    { href: './product-chain.html', title: '積の微分と合成関数の微分', description: 'この定義から、積と合成の導関数の公式を導きます。' },
  ],
  footer: 'この画面の計算は、関数 x² の点 a = 1 における差分商の列です。',
  proof: writtenProof([{
    statement: `${tex('f')} が点 ${tex('a')} で微分可能ならば、${tex('f')} は ${tex('a')} で連続です。`,
    proof: [
      `${tex(String.raw`h \neq 0`)} に対して、次の等式が成り立ちます。
        ${eq(String.raw`f(a + h) - f(a) = \frac{f(a + h) - f(a)}{h} \cdot h`)}`,
      `${tex(String.raw`h \to 0`)} のとき、第1因子は微分可能性により ${tex(`f'(a)`)} に、第2因子は 0 に近づきます。極限の積は積の極限なので
        ${eq(String.raw`\lim_{h \to 0} \bigl(f(a + h) - f(a)\bigr) = f'(a) \cdot 0 = 0`)}
        です。`,
      `${tex('x = a + h')} と置くと ${tex(String.raw`\lim_{x \to a} f(x) = f(a)`)} です。これは ${tex('f')} が ${tex('a')} で連続であることの定義です。`,
      `逆は成り立ちません。${tex('f(x) = |x|')} は ${tex('x = 0')} で連続ですが、差分商 ${tex(String.raw`\frac{|h| - 0}{h}`)} は ${tex('h > 0')} で 1、${tex('h < 0')} で ${tex('-1')} なので、${tex(String.raw`h \to 0`)} の極限は存在しません。`,
    ],
  }]),
});

let figure: LessonFigure | undefined;

function table(headers: string[], rows: string[][]): string {
  return `<div class="table-scroll"><table class="value-table"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function paint() {
  if (!figure) return;
  const f = figure;
  const secants = f.series.filter(s => s.name.startsWith('secant-')).map(s => ({ x: s.x, y: s.y, role: s.role }));
  const ends = f.points.filter(p => p.name.startsWith('end-')).map(p => ({ x: p.x, y: p.y, role: p.role }));
  drawPlot(document.getElementById('secant-chart') as HTMLCanvasElement, {
    label: '曲線 y = x² と、点 a = 1 からの割線と接線。実線は割線、破線は接線。',
    lines: [line(f, 'curve', 'y = x²'), ...secants, line(f, 'tangent')],
    dots: [dot(f, 'a', 'a'), ...ends],
    xMin: 0,
    xMax: 2.4,
    yMin: -1,
    yMax: 7,
    zeroLabel: 'y = 0',
  });
  drawPlot(document.getElementById('quotient-chart') as HTMLCanvasElement, {
    label: '刻み h と差分商。実線は計算した差分商、破線は厳密な式 2a + h。',
    lines: [line(f, 'quotient'), line(f, 'quotient-exact')],
    dots: [dot(f, 'limit', "f′(1) = 2", true)],
    xMin: -0.1,
    xMax: 1.1,
    yMin: 1.9,
    yMax: 3.1,
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/derivative-definition', { a: 1 });
    const v = figure.values;
    document.getElementById('slope')!.textContent = v.slope.toFixed(6);
    document.getElementById('quotient')!.textContent = v.quotient.toFixed(6);
    document.getElementById('gap')!.textContent = v.gap.toFixed(6);
    const a = figure.arrays;
    document.getElementById('quotient-table')!.innerHTML = table(
      [tex('h'), '差分商（計算値）', `${tex('2a + h')}（厳密）`, `差分商 ${tex('-\\, 2a')}`],
      a.h.map((h, i) => [String(h), a.quotient[i].toFixed(10), a.simplified[i].toFixed(10), a.gap[i].toExponential(6)]),
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
