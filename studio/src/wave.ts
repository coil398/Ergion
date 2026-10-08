import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'ode/wave',
  length: 1,
  speed: 0.25,
  cells: 100,
  pluck: 0.5,
  height: 1,
  dt: 0.032,
  steps: 250,
};

renderLesson({
  id: 'wave',
  section: { label: '微分方程式', href: './ode.html' },
  title: '波動方程式',
  description: `両端を固定した長さ ${tex('L')} の弦を一点でつまみ上げて放すと、変位 ${tex('u(x, t)')} は左右へ進む二つの波に分かれ、端で符号を変えて反射します。d'Alembert の解と固有振動の重ね合わせで厳密解を導き、中心差分法の格子の近似解と比べます。`,
  equation: [
    String.raw`\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}`,
    String.raw`u(x, t) = \tfrac{1}{2}\left[F(x - ct) + F(x + ct)\right]`,
  ],
  equationLabel: '波動方程式。u の時間についての2階微分は c の2乗掛ける u の x についての2階微分。',
  equationNote: '両端固定 u(0, t) = u(L, t) = 0、F は初期形の奇周期拡張',
  studyHeading: "d'Alembert の解、固有振動、中心差分法",
  steps: [
    `記号を定めます。${tex('x')} は弦の上の位置（${tex(String.raw`0 \le x \le L`)}）、${tex('t')} は時刻、${tex('u(x, t)')} は弦の横の変位、${tex('c > 0')} は波の伝わる速さです。張力を ${tex('T')}、線密度を ${tex(String.raw`\mu`)} とすると ${tex(String.raw`c = \sqrt{T/\mu}`)} です。境界条件は ${tex('u(0, t) = u(L, t) = 0')}、初期条件は ${tex('u(x, 0) = f(x)')}、${tex('u_t(x, 0) = 0')} です。このページの ${tex('f')} は、位置 ${tex('p')} を高さ ${tex('h')} につまみ上げた三角形
      ${eq(String.raw`f(x) = \begin{cases} h\,x/p & (0 \le x \le p) \\ h\,(L - x)/(L - p) & (p \le x \le L) \end{cases}`)}
      です（${coreDoc('differential', 'plucked_string', '初期形の説明')}）。`,
    `変数を ${tex(String.raw`\xi = x - ct`)}、${tex(String.raw`\eta = x + ct`)} に替えます。合成関数の微分により
      ${eq(String.raw`u_x = u_\xi + u_\eta,\qquad u_{xx} = u_{\xi\xi} + 2u_{\xi\eta} + u_{\eta\eta}`)}
      ${eq(String.raw`u_t = -c\,u_\xi + c\,u_\eta,\qquad u_{tt} = c^2\left(u_{\xi\xi} - 2u_{\xi\eta} + u_{\eta\eta}\right)`)}
      です。引くと
      ${eq(String.raw`u_{tt} - c^2 u_{xx} = -4c^2 u_{\xi\eta} = 0`)}
      で、${tex(String.raw`u_{\xi\eta} = 0`)} を ${tex(String.raw`\eta`)}、${tex(String.raw`\xi`)} の順に積分すると、一般解は ${tex(String.raw`u = P(\xi) + Q(\eta) = P(x - ct) + Q(x + ct)`)} です。${tex('P')} は右へ、${tex('Q')} は左へ速さ ${tex('c')} で進む波です。`,
    `初期条件から ${tex('P')} と ${tex('Q')} を決めます。
      ${eq(String.raw`u(x, 0) = P(x) + Q(x) = f(x)`)}
      ${eq(String.raw`u_t(x, 0) = -c\,P'(x) + c\,Q'(x) = 0`)}
      第2式から ${tex('Q - P')} は定数で、その定数は ${tex('P')} と ${tex('Q')} に振り分けて 0 にできます。第1式と合わせて ${tex(String.raw`P = Q = f/2`)} です。したがって
      ${eq(String.raw`u(x, t) = \tfrac{1}{2}\left[f(x - ct) + f(x + ct)\right]`)}
      です。`,
    `${tex('x - ct')} や ${tex('x + ct')} は区間 ${tex('[0, L]')} の外に出るので、${tex('f')} を奇関数として周期 ${tex('2L')} に拡張した ${tex('F')} を使います。${tex('F(-s) = -F(s)')}、${tex('F(s + 2L) = F(s)')} です。左端では
      ${eq(String.raw`u(0, t) = \tfrac{1}{2}\left[F(-ct) + F(ct)\right] = \tfrac{1}{2}\left[-F(ct) + F(ct)\right] = 0`)}
      右端では ${tex('F(L + ct) = F(ct - L) = -F(L - ct)')} なので
      ${eq(String.raw`u(L, t) = \tfrac{1}{2}\left[F(L - ct) + F(L + ct)\right] = 0`)}
      です。端に着いた波は、奇関数の拡張により符号を変えて戻ります（${coreDoc('differential', 'wave_dalembert', "d'Alembert の解の説明")}）。この解は打ち切りのない厳密解です。`,
    `同じ解を固有振動の和でも書けます。${tex('u = X(x)T(t)')} と置くと ${tex(String.raw`X'' + k^2 X = 0`)}、${tex('X(0) = X(L) = 0')}、${tex(String.raw`T'' + c^2 k^2 T = 0`)} で、${tex(String.raw`k = n\pi/L`)} です。初速度 0 なので
      ${eq(String.raw`u(x, t) = \sum_{n=1}^\infty B_n \sin\frac{n\pi x}{L}\cos\frac{n\pi c t}{L},\qquad B_n = \frac{2hL^2}{\pi^2 n^2 p(L - p)}\sin\frac{n\pi p}{L}`)}
      です（${coreDoc('differential', 'plucked_mode_coefficient', '係数の説明')}）。積和の公式 ${tex(String.raw`\sin a\cos b = \frac{1}{2}[\sin(a - b) + \sin(a + b)]`)} を各項に使うと、d'Alembert の解の形 ${tex(String.raw`\frac{1}{2}[F(x - ct) + F(x + ct)]`)} になります。どのモードも周期 ${tex('2L/c')} の整数分の1で振動するので、解は周期 ${tex('2L/c')} で初期形に戻ります。`,
    `格子 ${tex(String.raw`x_j = j\Delta x`)}、${tex(String.raw`t_n = n\Delta t`)} を置き、${tex('u_{tt}')} と ${tex('u_{xx}')} をどちらも中心差分で置きます。
      ${eq(String.raw`\frac{u_j^{n+1} - 2u_j^n + u_j^{n-1}}{\Delta t^2} = c^2\,\frac{u_{j+1}^n - 2u_j^n + u_{j-1}^n}{\Delta x^2}`)}
      ${tex(String.raw`\Delta t^2`)} を掛けて移項すると、中心差分法（leapfrog）
      ${eq(String.raw`u_j^{n+1} = 2u_j^n - u_j^{n-1} + C^2\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right),\qquad C = \frac{c\,\Delta t}{\Delta x}`)}
      です（${coreDoc('differential', 'leapfrog_step', '中心差分法の説明')}）。最初の1ステップは、初速度 0 の中心差分 ${tex('u_j^{1} = u_j^{-1}')} を入れた
      ${eq(String.raw`u_j^1 = u_j^0 + \frac{C^2}{2}\left(u_{j+1}^0 - 2u_j^0 + u_{j-1}^0\right)`)}
      です（${coreDoc('differential', 'leapfrog_start', '最初の1ステップの説明')}）。`,
    `安定性を調べます。${tex(String.raw`u_j^n = G^n\sin(j\theta)`)} と置き、${tex(String.raw`s = \sin^2(\theta/2)`)} とすると
      ${eq(String.raw`G^2 - 2\left(1 - 2C^2 s\right)G + 1 = 0`)}
      です。二つの根の積は 1 なので、どちらも ${tex(String.raw`|G| \le 1`)} となるのは根が複素共役で ${tex(String.raw`|G| = 1`)} のとき、すなわち判別式が 0 以下
      ${eq(String.raw`\left(1 - 2C^2 s\right)^2 \le 1 \iff C^2 s \le 1`)}
      のときです。すべての ${tex(String.raw`0 < s < 1`)} について成り立つ条件は ${tex(String.raw`C \le 1`)} で、これを Courant–Friedrichs–Lewy の条件と呼びます。${tex('C = 1')} では ${tex(String.raw`u_j^{n+1} = u_{j+1}^n + u_{j-1}^n - u_j^{n-1}`)} となり、格子点の上では d'Alembert の解と一致します。`,
  ],
  figureAlt: '左右に進む二つの進行波が両端で符号を変えて反射し、弦の変位の形が時間とともに変わる様子。',
  figure: experimentPanel({
    fieldsetLabel: '弦と初期形',
    fields: [
      { name: 'speed', label: '波の速さ', symbol: 'c', value: 0.25, min: 0 },
      { name: 'length', label: '弦の長さ', symbol: 'L', value: 1, min: 0 },
      { name: 'cells', label: '格子の区間の数（偶数）', symbol: 'M', value: 100, min: 4, max: 200, step: '2' },
      { name: 'pluck', label: 'つまむ位置', symbol: 'p', value: 0.5 },
      { name: 'height', label: 'つまむ高さ', symbol: 'h', value: 1 },
    ],
    dt: 0.032,
    steps: 250,
    sceneHeading: `弦の変位 ${tex('u(x, t)')}`,
    sceneCaption: `実線は格子の上の数値解、青緑の破線は厳密解です。灰色の破線は右へ進む波 ${tex(String.raw`\tfrac{1}{2}F(x - ct)`)}、灰色の実線は左へ進む波 ${tex(String.raw`\tfrac{1}{2}F(x + ct)`)} で、二つの和が厳密解です。`,
    sceneLabel: '両端を固定した弦の変位の数値解と厳密解',
    sceneHeight: 320,
    readouts: { position: '中央の変位 u(L/2, t)（近似）', velocity: 'Courant 数 C = cΔt/Δx', exact: '厳密解 u(L/2, t)', error: '中央の差 u − u_exact' },
    plotsHeading: '中央の変位の時間変化',
    tabs: methodTabs('この方程式の数値解法', [{ id: 'leapfrog', label: '中心差分法（leapfrog）' }]),
    plots: `<div class="lesson-figure"><h3>中央の変位 ${tex('u(L/2, t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('L = 1')}、${tex('c = 0.25')}、${tex('p = 1/2')}、${tex('h = 1')} とします。周期は
      ${eq(String.raw`\frac{2L}{c} = \frac{2}{0.25} = 8`)}
      です。${tex('M = 100')}、${tex(String.raw`\Delta t = 0.032`)} では ${tex(String.raw`\Delta x = 0.01`)} で、
      ${eq(String.raw`C = \frac{0.25 \times 0.032}{0.01} = 0.8 \le 1`)}
      です。`,
    `中央 ${tex('x = 1/2')} の厳密解を求めます。${tex('t = 4')}（半周期）では ${tex('ct = 1')} なので
      ${eq(String.raw`u(\tfrac{1}{2}, 4) = \tfrac{1}{2}\left[F(-\tfrac{1}{2}) + F(\tfrac{3}{2})\right] = \tfrac{1}{2}\left[-f(\tfrac{1}{2}) + F(-\tfrac{1}{2})\right] = \tfrac{1}{2}\left[-1 - 1\right] = -1`)}
      で、弦は上下が反転した形です。${tex('t = 8')}（1周期）では ${tex('ct = 2 = 2L')} なので ${tex(String.raw`u(\tfrac{1}{2}, 8) = \tfrac{1}{2}[F(-\tfrac{3}{2}) + F(\tfrac{5}{2})] = \tfrac{1}{2}[f(\tfrac{1}{2}) + f(\tfrac{1}{2})] = 1`)} で、初期形に戻ります。どちらも厳密な値です。`,
    `既定の条件（${tex('C = 0.8')}、250 ステップ、終わりの時刻 ${tex('t = 8')}）で再生すると、計器の厳密解は 1.00000、数値解は約 0.979（近似）です。三角形の角が格子の上で少し丸まるためです。時間刻みを ${tex(String.raw`\Delta t = 0.04`)}、ステップ数を 200 にすると ${tex('C = 1')} で、数値解は 1.00000 となり厳密解と一致します。${tex(String.raw`\Delta t = 0.044`)}（${tex('C = 1.1')}）にすると、数値解は発散します。`,
  ],
  related: [
    { href: './heat.html', title: '熱伝導方程式' },
    { href: './sturm-liouville.html', title: 'Sturm–Liouville 問題' },
    { href: './maxwell.html', title: 'Maxwell 方程式と電磁波' },
  ],
  footer: 'この画面の計算は、両端を固定した1本の弦の波動方程式です。',
});

