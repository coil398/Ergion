import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'limits',
  section: { label: '微分積分' },
  title: '極限と連続',
  description: `比 ${tex(String.raw`\frac{\sin x}{x}`)} は ${tex('x = 0')} で定義されませんが、${tex('x')} を 0 に近づけると値は 1 に近づきます。極限の定義に従って、許す誤差 ${tex(String.raw`\varepsilon`)} に対する幅 ${tex(String.raw`\delta`)} を求めます。`,
  equation: [String.raw`\lim_{x \to 0} \frac{\sin x}{x} = 1`, String.raw`\cos x \le \frac{\sin x}{x} \le 1 \quad \left(0 < |x| < \tfrac{\pi}{2}\right)`],
  studyHeading: '極限の定義から幅 δ を求める手順',
  steps: [
    `記号を定めます。${tex('f')} は実数の区間で定義された実関数、${tex('a')} はその区間の点、${tex('L')} は実数です。極限
      ${eq(String.raw`\lim_{x \to a} f(x) = L`)}
      とは、任意の ${tex(String.raw`\varepsilon > 0`)} に対してある ${tex(String.raw`\delta > 0`)} があり、${tex(String.raw`0 < |x - a| < \delta`)} ならば ${tex(String.raw`|f(x) - L| < \varepsilon`)} となることです。${tex(String.raw`\varepsilon`)} は値に許す誤差、${tex(String.raw`\delta`)} は ${tex('x')} を ${tex('a')} に近づける幅です。${tex('f')} が ${tex('a')} で定義されていて ${tex(String.raw`\lim_{x \to a} f(x) = f(a)`)} が成り立つとき、${tex('f')} は ${tex('a')} で連続であるといいます。`,
    `例として ${tex(String.raw`f(x) = \frac{\sin x}{x}`)}、${tex('a = 0')}、${tex('L = 1')} をとります。${tex('x = 0')} では分母が 0 なので、${tex('f(0)')} は定義されません。グラフでは点 ${tex('(0, 1)')} が穴になります。極限は ${tex('x = 0')} での値を使わず、${tex('0 < |x| < \\delta')} の値だけで決まります（${coreDoc('calculus', 'sine_ratio', '比 sin x / x の説明')}）。`,
    `差 ${tex(String.raw`1 - \frac{\sin x}{x}`)} を上から抑えます。関数 ${tex(String.raw`t - \sin t`)} は ${tex('t = 0')} で 0 で、導関数 ${tex(String.raw`1 - \cos t`)} は 0 以上なので減りません。したがって ${tex(String.raw`t \ge 0`)} で ${tex(String.raw`\sin t \le t`)} です。両辺を 0 から ${tex(String.raw`s \ge 0`)} まで積分します。
      ${eq(String.raw`\int_0^s \sin t\,dt \le \int_0^s t\,dt`)}
      ${eq(String.raw`\bigl[-\cos t\bigr]_0^s \le \left[\frac{t^2}{2}\right]_0^s`)}
      ${eq(String.raw`1 - \cos s \le \frac{s^2}{2}`)}
      すなわち ${tex(String.raw`\cos s \ge 1 - \frac{s^2}{2}`)} です。もう一度、0 から ${tex('x > 0')} まで積分します。
      ${eq(String.raw`\int_0^x \cos s\,ds \ge \int_0^x \left(1 - \frac{s^2}{2}\right) ds`)}
      ${eq(String.raw`\bigl[\sin s\bigr]_0^x \ge \left[s - \frac{s^3}{6}\right]_0^x`)}
      ${eq(String.raw`\sin x \ge x - \frac{x^3}{6}`)}
      両辺を ${tex('x > 0')} で割ります。
      ${eq(String.raw`\frac{\sin x}{x} \ge 1 - \frac{x^2}{6}`)}
      ${tex(String.raw`\sin x \le x`)} を ${tex('x > 0')} で割ると ${tex(String.raw`\frac{\sin x}{x} \le 1`)} です。二つを合わせ、各辺を 1 から引くと
      ${eq(String.raw`0 \le 1 - \frac{\sin x}{x} \le \frac{x^2}{6}`)}
      です。${tex(String.raw`\frac{\sin x}{x}`)} と ${tex('x^2')} は偶関数なので、この不等式は ${tex('x < 0')} でも成り立ちます（${coreDoc('calculus', 'sine_ratio_gap_bound', '差の上界の説明')}）。`,
    `${tex(String.raw`\varepsilon > 0`)} に対して ${tex(String.raw`\delta = \sqrt{6\varepsilon}`)} と選びます。${tex(String.raw`0 < |x| < \delta`)} ならば
      ${eq(String.raw`\left|\frac{\sin x}{x} - 1\right| \le \frac{x^2}{6} < \frac{\delta^2}{6} = \frac{6\varepsilon}{6} = \varepsilon`)}
      です。極限の定義の条件が満たされるので、${tex(String.raw`\lim_{x \to 0} \frac{\sin x}{x} = 1`)} です（${coreDoc('calculus', 'sine_ratio_delta', '幅 δ の説明')}）。`,
    `差の大きさを見積もります。${tex(String.raw`\sin h = h - \frac{h^3}{6} + \frac{h^5}{120} - \cdots`)} を ${tex('h')} で割ると
      ${eq(String.raw`1 - \frac{\sin h}{h} = \frac{h^2}{6} - \frac{h^4}{120} + \cdots`)}
      です。${tex('h')} が小さいとき、差はほぼ上界 ${tex(String.raw`\frac{h^2}{6}`)} に等しく、${tex('h')} を ${tex(String.raw`\frac{1}{10}`)} にすると差は約 ${tex(String.raw`\frac{1}{100}`)} になります。`,
    `穴を極限値で埋めた関数
      ${eq(String.raw`F(x) = \begin{cases} \dfrac{\sin x}{x} & (x \neq 0) \\ 1 & (x = 0) \end{cases}`)}
      は、${tex(String.raw`\lim_{x \to 0} F(x) = 1 = F(0)`)} なので ${tex('x = 0')} で連続です。`,
  ],
  figureAlt: '曲線 y = sin x / x の x = 0 の穴と、幅 δ の帯の中で値が 1 ± ε に収まる様子。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">比 ${tex(String.raw`\frac{\sin x}{x}`)} のグラフと幅 ${tex(String.raw`\delta`)} の帯</h2><div class="legend"><span><i class="numerical"></i>sin x / x の値（近似値）</span><span><i class="analytical"></i>極限値 1</span></div></div>
        <div class="plot-pair">
          <div><h3>曲線 ${tex(String.raw`y = \frac{\sin x}{x}`)}</h3><canvas id="curve-chart" role="img"></canvas><p>横軸 ${tex('x')}。白抜きの点は穴 ${tex('(0, 1)')} です。</p></div>
          <div><h3>点 0 の近くの拡大</h3><canvas id="zoom-chart" role="img"></canvas><p>横軸 ${tex('x')}。破線の横線は ${tex(String.raw`1 \pm \varepsilon`)}、縦線は ${tex(String.raw`x = \pm\delta`)} で、${tex(String.raw`\varepsilon = 0.05`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>h = 0.1 の sin h / h（近似値）</span><output id="ratio">—</output></div>
          <div><span>差 1 − sin h / h（近似値）</span><output id="gap">—</output></div>
          <div><span>上界 h² / 6（厳密）</span><output id="bound">—</output></div>
          <div><span>ε = 0.05 の幅 δ = √(6ε)（近似値）</span><output id="delta">—</output></div>
        </div>
        <h3>刻み ${tex('h')} を縮めたときの値（近似値）</h3>
        <div id="ratio-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('h = 0.1')} とします。${tex(String.raw`\sin 0.1 = 0.0998334166\ldots`)}（近似値）なので
      ${eq(String.raw`\frac{\sin 0.1}{0.1} = 0.998334166\ldots,\qquad 1 - \frac{\sin 0.1}{0.1} = 0.001665833\ldots`)}
      で、どちらも近似値です。上界は厳密に ${tex(String.raw`\frac{0.1^2}{6} = \frac{1}{600} = 0.0016666\ldots`)} で、差は上界より小さい値です。`,
    `級数の初めの2項で差を手で確かめます。
      ${eq(String.raw`\frac{h^2}{6} - \frac{h^4}{120} = \frac{0.01}{6} - \frac{0.0001}{120} = 0.0016666667 - 0.0000008333 = 0.0016658333`)}
      小数第10位までの近似値です。これは画面の差 ${tex('0.0016658335')}（近似値）と小数第9位まで一致します。表では ${tex('h')} を ${tex(String.raw`\frac{1}{10}`)} にするごとに差がほぼ ${tex(String.raw`\frac{1}{100}`)} になり、差と上界の比は 1 に近づきます。`,
    `${tex(String.raw`\varepsilon = 0.05`)} とすると、${tex(String.raw`\delta = \sqrt{6 \cdot 0.05} = \sqrt{0.3} = 0.5477\ldots`)}（近似値）です。${tex(String.raw`x = 0.5 < \delta`)} では
      ${eq(String.raw`\frac{\sin 0.5}{0.5} = 0.958851\ldots,\qquad 1 - 0.958851\ldots = 0.041149\ldots < 0.05`)}
      で（小数は近似値）、値は帯 ${tex(String.raw`1 \pm 0.05`)} の中にあります。`,
  ],
  related: [
    { href: './derivative-definition.html', title: '微分の定義' },
    { href: './numerical-differentiation.html', title: '数値微分' },
    { href: './mean-value.html', title: '平均値の定理' },
  ],
  footer: 'この画面の計算は、比 sin x / x の x を 0 に近づけたときの値の列です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`\lim_{x \to 0} \frac{\sin x}{x} = 1`)} です。`,
    proof: [
      `${tex(String.raw`0 < x < \frac{\pi}{2}`)} とします。単位円の中心を ${tex('O')}、点 ${tex('A = (1, 0)')}、${tex(String.raw`P = (\cos x, \sin x)`)}、直線 ${tex('OP')} と直線 ${tex('X = 1')} の交点を ${tex(String.raw`T = (1, \tan x)`)} とします。三角形 ${tex('OAP')} は扇形 ${tex('OAP')} に含まれ、扇形 ${tex('OAP')} は三角形 ${tex('OAT')} に含まれるので、面積を比べて
        ${eq(String.raw`\frac{1}{2}\cdot 1 \cdot \sin x \le \frac{1}{2}\cdot 1^2 \cdot x \le \frac{1}{2}\cdot 1 \cdot \tan x`)}
        です。`,
      `各辺に 2 を掛けると ${tex(String.raw`\sin x \le x \le \tan x`)} です。${tex(String.raw`\sin x > 0`)} で割ると
        ${eq(String.raw`1 \le \frac{x}{\sin x} \le \frac{1}{\cos x}`)}
        です。各辺は正なので、逆数をとると不等号の向きが変わり
        ${eq(String.raw`\cos x \le \frac{\sin x}{x} \le 1`)}
        です。`,
      `${tex(String.raw`-\frac{\pi}{2} < x < 0`)} では ${tex(String.raw`0 < -x < \frac{\pi}{2}`)} です。${tex(String.raw`\cos(-x) = \cos x`)}、${tex(String.raw`\frac{\sin(-x)}{-x} = \frac{\sin x}{x}`)} なので、同じ不等式が成り立ちます。`,
      `${tex(String.raw`\cos`)} は 0 で連続で ${tex(String.raw`\cos 0 = 1`)} なので、任意の ${tex(String.raw`\varepsilon > 0`)} に対してある ${tex(String.raw`\delta_1 > 0`)} があり、${tex(String.raw`|x| < \delta_1`)} ならば ${tex(String.raw`\cos x > 1 - \varepsilon`)} です。`,
      `${tex(String.raw`\delta = \min\left(\delta_1, \frac{\pi}{2}\right)`)} とします。${tex(String.raw`0 < |x| < \delta`)} ならば
        ${eq(String.raw`1 - \varepsilon < \cos x \le \frac{\sin x}{x} \le 1 < 1 + \varepsilon`)}
        なので ${tex(String.raw`\left|\frac{\sin x}{x} - 1\right| < \varepsilon`)} です。これは極限の定義そのものであり、${tex(String.raw`\lim_{x \to 0} \frac{\sin x}{x} = 1`)} です。この議論を、下の関数と上の関数が同じ極限をもつときに挟まれた関数も同じ極限をもつという、はさみうちの原理と呼びます。`,
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
  drawPlot(document.getElementById('curve-chart') as HTMLCanvasElement, {
    label: '曲線 y = sin x / x。実線はライブラリが計算した値、破線は極限値 1。',
    lines: [line(f, 'limit'), line(f, 'curve')],
    dots: [dot(f, 'hole', undefined, true)],
    xMin: -12,
    xMax: 12,
    yMin: -0.4,
    yMax: 1.2,
    zeroLabel: 'y = 0',
  });
  drawPlot(document.getElementById('zoom-chart') as HTMLCanvasElement, {
    label: '点 0 の近くの sin x / x と、幅 δ と 1 ± ε の帯。',
    lines: [line(f, 'upper'), line(f, 'lower'), line(f, 'left-edge'), line(f, 'right-edge'), line(f, 'zoom'), line(f, 'inside', 'sin x / x')],
    dots: [dot(f, 'hole', undefined, true)],
    xMin: -1.2,
    xMax: 1.2,
    yMin: 0.8,
    yMax: 1.12,
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/limits', { epsilon: 0.05 });
    const v = figure.values;
    document.getElementById('ratio')!.textContent = v.ratio.toFixed(10);
    document.getElementById('gap')!.textContent = v.gap.toFixed(10);
    document.getElementById('bound')!.textContent = v.bound.toFixed(10);
    document.getElementById('delta')!.textContent = v.delta.toFixed(6);
    const a = figure.arrays;
    document.getElementById('ratio-table')!.innerHTML = table(
      [tex('h'), tex(String.raw`\frac{\sin h}{h}`), tex(String.raw`1 - \frac{\sin h}{h}`), tex(String.raw`\frac{h^2}{6}`), '差と上界の比'],
      a.h.map((h, i) => [String(h), a.ratio[i].toFixed(12), a.gap[i].toExponential(6), a.bound[i].toExponential(6), a.share[i].toFixed(6)]),
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
