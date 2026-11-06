import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Difference = 'forward' | 'central';

renderLesson({
  id: 'numerical-differentiation',
  section: { label: '微分積分' },
  title: '数値微分',
  description: `導関数の式を使わず、関数の値だけから微分係数を近似します。${tex(String.raw`f(x) = \sin x`)} の ${tex('x = 1')} における前進差分と中心差分を、厳密値 ${tex(String.raw`\cos 1`)} と比べ、刻み ${tex('h')} に対する誤差の減り方を両対数のグラフで確かめます。`,
  equation: [
    String.raw`D_+ f(x) = \frac{f(x + h) - f(x)}{h}`,
    String.raw`D_0 f(x) = \frac{f(x + h) - f(x - h)}{2h}`,
  ],
  equationNote: '打ち切り誤差は O(h) と O(h²)',
  studyHeading: 'Taylor 展開から誤差の大きさを求める手順',
  steps: [
    `記号を定めます。${tex('f')} は ${tex('x')} の近くで3回微分できる関数、${tex('h > 0')} は刻み、${tex('D_+ f(x)')} は前進差分、${tex('D_0 f(x)')} は中心差分です。どちらも導関数 ${tex("f'(x)")} の近似値です。差 ${tex("D f(x) - f'(x)")} を誤差と呼びます。`,
    `前進差分の誤差を、Taylor の定理（剰余項は Lagrange 形）から求めます。${tex('x')} と ${tex('x + h')} のあいだの点 ${tex(String.raw`\xi`)} があって
      ${eq(String.raw`f(x + h) = f(x) + h f'(x) + \frac{h^2}{2} f''(\xi)`)}
      です。${tex('f(x)')} を移項して ${tex('h')} で割ると
      ${eq(String.raw`\frac{f(x + h) - f(x)}{h} = f'(x) + \frac{h}{2} f''(\xi)`)}
      です。${tex('h \\to 0')} で ${tex(String.raw`\xi \to x`)} なので ${tex(String.raw`f''(\xi) \to f''(x)`)} で、誤差の主要項は ${tex(String.raw`\frac{h}{2} f''(x)`)}、${tex('h')} の1次です（${coreDoc('calculus', 'forward_difference', '前進差分の説明')}）。`,
    `中心差分では、${tex('x + h')} と ${tex('x - h')} の二つの展開を使います。
      ${eq(String.raw`f(x + h) = f(x) + h f'(x) + \frac{h^2}{2} f''(x) + \frac{h^3}{6} f'''(\xi_+)`)}
      ${eq(String.raw`f(x - h) = f(x) - h f'(x) + \frac{h^2}{2} f''(x) - \frac{h^3}{6} f'''(\xi_-)`)}
      上から下を引くと、${tex('f(x)')} と ${tex("f''(x)")} の項が消えます。
      ${eq(String.raw`f(x + h) - f(x - h) = 2h f'(x) + \frac{h^3}{6}\bigl(f'''(\xi_+) + f'''(\xi_-)\bigr)`)}
      ${tex('2h')} で割ると
      ${eq(String.raw`\frac{f(x + h) - f(x - h)}{2h} = f'(x) + \frac{h^2}{12}\bigl(f'''(\xi_+) + f'''(\xi_-)\bigr)`)}
      です。${tex('h \\to 0')} で ${tex(String.raw`\xi_\pm \to x`)} なので
      ${eq(String.raw`\frac{h^2}{12}\bigl(f'''(\xi_+) + f'''(\xi_-)\bigr) \approx \frac{h^2}{12}\cdot 2 f'''(x) = \frac{h^2}{6} f'''(x)`)}
      で、誤差の主要項は ${tex(String.raw`\frac{h^2}{6} f'''(x)`)}、${tex('h')} の2次です（${coreDoc('calculus', 'central_difference', '中心差分の説明')}）。`,
    `${tex(String.raw`f(x) = \sin x`)} では ${tex(String.raw`f'' = -\sin x`)}、${tex(String.raw`f''' = -\cos x`)} なので、${tex('x = 1')} での主要項は
      ${eq(String.raw`\frac{h}{2} f''(1) = -\frac{h}{2}\sin 1,\qquad \frac{h^2}{6} f'''(1) = -\frac{h^2}{6}\cos 1`)}
      です（${coreDoc('calculus', 'forward_difference_leading_error', '前進差分の主要項の説明')}、${coreDoc('calculus', 'central_difference_leading_error', '中心差分の主要項の説明')}）。常用対数をとると
      ${eq(String.raw`\log_{10}\left|\frac{h}{2}\sin 1\right| = \log_{10} h + \log_{10}\frac{\sin 1}{2}`)}
      ${eq(String.raw`\log_{10}\left|\frac{h^2}{6}\cos 1\right| = 2\log_{10} h + \log_{10}\frac{\cos 1}{6}`)}
      で、両対数のグラフでは傾き 1 と傾き 2 の直線です。`,
    `${tex('h')} を小さくしすぎると、誤差は増えます。関数の値は相対的に ${tex(String.raw`\varepsilon \approx 1.1 \times 10^{-16}`)} 程度の丸めを含み、差 ${tex('f(x + h) - f(x)')} に残るその大きさ ${tex(String.raw`\varepsilon |f(x)|`)} が ${tex('h')} で割られるからです。前進差分の誤差の大きさを
      ${eq(String.raw`E(h) = \frac{h}{2}|f''(x)| + \frac{\varepsilon |f(x)|}{h}`)}
      と見積もると、
      ${eq(String.raw`E'(h) = \frac{|f''(x)|}{2} - \frac{\varepsilon |f(x)|}{h^2} = 0,\qquad h = \sqrt{\frac{2\varepsilon |f(x)|}{|f''(x)|}}`)}
      で、${tex(String.raw`\sin 1 = |f''(1)| = |f(1)|`)} より ${tex(String.raw`h = \sqrt{2\varepsilon} \approx 1.5 \times 10^{-8}`)} で最小です。中心差分では ${tex(String.raw`\frac{h^2}{6}|f'''| + \frac{\varepsilon |f|}{h}`)} を同じように最小にして ${tex(String.raw`h = (3\varepsilon |f| / |f'''|)^{1/3} \approx 8 \times 10^{-6}`)} です。グラフの谷は、この見積もりに近い位置にあります。`,
  ],
  figureAlt: '刻み h に対する前進差分と中心差分の誤差の両対数グラフは、傾き 1 と 2 の直線を示し、h が小さい側で誤差が増え始める。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">差分による微分係数 ${tex(String.raw`D f(1)`)} と誤差</h2><div class="legend"><span><i class="numerical"></i>選んだ差分</span><span><i class="analytical"></i>厳密な接線</span></div></div>
        ${methodTabs('微分係数の近似の方法', [{ id: 'forward', label: '前進差分' }, { id: 'central', label: '中心差分' }])}
        <div class="plot-pair">
          <div><h3>曲線 ${tex(String.raw`y = \sin x`)} の割線と接線</h3><canvas id="chord-chart" role="img"></canvas><p>横軸 ${tex('x')}。実線は刻み ${tex('h = 0.5')} の割線、破線は傾き ${tex(String.raw`\cos 1`)} の接線です。</p></div>
          <div><h3>誤差 ${tex(String.raw`|D f(1) - \cos 1|`)} と刻み ${tex('h')}</h3><canvas id="error-chart" role="img"></canvas><p>横軸 ${tex(String.raw`\log_{10} h`)}、縦軸 ${tex(String.raw`\log_{10}|D f(1) - \cos 1|`)}。破線は誤差の主要項、灰色の実線はもう一方の差分です。</p></div>
        </div>
        <div class="readouts">
          <div><span>差分 ${tex('D f(1)')}（${tex('h = 0.1')}、近似値）</span><output id="value">—</output></div>
          <div><span>厳密値 ${tex(String.raw`\cos 1`)} の小数（近似値）</span><output id="exact">—</output></div>
          <div><span>誤差の主要項（近似値）</span><output id="leading">—</output></div>
          <div><span>差 ${tex(String.raw`D f(1) - \cos 1`)}（近似値）</span><output id="difference">—</output></div>
        </div>
        <p>${tex(String.raw`h = 10^{-1}`)} から ${tex(String.raw`10^{-3}`)} までの傾き <output id="slope">—</output>、誤差が最小になる刻み ${tex('h')} = <output id="valley">—</output>（いずれも近似値）</p>
        <div class="table-scroll"><table class="value-table" aria-label="刻みごとの差分と誤差">
          <thead><tr><th>刻み ${tex('h')}</th><th>${tex('D f(1)')}（近似値）</th><th>差 ${tex(String.raw`D f(1) - \cos 1`)}（近似値）</th><th>主要項（近似値）</th></tr></thead>
          <tbody id="difference-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('x = 1')}、${tex('h = 0.1')} とします。関数の値は ${tex(String.raw`\sin 0.9 \approx 0.7833269`)}、${tex(String.raw`\sin 1 \approx 0.8414710`)}、${tex(String.raw`\sin 1.1 \approx 0.8912074`)} で、厳密値は ${tex(String.raw`\cos 1 \approx 0.540302`)} です（いずれも近似値）。`,
    `前進差分は
      ${eq(String.raw`D_+ f(1) = \frac{0.8912074 - 0.8414710}{0.1} = \frac{0.0497364}{0.1} = 0.497364`)}
      で、7桁の値で差をとると ${tex(String.raw`0.4973638 - 0.5403023 = -0.0429385`)} です。主要項 ${tex(String.raw`-\frac{0.1}{2}\cdot 0.841471 = -0.042074`)} と、上2桁が一致します（いずれも近似値）。`,
    `中心差分は
      ${eq(String.raw`D_0 f(1) = \frac{0.8912074 - 0.7833269}{0.2} = \frac{0.1078805}{0.2} = 0.539402`)}
      で、差は ${tex(String.raw`0.539402 - 0.540302 = -0.000900`)} です。主要項 ${tex(String.raw`-\frac{0.01}{6}\cdot 0.540302 = -0.000901`)} とよく一致します（いずれも近似値）。刻みを ${tex('1/10')} にすると、前進差分の差は約 ${tex('1/10')}、中心差分の差は約 ${tex('1/100')} になります。画面の計器と表は、ライブラリが返した値です。`,
  ],
  related: [
    { href: './derivative-definition.html', title: '微分の定義' },
    { href: './taylor.html', title: 'Taylor 展開' },
    { href: './euler.html', title: 'Euler法' },
    { href: './potential.html', title: '静電ポテンシャルと電位' },
  ],
  footer: 'この画面の計算は、sin x の x = 1 における前進差分と中心差分です。',
  proof: writtenProof([
    {
      statement: `${tex('f')} が ${tex('[x, x + h]')} を含む開区間で2回微分できるならば、${tex('x')} と ${tex('x + h')} のあいだの点 ${tex(String.raw`\xi`)} があって
        ${eq(String.raw`D_+ f(x) - f'(x) = \frac{h}{2} f''(\xi)`)}
        です。`,
      proof: [
        `Taylor の定理を ${tex('n = 1')}、展開の中心 ${tex('x')}、点 ${tex('x + h')} に当てると
          ${eq(String.raw`f(x + h) = f(x) + f'(x)\,h + \frac{f''(\xi)}{2!} h^2`)}
          です。`,
        `${tex('f(x)')} を左辺へ移し、${tex('h')} で割ると
          ${eq(String.raw`\frac{f(x + h) - f(x)}{h} = f'(x) + \frac{h}{2} f''(\xi)`)}
          ${eq(String.raw`D_+ f(x) - f'(x) = \frac{h}{2} f''(\xi)`)}
          です。`,
      ],
    },
    {
      statement: `${tex('f')} が ${tex('[x - h, x + h]')} を含む開区間で3回微分でき、${tex("f'''")} が連続ならば、${tex('x - h')} と ${tex('x + h')} のあいだの点 ${tex(String.raw`\xi`)} があって
        ${eq(String.raw`D_0 f(x) - f'(x) = \frac{h^2}{6} f'''(\xi)`)}
        です。したがって ${tex("|f'''| \\le M_3")} ならば ${tex(String.raw`|D_0 f(x) - f'(x)| \le \frac{M_3}{6} h^2`)} です。`,
      proof: [
        `Taylor の定理を ${tex('n = 2')} で、点 ${tex('x + h')} と ${tex('x - h')} に当てます。${tex(String.raw`\xi_+ \in (x, x + h)`)}、${tex(String.raw`\xi_- \in (x - h, x)`)} があって
          ${eq(String.raw`f(x + h) = f(x) + f'(x)\,h + \frac{f''(x)}{2} h^2 + \frac{f'''(\xi_+)}{6} h^3`)}
          ${eq(String.raw`f(x - h) = f(x) - f'(x)\,h + \frac{f''(x)}{2} h^2 - \frac{f'''(\xi_-)}{6} h^3`)}
          です。`,
        `上の式から下の式を引きます。
          ${eq(String.raw`f(x + h) - f(x - h) = 2 f'(x)\,h + \frac{f'''(\xi_+) + f'''(\xi_-)}{6} h^3`)}
          ${tex('2h')} で割ると
          ${eq(String.raw`D_0 f(x) = f'(x) + \frac{h^2}{6}\cdot\frac{f'''(\xi_+) + f'''(\xi_-)}{2}`)}
          です。`,
        `二つの値の平均 ${tex(String.raw`\frac{f'''(\xi_+) + f'''(\xi_-)}{2}`)} は、${tex(String.raw`f'''(\xi_-)`)} と ${tex(String.raw`f'''(\xi_+)`)} のあいだの数です。${tex("f'''")} は連続なので、中間値の定理により ${tex(String.raw`\xi_-`)} と ${tex(String.raw`\xi_+`)} のあいだの点 ${tex(String.raw`\xi`)} でこの値をとります。
          ${eq(String.raw`D_0 f(x) - f'(x) = \frac{h^2}{6} f'''(\xi)`)}
          絶対値をとり ${tex(String.raw`|f'''(\xi)| \le M_3`)} を使うと、上界が得られます。`,
      ],
    },
  ]),
});

let method: Difference = 'forward';
let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  drawPlot(document.querySelector<HTMLCanvasElement>('#chord-chart')!, {
    label: '曲線 sin x と、x = 1 の接線、刻み 0.5 の割線。',
    xMin: 0,
    xMax: 2,
    yMin: -0.5,
    yMax: 1.5,
    lines: [line(figure, 'sine', 'sin x'), line(figure, 'tangent'), line(figure, 'chord')],
    dots: [dot(figure, 'left'), dot(figure, 'right'), dot(figure, 'touch', undefined, true)],
  });
  const valley = figure.points.find(item => item.name === 'valley')!;
  drawPlot(document.querySelector<HTMLCanvasElement>('#error-chart')!, {
    label: '刻み h の常用対数に対する誤差の常用対数。実線は選んだ差分、破線は主要項。',
    xMin: -16,
    xMax: 0,
    yMin: -14,
    yMax: 2,
    lines: [line(figure, 'log_other'), line(figure, 'log_leading'), line(figure, 'log_error')],
    dots: [{ x: valley.x, y: valley.y, role: 'numerical', label: '谷' }],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('value', figure.values.value.toFixed(6));
  value('exact', figure.values.exact.toFixed(6));
  value('leading', figure.values.leading.toFixed(6));
  value('difference', figure.values.difference.toFixed(6));
  value('slope', figure.values.slope.toFixed(3));
  value('valley', figure.values.valley_h.toExponential(1));
  const a = figure.arrays;
  document.querySelector('#difference-table')!.innerHTML = a.table_h.map((h, i) =>
    `<tr><td>${h.toExponential(0)}</td><td>${a.table_value[i].toFixed(12)}</td><td>${a.table_difference[i].toExponential(3)}</td><td>${a.table_leading[i].toExponential(3)}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('calculus/numerical-differentiation', { method, h: 0.1, x: 1 }));
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

bindMethodTabs<Difference>(next => {
  method = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
