import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, vectors, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'partial',
  section: { label: '微分積分' },
  title: '偏微分',
  description: `2変数関数 ${tex('f(x, y)')} の一つの変数だけを動かし、もう一つを定数とみなした変化率を偏導関数と呼びます。${tex('f(x, y) = x^2 + 3xy')} の偏導関数と勾配を定義から求め、中心差分による近似値と比べ、勾配が等高線に垂直であることを確かめます。`,
  equation: [
    String.raw`\frac{\partial f}{\partial x}(a, b) = \lim_{h \to 0} \frac{f(a + h, b) - f(a, b)}{h}`,
    String.raw`\nabla f = \left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)`,
  ],
  equationLabel: '偏導関数の定義と勾配。',
  equationNote: '例 f(x, y) = x² + 3xy',
  studyHeading: '定義から偏導関数と勾配を求める手順',
  steps: [
    `記号を定めます。${tex('f(x, y)')} は平面の領域で定義された2変数関数、${tex('(a, b)')} は点、${tex('h')} は刻みです。${tex(String.raw`\frac{\partial f}{\partial x}`)}（${tex('f_x')} とも書く）は ${tex('y = b')} を固定して ${tex('x')} だけを動かした変化率、${tex(String.raw`\frac{\partial f}{\partial y}`)}（${tex('f_y')}）は ${tex('x = a')} を固定した変化率です。二つを並べたベクトル ${tex(String.raw`\nabla f = (f_x, f_y)`)} を勾配と呼びます。`,
    `${tex('f(x, y) = x^2 + 3xy')} の ${tex('x')} についての差分商を、定義どおりに計算します。
      ${eq(String.raw`f(a + h, b) - f(a, b) = (a + h)^2 + 3(a + h)b - a^2 - 3ab`)}
      ${eq(String.raw`= a^2 + 2ah + h^2 + 3ab + 3bh - a^2 - 3ab`)}
      ${eq(String.raw`= 2ah + h^2 + 3bh`)}
      ${tex('h \\ne 0')} で割ると
      ${eq(String.raw`\frac{f(a + h, b) - f(a, b)}{h} = 2a + 3b + h`)}
      で、${tex('h \\to 0')} の極限は
      ${eq(String.raw`\frac{\partial f}{\partial x}(a, b) = 2a + 3b`)}
      です。`,
    `${tex('y')} についても同じように計算します。
      ${eq(String.raw`f(a, b + h) - f(a, b) = a^2 + 3a(b + h) - a^2 - 3ab = 3ah`)}
      ${eq(String.raw`\frac{f(a, b + h) - f(a, b)}{h} = 3a`)}
      差分商は ${tex('h')} によらないので、極限は
      ${eq(String.raw`\frac{\partial f}{\partial y}(a, b) = 3a`)}
      です。勾配は ${tex(String.raw`\nabla f(x, y) = (2x + 3y,\ 3x)`)} です（${coreDoc('calculus', 'quadratic_field_gradient', '勾配の説明')}）。`,
    `中心差分 ${tex(String.raw`D_x f(a, b) = \frac{f(a + h, b) - f(a - h, b)}{2h}`)} は、関数の値だけから偏導関数を近似します（${coreDoc('calculus', 'central_partial_x', '中心差分の偏導関数の説明')}）。この ${tex('f')} では
      ${eq(String.raw`f(a + h, b) - f(a - h, b) = (a + h)^2 - (a - h)^2 + 3(a + h)b - 3(a - h)b`)}
      ${eq(String.raw`= 4ah + 6bh`)}
      ${eq(String.raw`D_x f(a, b) = \frac{4ah + 6bh}{2h} = 2a + 3b`)}
      です。${tex('h^2')} の項が打ち消し合うので、中心差分は ${tex('x')} について2次の多項式では ${tex('h')} によらず厳密値に一致します。前進差分には差 ${tex('h')} が残ります。${tex('y')} の中心差分も ${tex(String.raw`\frac{3a(b + h) - 3a(b - h)}{2h} = 3a`)} です。`,
    `等高線 ${tex('f(x, y) = c')} を解くと、${tex('x \\ne 0')} では
      ${eq(String.raw`x^2 + 3xy = c,\qquad 3xy = c - x^2,\qquad y = \frac{c - x^2}{3x}`)}
      です（${coreDoc('calculus', 'quadratic_field_level_y', '等高線の説明')}）。${tex(String.raw`y = \frac{c}{3x} - \frac{x}{3}`)} を微分すると、等高線の接線の向きは
      ${eq(String.raw`\left(1,\ \frac{dy}{dx}\right) = \left(1,\ -\frac{c}{3x^2} - \frac{1}{3}\right)`)}
      です。勾配との内積は、${tex(String.raw`3y = \frac{c}{x} - x`)} を使って
      ${eq(String.raw`(2x + 3y) + 3x\left(-\frac{c}{3x^2} - \frac{1}{3}\right) = 2x + 3y - \frac{c}{x} - x = x + \left(\frac{c}{x} - x\right) - \frac{c}{x} = 0`)}
      です。勾配は等高線に垂直です。一般の関数での証明はページの最後にあります。`,
  ],
  figureAlt: '関数 x² + 3xy の等高線と、各点で等高線に垂直に向く勾配の矢印。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">等高線と勾配 ${tex(String.raw`\nabla f`)}</h2><div class="legend"><span><i class="numerical"></i>中心差分による近似</span><span><i class="analytical"></i>厳密な値</span></div></div>
        <div class="plot-pair">
          <div><h3>${tex('f(x, y) = x^2 + 3xy')} の等高線と勾配の向き</h3><canvas id="contour-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。橙の矢印は厳密な勾配の向き（長さはそろえた）、青の矢印は点 ${tex('(1, 2)')} の中心差分の勾配、青緑の破線は点を通る等高線 ${tex('f = 7')} です。灰色の線は ${tex('f = -9, -3, 0, 3, 9')} です。</p></div>
          <div><h3>断面 ${tex('y = 2')} の曲線 ${tex('f(x, 2)')}</h3><canvas id="slice-chart" role="img"></canvas><p>横軸 ${tex('x')}。破線は傾き ${tex('f_x(1, 2) = 8')} の接線、実線は ${tex('x = 0.5')} と ${tex('1.5')} を結ぶ中心差分の割線です。</p></div>
        </div>
        <div class="readouts">
          <div><span>中心差分 ${tex('D_x f(1, 2)')}（近似値）</span><output id="central-x">—</output></div>
          <div><span>中心差分 ${tex('D_y f(1, 2)')}（近似値）</span><output id="central-y">—</output></div>
          <div><span>厳密な勾配 ${tex(String.raw`\nabla f(1, 2)`)}</span><output id="gradient">—</output></div>
          <div><span>前進差分の差 ${tex('D_x^{+} f - f_x')}</span><output id="difference">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="点 (1, 2) における刻みごとの差分">
          <thead><tr><th>刻み ${tex('h')}</th><th>前進差分 ${tex('D_x^{+} f')}</th><th>中心差分 ${tex('D_x f')}</th><th>中心差分 ${tex('D_y f')}</th></tr></thead>
          <tbody id="partial-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `点 ${tex('(a, b) = (1, 2)')} とします。関数の値と偏導関数は
      ${eq(String.raw`f(1, 2) = 1^2 + 3 \cdot 1 \cdot 2 = 7`)}
      ${eq(String.raw`f_x(1, 2) = 2 \cdot 1 + 3 \cdot 2 = 8,\qquad f_y(1, 2) = 3 \cdot 1 = 3`)}
      で、どれも厳密な値です。勾配は ${tex(String.raw`\nabla f(1, 2) = (8, 3)`)} です。`,
    `刻み ${tex('h = 0.1')} の差分を手で計算します。${tex('f(1.1, 2) = 1.21 + 6.6 = 7.81')}、${tex('f(0.9, 2) = 0.81 + 5.4 = 6.21')} なので
      ${eq(String.raw`D_x^{+} f = \frac{7.81 - 7}{0.1} = 8.1,\qquad D_x f = \frac{7.81 - 6.21}{0.2} = \frac{1.6}{0.2} = 8`)}
      です。前進差分の差は ${tex('0.1 = h')}、中心差分は厳密値 8 に一致します。表の値はライブラリが返した値です。`,
    `点を通る等高線は ${tex('f = 7')}、すなわち ${tex(String.raw`y = \frac{7 - x^2}{3x}`)} です。${tex('x = 1')} での傾きは
      ${eq(String.raw`\frac{dy}{dx} = -\frac{7}{3 \cdot 1^2} - \frac{1}{3} = -\frac{8}{3}`)}
      で、接線の向き ${tex(String.raw`(1, -\tfrac{8}{3})`)} と勾配の内積は ${tex(String.raw`8 \cdot 1 + 3 \cdot \left(-\tfrac{8}{3}\right) = 0`)} です。`,
  ],
  related: [
    { href: './derivative-definition.html', title: '微分の定義', description: '1変数の差分商の極限で、偏導関数はこれを一つの変数に当てたものです。' },
    { href: './multiple-integral.html', title: '重積分', description: '2変数関数を、平面の領域の上で積分します。' },
    { href: './potential.html', title: '静電ポテンシャルと電位', description: '電場は電位の勾配に負号を付けたもので、等電位線に垂直です。' },
    { href: './exact.html', title: '完全微分', description: '偏導関数の組が完全微分になる条件から方程式を解きます。' },
  ],
  footer: 'この画面の計算は、2変数関数 x² + 3xy の偏導関数と勾配です。',
  proof: writtenProof([{
    statement: `${tex('f')} の偏導関数 ${tex('f_x')}、${tex('f_y')} が連続で、微分できる曲線 ${tex(String.raw`t \mapsto (x(t), y(t))`)} の上で ${tex('f(x(t), y(t)) = c')}（一定）ならば、
      ${eq(String.raw`\nabla f(x(t), y(t)) \cdot \bigl(x'(t),\ y'(t)\bigr) = 0`)}
      です。すなわち勾配は等高線の接線に垂直です。`,
    proof: [
      `${tex('F(t) = f(x(t), y(t))')} と置きます。刻み ${tex('s \\ne 0')} について、差を二つに分けます。
        ${eq(String.raw`F(t + s) - F(t) = \bigl[f(x(t+s), y(t+s)) - f(x(t), y(t+s))\bigr] + \bigl[f(x(t), y(t+s)) - f(x(t), y(t))\bigr]`)}`,
      `一つめの括弧は ${tex('y = y(t+s)')} を固定した ${tex('x')} の関数の差なので、平均値の定理により ${tex('x(t)')} と ${tex('x(t+s)')} のあいだの点 ${tex(String.raw`\xi_s`)} があって
        ${eq(String.raw`f(x(t+s), y(t+s)) - f(x(t), y(t+s)) = f_x(\xi_s, y(t+s))\,\bigl(x(t+s) - x(t)\bigr)`)}
        です。二つめも同じく、${tex('y(t)')} と ${tex('y(t+s)')} のあいだの点 ${tex(String.raw`\eta_s`)} があって
        ${eq(String.raw`f(x(t), y(t+s)) - f(x(t), y(t)) = f_y(x(t), \eta_s)\,\bigl(y(t+s) - y(t)\bigr)`)}
        です。`,
      `${tex('s')} で割ります。
        ${eq(String.raw`\frac{F(t + s) - F(t)}{s} = f_x(\xi_s, y(t+s))\,\frac{x(t+s) - x(t)}{s} + f_y(x(t), \eta_s)\,\frac{y(t+s) - y(t)}{s}`)}
        ${tex('s \\to 0')} で ${tex(String.raw`\xi_s \to x(t)`)}、${tex(String.raw`\eta_s \to y(t)`)}、${tex('y(t+s) \\to y(t)')} です。${tex('f_x')}、${tex('f_y')} は連続なので
        ${eq(String.raw`F'(t) = f_x(x(t), y(t))\,x'(t) + f_y(x(t), y(t))\,y'(t)`)}
        です。`,
      `${tex('F(t) = c')} は定数なので ${tex("F'(t) = 0")} です。右辺は内積 ${tex(String.raw`\nabla f \cdot (x', y')`)} なので、
        ${eq(String.raw`\nabla f(x(t), y(t)) \cdot \bigl(x'(t),\ y'(t)\bigr) = 0`)}
        です。`,
    ],
  }]),
});

let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  const levels = figure.series.filter(item => item.name.startsWith('level') || item.name.startsWith('through')).map(item => line(figure, item.name));
  drawPlot(document.querySelector<HTMLCanvasElement>('#contour-chart')!, {
    label: '関数 x² + 3xy の等高線と勾配の矢印。',
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
    equalAspect: true,
    lines: levels,
    vectors: [...vectors(figure, 'grad'), ...vectors(figure, 'central')],
    dots: [dot(figure, 'point', '(1, 2)')],
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#slice-chart')!, {
    label: '断面 y = 2 の曲線と、点 x = 1 の接線、中心差分の割線。',
    xMin: -1,
    xMax: 3,
    yMin: -10,
    yMax: 30,
    lines: [line(figure, 'slice'), line(figure, 'slice tangent'), line(figure, 'slice chord')],
    dots: [dot(figure, 'slice left'), dot(figure, 'slice right'), dot(figure, 'slice point', undefined, true)],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('central-x', figure.values.central_x.toFixed(6));
  value('central-y', figure.values.central_y.toFixed(6));
  value('gradient', `(${figure.values.fx}, ${figure.values.fy})`);
  value('difference', figure.values.forward_difference_x.toFixed(6));
  const { steps, forward_x, central_x, central_y } = figure.arrays;
  document.querySelector('#partial-table')!.innerHTML = steps.map((h, i) =>
    `<tr><td>${h}</td><td>${forward_x[i].toFixed(6)}</td><td>${central_x[i].toFixed(6)}</td><td>${central_y[i].toFixed(6)}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('calculus/partial', { a: 1, b: 2, h: 0.1 }));
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