const form = formReader(defaults);

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const scene = document.getElementById('scene') as HTMLCanvasElement;
  const chart = document.getElementById('time-chart') as HTMLCanvasElement;
  const frame = state?.frame;
  if (!state || !frame) {
    clearFigure(scene);
    clearFigure(chart);
    return;
  }
  const key = JSON.stringify(config);
  const height = Math.abs(Number(config.height));
  drawPlot(scene, {
    key: `${key}|profile`,
    label: '位置 x に対する弦の変位。実線は数値解、破線は厳密解、灰色は二つの進行波。',
    xMin: 0,
    xMax: Number(config.length),
    yMin: frame.values.stable === 1 ? -1.2 * height : undefined,
    yMax: frame.values.stable === 1 ? 1.2 * height : undefined,
    lines: [line(frame, 'right'), line(frame, 'left'), line(frame, 'numerical'), line(frame, 'exact')],
  });
  drawPlot(chart, {
    key: `${key}|center`,
    label: '中央の変位の時間変化。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: config.steps * config.dt,
    yMin: frame.values.stable === 1 ? -1.2 * height : undefined,
    yMax: frame.values.stable === 1 ? 1.2 * height : undefined,
    lines: [
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'u = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-wave.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => 'leapfrog',
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    const note = v.stable === 1 ? 'C ≤ 1 なので安定です' : 'C > 1 なので不安定です';
    return `格子の上の最大誤差 max|u − u_exact| = ${v.max_error.toExponential(2)}    C = ${v.courant.toFixed(3)}（${note}）`;
  },
});
bindMethodTabs(() => session.reloadMethod());
