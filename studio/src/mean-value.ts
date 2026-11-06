import { coreDoc, coreStepDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'mean-value',
  section: { label: '微分積分' },
  title: '平均値の定理',
  description: `閉区間で連続、開区間で微分可能な関数には、端点を結ぶ割線と平行な接線をもつ点 ${tex('c')} があります。${tex('f(x) = x^3')}、区間 ${tex('[0, 2]')} の点 ${tex('c')} を、厳密な式とニュートン法の近似値で求めます。`,
  equation: [String.raw`f'(c) = \frac{f(b) - f(a)}{b - a} \quad (a < c < b)`, String.raw`c_{n+1} = c_n - \frac{f'(c_n) - m}{f''(c_n)}`],
  studyHeading: '平均の傾きから点 c への手順',
  steps: [
    `記号を定めます。${tex('f')} は閉区間 ${tex('[a, b]')} で連続、開区間 ${tex('(a, b)')} で微分可能な実関数です。平均の傾き
      ${eq(String.raw`m = \frac{f(b) - f(a)}{b - a}`)}
      は、端点 ${tex('(a, f(a))')} と ${tex('(b, f(b))')} を結ぶ割線の傾きです（${coreDoc('calculus', 'mean_slope', '平均の傾きの説明')}）。平均値の定理は、${tex(`f'(c) = m`)} となる ${tex(String.raw`c \in (a, b)`)} があることを述べます。点 ${tex('(c, f(c))')} の接線は割線と平行です。`,
    `例として ${tex('f(x) = x^3')}、${tex('[a, b] = [0, 2]')} をとります。平均の傾きは
      ${eq(String.raw`m = \frac{2^3 - 0^3}{2 - 0} = \frac{8}{2} = 4`)}
      です。${tex(`f'(x) = 3x^2`)} なので、条件 ${tex(`f'(c) = m`)} は
      ${eq(String.raw`3c^2 = 4`)}
      ${eq(String.raw`c^2 = \frac{4}{3}`)}
      ${eq(String.raw`c = \frac{2}{\sqrt{3}} = 1.154700\ldots`)}
      です。${tex(String.raw`\frac{2}{\sqrt{3}}`)} は厳密な値、${tex(String.raw`1.154700\ldots`)} は近似値です。負の根 ${tex(String.raw`-\frac{2}{\sqrt{3}}`)} は区間 ${tex('(0, 2)')} にありません（${coreDoc('calculus', 'cube_mean_value_point', '点 c の厳密な式の説明')}）。`,
    `同じ点 ${tex('c')} をニュートン法で求めます。${tex(`g(c) = f'(c) - m = 3c^2 - 4`)} と置くと、${tex('c')} は ${tex('g(c) = 0')} の根で、${tex(`g'(c) = f''(c) = 6c`)} です。ニュートン法の1回の更新は
      ${eq(String.raw`c_{n+1} = c_n - \frac{g(c_n)}{g'(c_n)} = c_n - \frac{3c_n^2 - 4}{6c_n}`)}
      です（${coreStepDoc('newton_step', 'ニュートン法の1回の更新の説明')}）。右辺の分数を二つに分けます。
      ${eq(String.raw`\frac{3c_n^2 - 4}{6c_n} = \frac{3c_n^2}{6c_n} - \frac{4}{6c_n} = \frac{c_n}{2} - \frac{2}{3c_n}`)}
      これを代入して整理すると
      ${eq(String.raw`c_{n+1} = c_n - \frac{c_n}{2} + \frac{2}{3c_n} = \frac{c_n}{2} + \frac{2}{3c_n}`)}
      です（${coreDoc('calculus', 'mean_value_newton', '点 c の反復の説明')}）。`,
    `出発点は区間の中点 ${tex('c_0 = 1')} とします。根 ${tex(String.raw`2/\sqrt{3}`)} は ${tex('g')} の単純な根なので、近似値と根の差は反復ごとにおよそ2乗になり、正しい桁の数がほぼ倍になります。`,
    `求めた点 ${tex('c')} の接線は
      ${eq(String.raw`y = f(c) + m(x - c)`)}
      割線は
      ${eq(String.raw`y = f(a) + m(x - a)`)}
      で、傾きはどちらも ${tex('m = 4')} です（${coreDoc('calculus', 'point_slope_line', '直線の式の説明')}）。`,
  ],
  figureAlt: '曲線 y = x³ の端点を結ぶ割線と、それに平行な点 c の接線。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">割線と平行な接線、点 ${tex('c')} のニュートン法</h2><div class="legend"><span><i class="numerical"></i>ニュートン法の近似値</span><span><i class="analytical"></i>厳密な c = 2/√3</span></div></div>
        <div class="plot-pair">
          <div><h3>曲線 ${tex('y = x^3')} の割線と接線</h3><canvas id="mvt-chart" role="img"></canvas><p>横軸 ${tex('x')}。灰色の線は端点を結ぶ割線、青の線は点 ${tex('c_4')} の接線です。</p></div>
          <div><h3>${tex(String.raw`g(c) = 3c^2 - 4`)} の根への反復</h3><canvas id="newton-chart" role="img"></canvas><p>横軸 ${tex('c')}。青の線分は接線、破線の縦線は根 ${tex(String.raw`2/\sqrt{3}`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>平均の傾き m（厳密）</span><output id="slope">—</output></div>
          <div><span>ニュートン法の c₄（近似値）</span><output id="c">—</output></div>
          <div><span>厳密な c = 2/√3</span><output id="c-exact">—</output></div>
          <div><span>差 c₄ − 2/√3（近似値）</span><output id="c-error">—</output></div>
        </div>
        <h3>ニュートン法の反復 ${tex('c_n')}（近似値）</h3>
        <div id="newton-table"></div>
        <p id="error" role="alert" hidden></p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('c_0 = 1')} から更新式 ${tex(String.raw`c_{n+1} = \frac{c_n}{2} + \frac{2}{3c_n}`)} を分数のまま計算します。分数は厳密な値、小数は近似値です。
      ${eq(String.raw`c_1 = \frac{1}{2} + \frac{2}{3} = \frac{3 + 4}{6} = \frac{7}{6} = 1.166667\ldots`)}`,
    `${eq(String.raw`c_2 = \frac{7}{12} + \frac{2}{3 \cdot 7/6} = \frac{7}{12} + \frac{2}{7/2} = \frac{7}{12} + \frac{4}{7} = \frac{49 + 48}{84} = \frac{97}{84} = 1.154762\ldots`)}`,
    `${eq(String.raw`c_3 = \frac{97}{168} + \frac{2}{3 \cdot 97/84} = \frac{97}{168} + \frac{2}{97/28} = \frac{97}{168} + \frac{56}{97} = \frac{9409 + 9408}{16296} = \frac{18817}{16296} = 1.15470054\ldots`)}
      厳密な ${tex(String.raw`c = 2/\sqrt{3}`)} の近似値 ${tex(String.raw`1.15470053\ldots`)} との差は、${tex('c_1')} で約 ${tex('0.012')}、${tex('c_2')} で約 ${tex(String.raw`6.1 \times 10^{-5}`)}、${tex('c_3')} で約 ${tex(String.raw`1.6 \times 10^{-9}`)} です。画面の表の値と一致します。`,
    `確かめとして、${tex(String.raw`c^2 = \frac{4}{3}`)} より ${tex(String.raw`f'(c) = 3c^2 = 3 \cdot \frac{4}{3} = 4 = m`)} です。${tex(String.raw`c = 1.1547\ldots`)}（近似値）は区間 ${tex('(0, 2)')} の中にあります。`,
  ],
  related: [
    { href: './newton.html', title: 'ニュートン法' },
    { href: './limits.html', title: '極限と連続' },
    { href: './fundamental-theorem.html', title: '定積分と微分積分学の基本定理' },
    { href: './taylor.html', title: 'Taylor 展開' },
  ],
  footer: 'この画面の計算は、x³ の区間 [0, 2] での平均値の定理の点 c です。',
  proof: writtenProof([
    {
      statement: `（Rolle の定理）${tex('f')} が ${tex('[a, b]')} で連続、${tex('(a, b)')} で微分可能で、${tex('f(a) = f(b)')} ならば、${tex(`f'(c) = 0`)} となる ${tex(String.raw`c \in (a, b)`)} があります。`,
      proof: [
        `最大値・最小値の定理により、連続関数 ${tex('f')} は閉区間 ${tex('[a, b]')} で最大値 ${tex('M')} と最小値 ${tex(String.raw`\mu`)} をとります。`,
        `${tex(String.raw`M = \mu`)} ならば ${tex('f')} は定数で、すべての ${tex(String.raw`c \in (a, b)`)} で ${tex(`f'(c) = 0`)} です。`,
        `${tex(String.raw`M > \mu`)} ならば、${tex('M')} と ${tex(String.raw`\mu`)} の少なくとも一方は端点の値 ${tex('f(a) = f(b)')} と異なり、その値をとる点 ${tex('c')} は開区間 ${tex('(a, b)')} にあります。${tex('f(c) = M')} の場合、${tex('c + h \\in [a, b]')} となる ${tex('h')} について ${tex(String.raw`f(c + h) - f(c) \le 0`)} です。`,
        `${tex('h > 0')} では差分商は 0 以下、${tex('h < 0')} では 0 以上です。
          ${eq(String.raw`\frac{f(c + h) - f(c)}{h} \le 0 \quad (h > 0),\qquad \frac{f(c + h) - f(c)}{h} \ge 0 \quad (h < 0)`)}
          ${tex('f')} は ${tex('c')} で微分可能なので、二つの片側極限はどちらも ${tex(`f'(c)`)} です。したがって ${tex(String.raw`f'(c) \le 0`)} かつ ${tex(String.raw`f'(c) \ge 0`)}、すなわち ${tex(`f'(c) = 0`)} です。${tex(String.raw`f(c) = \mu`)} の場合は不等号の向きが逆になるだけです。`,
      ],
    },
    {
      statement: `（平均値の定理）${tex('f')} が ${tex('[a, b]')} で連続、${tex('(a, b)')} で微分可能ならば、${tex(String.raw`f'(c) = \frac{f(b) - f(a)}{b - a}`)} となる ${tex(String.raw`c \in (a, b)`)} があります。`,
      proof: [
        `${tex(String.raw`m = \frac{f(b) - f(a)}{b - a}`)} とし、関数から割線を引いた差を定めます。
          ${eq(String.raw`\varphi(x) = f(x) - f(a) - m(x - a)`)}`,
        `端点の値を計算します。
          ${eq(String.raw`\varphi(a) = f(a) - f(a) - m \cdot 0 = 0`)}
          ${eq(String.raw`\varphi(b) = f(b) - f(a) - \frac{f(b) - f(a)}{b - a}(b - a) = f(b) - f(a) - \bigl(f(b) - f(a)\bigr) = 0`)}`,
        `${tex(String.raw`\varphi`)} は ${tex('[a, b]')} で連続、${tex('(a, b)')} で微分可能で、${tex(String.raw`\varphi'(x) = f'(x) - m`)} です。`,
        `Rolle の定理により ${tex(String.raw`\varphi'(c) = 0`)} となる ${tex(String.raw`c \in (a, b)`)} があります。
          ${eq(String.raw`f'(c) - m = 0, \qquad f'(c) = \frac{f(b) - f(a)}{b - a}`)}`,
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
  drawPlot(document.getElementById('mvt-chart') as HTMLCanvasElement, {
    label: '曲線 y = x³ と、端点を結ぶ割線、点 c の接線。実線の青はニュートン法の c、破線は厳密な c の接線。',
    lines: [line(f, 'curve', 'y = x³'), line(f, 'secant'), line(f, 'tangent'), line(f, 'tangent-exact')],
    dots: [dot(f, 'left'), dot(f, 'right'), dot(f, 'c', 'c')],
    xMin: -0.2,
    xMax: 2.2,
    yMin: -2,
    yMax: 10,
    zeroLabel: 'y = 0',
  });
  const steps = f.series.filter(s => /^(newton|rise)-/.test(s.name)).map(s => ({ x: s.x, y: s.y, role: s.role }));
  const iterates = f.points.filter(p => p.name.startsWith('iterate-')).map(p => ({ x: p.x, y: p.y, role: p.role }));
  drawPlot(document.getElementById('newton-chart') as HTMLCanvasElement, {
    label: '関数 g(c) = 3c² − 4 と、ニュートン法の接線の反復。破線は根 2/√3。',
    lines: [line(f, 'g', 'g(c)'), line(f, 'root'), ...steps],
    dots: iterates,
    xMin: 0.8,
    xMax: 1.6,
    yMin: -4,
    yMax: 4,
    zeroLabel: 'g = 0',
  });
}

async function load() {
  try {
    figure = await lessonFigure('calculus/mean-value', { a: 0, b: 2, c0: 1, steps: 4 });
    const v = figure.values;
    document.getElementById('slope')!.textContent = v.slope.toFixed(6);
    document.getElementById('c')!.textContent = v.c.toFixed(12);
    document.getElementById('c-exact')!.textContent = v.c_exact.toFixed(12);
    document.getElementById('c-error')!.textContent = v.error.toExponential(2);
    const a = figure.arrays;
    document.getElementById('newton-table')!.innerHTML = table(
      [tex('n'), tex('c_n'), tex(String.raw`c_n - 2/\sqrt{3}`)],
      a.iterates.map((c, i) => [String(i), c.toFixed(12), a.error[i].toExponential(4)]),
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
