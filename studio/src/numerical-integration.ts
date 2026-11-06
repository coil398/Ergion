import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Rule = 'trapezoid' | 'simpson';

renderLesson({
  id: 'numerical-integration',
  section: { label: '微分積分' },
  title: '数値積分',
  description: `閉区間 ${tex('[a, b]')} を ${tex('n')} 等分し、各小区間で関数を直線または放物線に置き換えて定積分を近似します。${tex(String.raw`\int_0^\pi \sin x\,dx = 2`)} を台形則と Simpson 則で計算し、分割数を2倍にしたときの誤差の比が約 ${tex(String.raw`\frac{1}{4}`)} と約 ${tex(String.raw`\frac{1}{16}`)} になることを確かめます。`,
  equation: [
    String.raw`T_n = \frac{h}{2}\sum_{i=0}^{n-1}\bigl(f_i + f_{i+1}\bigr)`,
    String.raw`S_n = \frac{h}{3}\sum_{j=0}^{n/2-1}\bigl(f_{2j} + 4f_{2j+1} + f_{2j+2}\bigr)`,
  ],
  equationNote: '誤差は O(h²) と O(h⁴)',
  studyHeading: '台形則と Simpson 則の導き方',
  steps: [
    `記号を定めます。${tex('f')} は ${tex('[a, b]')} で連続な関数、${tex('n')} は分割数、${tex('h = (b - a)/n')} は刻み、${tex('x_i = a + ih')}（${tex('i = 0, 1, \\ldots, n')}）は節点、${tex('f_i = f(x_i)')} は節点での値です。${tex('T_n')} と ${tex('S_n')} は積分 ${tex(String.raw`I = \int_a^b f(x)\,dx`)} の近似値です。`,
    `台形則では、小区間 ${tex('[x_i, x_{i+1}]')} で ${tex('f')} を両端を結ぶ直線に置き換えます。その下の面積は、高さ ${tex('h')}、上底 ${tex('f_i')}、下底 ${tex('f_{i+1}')} の台形の面積です。
      ${eq(String.raw`\int_{x_i}^{x_{i+1}} f(x)\,dx \approx \frac{h}{2}\bigl(f_i + f_{i+1}\bigr)`)}
      ${tex('i = 0')} から ${tex('n - 1')} まで足すと、両端の値は1回、内側の値は2回ずつ現れます。
      ${eq(String.raw`T_n = \frac{h}{2}\bigl[(f_0 + f_1) + (f_1 + f_2) + \cdots + (f_{n-1} + f_n)\bigr]`)}
      ${eq(String.raw`= \frac{h}{2}\bigl[f_0 + 2f_1 + \cdots + 2f_{n-1} + f_n\bigr]`)}
      ${eq(String.raw`= h\left[\frac{f_0}{2} + f_1 + \cdots + f_{n-1} + \frac{f_n}{2}\right]`)}
      です（${coreDoc('calculus', 'trapezoid_rule', '台形則の説明')}）。`,
    `Simpson 則では、${tex('n')} を偶数とし、隣り合う2区間 ${tex('[x_{2j}, x_{2j+2}]')} で ${tex('f')} を3点を通る放物線に置き換えます。${tex('s = (x - x_{2j})/h')} と置くと、放物線は
      ${eq(String.raw`p(x) = f_{2j}\,\frac{(s - 1)(s - 2)}{2} - f_{2j+1}\,s(s - 2) + f_{2j+2}\,\frac{s(s - 1)}{2}`)}
      です（${coreDoc('calculus', 'simpson_parabola', '3点を通る放物線の説明')}）。${tex('dx = h\\,ds')} で、${tex('x')} が ${tex('x_{2j}')} から ${tex('x_{2j+2}')} まで動くとき ${tex('s')} は 0 から 2 まで動きます。三つの係数を展開して積分すると
      ${eq(String.raw`\int_0^2 \frac{(s - 1)(s - 2)}{2}\,ds = \frac{1}{2}\int_0^2 (s^2 - 3s + 2)\,ds = \frac{1}{2}\left[\frac{s^3}{3} - \frac{3s^2}{2} + 2s\right]_0^2 = \frac{1}{2}\left(\frac{8}{3} - 6 + 4\right) = \frac{1}{2}\cdot\frac{2}{3} = \frac{1}{3}`)}
      ${eq(String.raw`\int_0^2 s(s - 2)\,ds = \int_0^2 (s^2 - 2s)\,ds = \left[\frac{s^3}{3} - s^2\right]_0^2 = \frac{8}{3} - 4 = -\frac{4}{3}`)}
      ${eq(String.raw`\int_0^2 \frac{s(s - 1)}{2}\,ds = \frac{1}{2}\int_0^2 (s^2 - s)\,ds = \frac{1}{2}\left[\frac{s^3}{3} - \frac{s^2}{2}\right]_0^2 = \frac{1}{2}\left(\frac{8}{3} - 2\right) = \frac{1}{2}\cdot\frac{2}{3} = \frac{1}{3}`)}
      です。中央の項には符号 ${tex('-')} が付くので、その係数は ${tex(String.raw`-\left(-\frac{4}{3}\right) = \frac{4}{3}`)} です。したがって
      ${eq(String.raw`\int_{x_{2j}}^{x_{2j+2}} p(x)\,dx = h\left(\frac{f_{2j}}{3} + \frac{4 f_{2j+1}}{3} + \frac{f_{2j+2}}{3}\right) = \frac{h}{3}\bigl(f_{2j} + 4 f_{2j+1} + f_{2j+2}\bigr)`)}
      です。${tex('j = 0')} から ${tex('n/2 - 1')} まで足すと、奇数番号の値は係数 4、内側の偶数番号の値は隣り合う二つの組に2回現れて係数 2 となります。
      ${eq(String.raw`S_n = \frac{h}{3}\left[f_0 + 4\!\!\sum_{i\ \text{奇数}}\!\! f_i + 2\!\!\sum_{\substack{i\ \text{偶数}\\ 0 < i < n}}\!\! f_i + f_n\right]`)}
      です（${coreDoc('calculus', 'simpson_rule', 'Simpson 則の説明')}）。`,
    `例の厳密値は、${tex(String.raw`(-\cos x)' = \sin x`)} より
      ${eq(String.raw`\int_0^\pi \sin x\,dx = \bigl[-\cos x\bigr]_0^\pi = -\cos\pi + \cos 0 = 1 + 1 = 2`)}
      です。`,
    `${tex('f')} が十分に滑らかならば、誤差は ${tex(String.raw`\xi \in [a, b]`)} を用いて
      ${eq(String.raw`I - T_n = -\frac{(b - a) h^2}{12} f''(\xi),\qquad I - S_n = -\frac{(b - a) h^4}{180} f^{(4)}(\xi)`)}
      です。台形則の式の証明はページの最後にあります。${tex('n')} を2倍にすると ${tex('h')} は半分になるので、誤差の比は
      ${eq(String.raw`\frac{(h/2)^2}{h^2} = \frac{1}{4},\qquad \frac{(h/2)^4}{h^4} = \frac{1}{16}`)}
      に近づきます（${coreDoc('calculus', 'doubling_ratios', '誤差の比の説明')}）。${tex(String.raw`\log_{10} n`)} に対する ${tex(String.raw`\log_{10}|\text{誤差}|`)} のグラフは、傾き ${tex('-2')} と ${tex('-4')} の直線です。${tex(String.raw`\sin`)} では ${tex(String.raw`|f''| \le 1`)}、${tex(String.raw`|f^{(4)}| \le 1`)} なので、誤差の上界は ${tex(String.raw`\frac{\pi h^2}{12}`)} と ${tex(String.raw`\frac{\pi h^4}{180}`)} です（${coreDoc('calculus', 'trapezoid_error_bound', '台形則の誤差の上界の説明')}、${coreDoc('calculus', 'simpson_error_bound', 'Simpson 則の誤差の上界の説明')}）。`,
  ],
  figureAlt: '曲線 sin x の下を台形で覆う図と、分割数に対する台形則と Simpson 則の誤差の両対数グラフ。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">${tex(String.raw`\int_0^\pi \sin x\,dx`)} の近似と誤差</h2><div class="legend"><span><i class="numerical"></i>近似に使う直線・放物線</span><span><i class="analytical"></i>厳密な被積分関数 sin x</span></div></div>
        ${methodTabs('数値積分の方法', [{ id: 'trapezoid', label: '台形則' }, { id: 'simpson', label: 'Simpson 則' }])}
        <div class="plot-pair">
          <div><h3>${tex('n = 4')} の区間で置き換えた曲線</h3><canvas id="area-chart" role="img"></canvas><p>横軸 ${tex('x')}。塗った領域の面積の和が近似値です。</p></div>
          <div><h3>誤差 ${tex(String.raw`|\text{近似値} - 2|`)} と分割数 ${tex('n')}</h3><canvas id="error-chart" role="img"></canvas><p>横軸 ${tex(String.raw`\log_{10} n`)}、縦軸 ${tex(String.raw`\log_{10}|\text{誤差}|`)}。破線は誤差の上界、灰色の実線はもう一方の方法です。</p></div>
        </div>
        <div class="readouts">
          <div><span>近似値（${tex('n = 4')}）</span><output id="approx">—</output></div>
          <div><span>誤差の上界（近似値）</span><output id="bound">—</output></div>
          <div><span>誤差の比 ${tex('e_8 / e_4')}（近似値）</span><output id="ratio">—</output></div>
          <div><span>差 近似値 ${tex('- 2')}（近似値）</span><output id="difference">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="分割数ごとの近似値、差、誤差の比">
          <thead><tr><th>分割数 ${tex('n')}</th><th>近似値</th><th>差 ${tex('e_n')} = 近似値 ${tex('- 2')}（近似値）</th><th>比 ${tex('e_n / e_{n/2}')}（近似値）</th></tr></thead>
          <tbody id="integration-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('n = 4')} とします。${tex(String.raw`h = \pi/4`)}、節点は ${tex(String.raw`0, \frac{\pi}{4}, \frac{\pi}{2}, \frac{3\pi}{4}, \pi`)}、値は ${tex(String.raw`0, \frac{\sqrt{2}}{2}, 1, \frac{\sqrt{2}}{2}, 0`)} です。`,
    `台形則は
      ${eq(String.raw`T_4 = \frac{\pi}{4}\left[\frac{0}{2} + \frac{\sqrt{2}}{2} + 1 + \frac{\sqrt{2}}{2} + \frac{0}{2}\right] = \frac{\pi}{4}\bigl(1 + \sqrt{2}\bigr) \approx 1.896119`)}
      で、差は ${tex(String.raw`1.896119 - 2 = -0.103881`)} です。上界 ${tex(String.raw`\frac{\pi}{12}\left(\frac{\pi}{4}\right)^2 = \frac{\pi^3}{192} \approx 0.161491`)} より小さい値です。`,
    `Simpson 則は
      ${eq(String.raw`S_4 = \frac{\pi}{12}\left[0 + 4\left(\frac{\sqrt{2}}{2} + \frac{\sqrt{2}}{2}\right) + 2 \cdot 1 + 0\right] = \frac{\pi}{12}\bigl(2 + 4\sqrt{2}\bigr) \approx 2.004560`)}
      で、差は ${tex('0.004560')} です。`,
    `${tex('n = 8')} では台形則の差が ${tex('-0.025768')}、Simpson 則の差が ${tex('0.000269')} で、比は
      ${eq(String.raw`\frac{-0.025768}{-0.103881} \approx 0.248,\qquad \frac{0.000269}{0.004560} \approx 0.059`)}
      です。それぞれ ${tex(String.raw`\frac{1}{4} = 0.25`)} と ${tex(String.raw`\frac{1}{16} = 0.0625`)} に近く、表の大きな ${tex('n')} ではさらに近づきます。式の値 ${tex(String.raw`\frac{\pi}{4}(1 + \sqrt{2})`)} と ${tex(String.raw`\frac{\pi}{12}(2 + 4\sqrt{2})`)} は厳密で、小数は近似値です。`,
  ],
  related: [
    { href: './fundamental-theorem.html', title: '定積分と微分積分学の基本定理' },
    { href: './integrate.html', title: '積分して解く' },
    { href: './midpoint.html', title: '中点法' },
    { href: './rk4.html', title: '古典的RK4' },
    { href: './monte-carlo.html', title: 'Monte Carlo 法' },
  ],
  footer: 'この画面の計算は、sin x の 0 から π までの定積分の台形則と Simpson 則です。',
  proof: writtenProof([{
    statement: `${tex('f')} が ${tex('[a, b]')} で2回微分でき、${tex("f''")} が連続ならば、ある ${tex(String.raw`\xi \in [a, b]`)} があって
      ${eq(String.raw`\int_a^b f(x)\,dx - T_n = -\frac{(b - a) h^2}{12} f''(\xi)`)}
      です。したがって ${tex("|f''| \\le M_2")} ならば ${tex(String.raw`\left|\int_a^b f\,dx - T_n\right| \le \frac{(b - a) h^2}{12} M_2`)} です。`,
    proof: [
      `一つの小区間 ${tex('[x_i, x_i + h]')} を考え、${tex(String.raw`\varphi(t) = f(x_i + t)`)}（${tex('0 \\le t \\le h')}）と置きます。小区間の誤差は
        ${eq(String.raw`E_i = \int_0^h \varphi(t)\,dt - \frac{h}{2}\bigl(\varphi(0) + \varphi(h)\bigr)`)}
        です。`,
      `${tex(String.raw`\int_0^h t(h - t)\,\varphi''(t)\,dt`)} を部分積分します。${tex('t(h - t)')} の導関数は ${tex('h - 2t')} で、${tex('t = 0, h')} で ${tex('t(h - t) = 0')} です。
        ${eq(String.raw`\int_0^h t(h - t)\,\varphi''(t)\,dt = \bigl[t(h - t)\,\varphi'(t)\bigr]_0^h - \int_0^h (h - 2t)\,\varphi'(t)\,dt = -\int_0^h (h - 2t)\,\varphi'(t)\,dt`)}
        もう一度部分積分します。${tex('h - 2t')} の導関数は ${tex('-2')} です。
        ${eq(String.raw`\int_0^h (h - 2t)\,\varphi'(t)\,dt = \bigl[(h - 2t)\,\varphi(t)\bigr]_0^h + 2\int_0^h \varphi(t)\,dt = -h\varphi(h) - h\varphi(0) + 2\int_0^h \varphi(t)\,dt`)}
        したがって
        ${eq(String.raw`\int_0^h t(h - t)\,\varphi''(t)\,dt = h\bigl(\varphi(0) + \varphi(h)\bigr) - 2\int_0^h \varphi(t)\,dt`)}
        です。両辺を ${tex('-2')} で割ると
        ${eq(String.raw`E_i = -\frac{1}{2}\int_0^h t(h - t)\,\varphi''(t)\,dt`)}
        です。`,
      `${tex('[0, h]')} で ${tex('t(h - t) \\ge 0')} です。${tex("\\varphi''")} の最小値を ${tex('m')}、最大値を ${tex('M')} とすると
        ${eq(String.raw`m\int_0^h t(h - t)\,dt \le \int_0^h t(h - t)\,\varphi''(t)\,dt \le M\int_0^h t(h - t)\,dt`)}
        で、${tex("\\varphi''")} は連続なので、中間値の定理によりある ${tex(String.raw`\tau \in [0, h]`)} で
        ${eq(String.raw`\int_0^h t(h - t)\,\varphi''(t)\,dt = \varphi''(\tau)\int_0^h t(h - t)\,dt`)}
        です。重みの積分は
        ${eq(String.raw`\int_0^h t(h - t)\,dt = \frac{h \cdot h^2}{2} - \frac{h^3}{3} = \frac{h^3}{6}`)}
        なので、${tex(String.raw`\eta_i = x_i + \tau \in [x_i, x_{i+1}]`)} として
        ${eq(String.raw`E_i = -\frac{1}{2}\cdot\frac{h^3}{6}\,f''(\eta_i) = -\frac{h^3}{12} f''(\eta_i)`)}
        です。`,
      `${tex('n')} 個の小区間について足します。
        ${eq(String.raw`\int_a^b f(x)\,dx - T_n = \sum_{i=0}^{n-1} E_i = -\frac{h^3}{12}\sum_{i=0}^{n-1} f''(\eta_i) = -\frac{n h^3}{12}\cdot\frac{1}{n}\sum_{i=0}^{n-1} f''(\eta_i)`)}
        平均 ${tex(String.raw`\frac{1}{n}\sum f''(\eta_i)`)} は ${tex("f''")} の ${tex('[a, b]')} での最小値と最大値のあいだにあるので、中間値の定理によりある ${tex(String.raw`\xi \in [a, b]`)} で ${tex(String.raw`f''(\xi)`)} に等しくなります。${tex('nh = b - a')} を代入すると
        ${eq(String.raw`\int_a^b f(x)\,dx - T_n = -\frac{(b - a) h^2}{12} f''(\xi)`)}
        です。絶対値をとり ${tex(String.raw`|f''(\xi)| \le M_2`)} を使うと、上界が得られます。`,
    ],
  }]),
});

let method: Rule = 'trapezoid';
let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  const nodes = figure.points.filter(item => item.name.startsWith('node')).map(item => ({ x: item.x, y: item.y, role: item.role }));
  drawPlot(document.querySelector<HTMLCanvasElement>('#area-chart')!, {
    label: `曲線 sin x と、${method === 'trapezoid' ? '台形' : '放物線'}で置き換えた n = 4 の近似。`,
    xMin: 0,
    xMax: Math.PI,
    yMin: 0,
    yMax: 1.2,
    polygons: figure.polygons.map(item => ({ x: item.x, y: item.y })),
    lines: [line(figure, 'approximant'), line(figure, 'integrand', 'sin x')],
    dots: nodes,
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#error-chart')!, {
    label: '分割数 n の常用対数に対する誤差の常用対数。実線は選んだ方法、破線は上界。',
    xMin: 0,
    xMax: 3,
    yMin: -12,
    yMax: 4,
    lines: [line(figure, 'log_other'), line(figure, 'log_bound'), line(figure, 'log_error')],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('approx', figure.values.approx.toFixed(6));
  value('bound', figure.values.bound.toFixed(6));
  value('ratio', figure.values.ratio.toFixed(4));
  value('difference', figure.values.difference.toFixed(6));
  const a = figure.arrays;
  document.querySelector('#integration-table')!.innerHTML = a.table_n.map((n, i) =>
    `<tr><td>${n}</td><td>${a.table_approx[i].toFixed(12)}</td><td>${a.table_difference[i].toExponential(3)}</td><td>${i === 0 ? '—' : a.table_ratio[i - 1].toFixed(4)}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('calculus/numerical-integration', { method, n: 4 }));
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

bindMethodTabs<Rule>(next => {
  method = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
