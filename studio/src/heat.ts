import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

type HeatMethod = 'ftcs' | 'crank-nicolson';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'ode/heat',
  kappa: 0.01,
  length: 1,
  cells: 40,
  a1: 1,
  a3: 0.5,
  a5: 0.25,
  dt: 0.025,
  steps: 400,
};

renderLesson({
  id: 'heat',
  section: { label: '微分方程式', href: './ode.html' },
  title: '熱伝導方程式',
  description: `両端を温度 0 に保った長さ ${tex('L')} の棒の温度 ${tex('u(x, t)')} は、熱伝導方程式に従って平らになっていきます。変数分離で Fourier 級数の厳密解を導き、FTCS 法と Crank–Nicolson 法の格子の近似解と比べ、FTCS 法が ${tex(String.raw`r \le 1/2`)} でだけ安定であることを確かめます。`,
  equation: [
    String.raw`\frac{\partial u}{\partial t} = \kappa \frac{\partial^2 u}{\partial x^2}`,
    String.raw`u(x, t) = \sum_n A_n \sin\frac{n\pi x}{L}\, e^{-\kappa (n\pi/L)^2 t}`,
  ],
  equationLabel: '熱伝導方程式。u の時間微分は κ 掛ける u の x についての2階微分。',
  equationNote: '境界条件 u(0, t) = u(L, t) = 0',
  studyHeading: '変数分離から厳密解へ、差分法とその安定性',
  steps: [
    `記号を定めます。${tex('x')} は棒の上の位置（${tex(String.raw`0 \le x \le L`)}）、${tex('t')} は時刻、${tex('u(x, t)')} は温度、${tex(String.raw`\kappa > 0`)} は熱拡散率です。境界条件は両端の温度 ${tex('u(0, t) = u(L, t) = 0')}、初期条件は ${tex('u(x, 0) = f(x)')} です。このページの初期温度は三つの正弦波の和
      ${eq(String.raw`f(x) = A_1 \sin\frac{\pi x}{L} + A_3 \sin\frac{3\pi x}{L} + A_5 \sin\frac{5\pi x}{L}`)}
      です。`,
    `${tex('u(x, t) = X(x)\\,T(t)')} と置いて方程式に入れます。
      ${eq(String.raw`X(x)\,T'(t) = \kappa X''(x)\,T(t)`)}
      両辺を ${tex(String.raw`\kappa X T`)} で割ると
      ${eq(String.raw`\frac{T'(t)}{\kappa T(t)} = \frac{X''(x)}{X(x)}`)}
      です。左辺は ${tex('t')} だけ、右辺は ${tex('x')} だけの関数なので、両辺は同じ定数で、それを ${tex('-k^2')} と書きます。
      ${eq(String.raw`X'' + k^2 X = 0,\qquad X(0) = X(L) = 0`)}
      ${eq(String.raw`T' = -\kappa k^2 T`)}
      第1式は Sturm–Liouville 問題で、0 でない解は ${tex(String.raw`k = n\pi/L`)}、${tex(String.raw`X_n = \sin(n\pi x/L)`)} のときだけです。第2式の解は ${tex(String.raw`T_n = e^{-\kappa (n\pi/L)^2 t}`)} です。`,
    `方程式は線形なので、解の和も解です。
      ${eq(String.raw`u(x, t) = \sum_{n} A_n \sin\frac{n\pi x}{L}\, e^{-\kappa (n\pi/L)^2 t}`)}
      ${tex('t = 0')} で ${tex(String.raw`e^0 = 1`)} なので、係数 ${tex('A_n')} は初期温度の正弦級数の係数です。一般の ${tex('f')} では固有関数の直交性から ${tex(String.raw`A_n = \frac{2}{L}\int_0^L f(x)\sin\frac{n\pi x}{L}\,dx`)} です。このページの ${tex('f')} は3項の和なので、和も3項で終わり、
      ${eq(String.raw`u(x, t) = A_1 \sin\frac{\pi x}{L} e^{-\kappa\pi^2 t/L^2} + A_3 \sin\frac{3\pi x}{L} e^{-9\kappa\pi^2 t/L^2} + A_5 \sin\frac{5\pi x}{L} e^{-25\kappa\pi^2 t/L^2}`)}
      は打ち切りのない厳密解です（${coreDoc('differential', 'heat_fourier_solution', '厳密解の説明')}）。モード ${tex('n')} は ${tex('n^2')} に比例する速さで減るので、細かい凹凸ほど早く消え、温度分布は平らになります。`,
    `格子を置きます。${tex(String.raw`\Delta x = L/M`)}、${tex(String.raw`x_j = j\Delta x`)}（${tex(String.raw`j = 0, \ldots, M`)}）、${tex(String.raw`t_n = n\Delta t`)}、${tex(String.raw`u_j^n \approx u(x_j, t_n)`)} とします。Taylor 展開
      ${eq(String.raw`u(x \pm \Delta x) = u \pm \Delta x\, u_x + \frac{\Delta x^2}{2} u_{xx} \pm \frac{\Delta x^3}{6} u_{xxx} + O(\Delta x^4)`)}
      の二つを足すと、2階微分の中心差分
      ${eq(String.raw`u_{xx} = \frac{u(x + \Delta x) - 2u(x) + u(x - \Delta x)}{\Delta x^2} + O(\Delta x^2)`)}
      を得ます。時間微分を前進差分 ${tex(String.raw`(u_j^{n+1} - u_j^n)/\Delta t`)} で置くと、FTCS 法
      ${eq(String.raw`u_j^{n+1} = u_j^n + r\left(u_{j+1}^n - 2u_j^n + u_{j-1}^n\right),\qquad r = \frac{\kappa\Delta t}{\Delta x^2}`)}
      です（${coreDoc('differential', 'ftcs_step', 'FTCS 法の説明')}）。`,
    `FTCS 法の安定性を調べます。${tex(String.raw`u_j^n = G^n \sin(j\theta)`)}（${tex(String.raw`0 < \theta < \pi`)}）と置きます。和積の公式から
      ${eq(String.raw`\sin((j+1)\theta) + \sin((j-1)\theta) = 2\sin(j\theta)\cos\theta`)}
      なので
      ${eq(String.raw`G = 1 + r(2\cos\theta - 2) = 1 - 4r\sin^2\frac{\theta}{2}`)}
      です（${coreDoc('differential', 'ftcs_amplification', '増幅率の説明')}）。${tex(String.raw`0 < \sin^2(\theta/2) < 1`)} なので ${tex('G')} は ${tex('1 - 4r')} と 1 のあいだにあります。すべてのモードで ${tex(String.raw`|G| \le 1`)} となる条件は
      ${eq(String.raw`1 - 4r \ge -1 \iff r \le \frac{1}{2}`)}
      です。${tex(String.raw`r > 1/2`)} では ${tex(String.raw`\theta`)} が ${tex(String.raw`\pi`)} に近いモードで ${tex(String.raw`|G| > 1`)} となり、格子1間隔ごとに符号の変わるぎざぎざが毎ステップ増えて、解は発散します。`,
    `Crank–Nicolson 法は、空間の差分を時刻 ${tex('t_n')} と ${tex('t_{n+1}')} の平均で置きます。
      ${eq(String.raw`\frac{u_j^{n+1} - u_j^n}{\Delta t} = \frac{\kappa}{2\Delta x^2}\left[(\delta^2 u^{n+1})_j + (\delta^2 u^n)_j\right]`)}
      ${tex(String.raw`\Delta t`)} を掛けて未知の ${tex('u^{n+1}')} を左へ集めると
      ${eq(String.raw`-\frac{r}{2}u_{j-1}^{n+1} + (1 + r)u_j^{n+1} - \frac{r}{2}u_{j+1}^{n+1} = \frac{r}{2}u_{j-1}^n + (1 - r)u_j^n + \frac{r}{2}u_{j+1}^n`)}
      で、内部の点 ${tex(String.raw`j = 1, \ldots, M-1`)} について三重対角の連立1次方程式です。これを Thomas 法（三重対角の Gauss 消去）で、手間 ${tex('M')} に比例して解きます（${coreDoc('differential', 'solve_tridiagonal', 'Thomas 法の説明')}、${coreDoc('differential', 'crank_nicolson_step', 'Crank–Nicolson 法の説明')}）。同じモードを入れると ${tex(String.raw`s = \sin^2(\theta/2)`)} として
      ${eq(String.raw`G = \frac{1 - 2rs}{1 + 2rs}`)}
      です。${tex(String.raw`r > 0`)}、${tex('s > 0')} では ${tex(String.raw`|1 - 2rs| < 1 + 2rs`)} なので、どの ${tex('r')} でも ${tex(String.raw`|G| < 1`)} です。`,
  ],
  figureAlt: '時間の経過とともに凹凸がならされ、0 へ冷えていく温度分布 u(x) の曲線群。',
  figure: experimentPanel({
    fieldsetLabel: '棒と初期温度',
    fields: [
      { name: 'kappa', label: '熱拡散率', symbol: String.raw`\kappa`, value: 0.01, min: 0 },
      { name: 'length', label: '棒の長さ', symbol: 'L', value: 1, min: 0 },
      { name: 'cells', label: '格子の区間の数（偶数）', symbol: 'M', value: 40, min: 4, max: 200, step: '2' },
      { name: 'a1', label: '係数', symbol: 'A_1', value: 1 },
      { name: 'a3', label: '係数', symbol: 'A_3', value: 0.5 },
      { name: 'a5', label: '係数', symbol: 'A_5', value: 0.25 },
    ],
    dt: 0.025,
    steps: 400,
    sceneHeading: `温度分布 ${tex('u(x, t)')}`,
    sceneCaption: '実線は格子の上の数値解、青緑の破線は同じ時刻の厳密解、灰色の破線は初期温度 f(x) です。時間刻みを大きくして r を 1/2 より大きくすると、FTCS 法の数値解はぎざぎざになって発散します。',
    sceneLabel: '棒の上の温度分布の数値解と厳密解',
    sceneHeight: 320,
    readouts: { position: '中央の温度 u(L/2, t)（近似）', velocity: '比 r = κΔt/Δx²', exact: '厳密解 u(L/2, t)', error: '中央の差 u − u_exact' },
    plotsHeading: '中央の温度の時間変化',
    tabs: methodTabs('この方程式の数値解法', [{ id: 'ftcs', label: 'FTCS法' }, { id: 'crank-nicolson', label: 'Crank–Nicolson 法' }]),
    plots: `<div class="lesson-figure"><h3>中央の温度 ${tex('u(L/2, t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\kappa = 0.01`)}、${tex('L = 1')}、${tex('M = 40')}、${tex(String.raw`\Delta t = 0.025`)} とします。${tex(String.raw`\Delta x = 1/40 = 0.025`)} なので
      ${eq(String.raw`r = \frac{0.01 \times 0.025}{0.025^2} = \frac{0.01}{0.025} = 0.4`)}
      で、${tex(String.raw`r \le 1/2`)} を満たします。この値は厳密です。`,
    `${tex('A_1 = 1')}、${tex('A_3 = 0.5')}、${tex('A_5 = 0.25')} の中央 ${tex('x = 1/2')}、時刻 ${tex('t = 5')} の温度を求めます。${tex(String.raw`\kappa\pi^2 t = 0.05\pi^2 = \pi^2/20`)}、${tex(String.raw`\sin\frac{\pi}{2} = 1`)}、${tex(String.raw`\sin\frac{3\pi}{2} = -1`)}、${tex(String.raw`\sin\frac{5\pi}{2} = 1`)} なので
      ${eq(String.raw`u(\tfrac{1}{2}, 5) = e^{-\pi^2/20} - 0.5\,e^{-9\pi^2/20} + 0.25\,e^{-25\pi^2/20}`)}
      ${eq(String.raw`\approx 0.610498 - 0.5 \times 0.011780 + 0.25 \times 0.0000044 \approx 0.604609`)}
      です。式は厳密で、小数は近似です。ステップ数を 200 にして再生すると、計器の厳密解は 0.60461 を示し、${tex(String.raw`r = 0.4`)} の数値解はこれと小数第3位まで一致します。`,
    `時間刻みを ${tex(String.raw`\Delta t = 0.04`)} にすると ${tex(String.raw`r = 0.64 > 1/2`)} です。最も細かいモード ${tex(String.raw`\theta = 39\pi/40`)} の増幅率は
      ${eq(String.raw`G = 1 - 4 \times 0.64 \times \sin^2\frac{39\pi}{80} \approx -1.556`)}
      で、ぎざぎざは1ステップごとに符号を変えながら約 1.56 倍になります。初期温度にこのモードは含まれませんが、計算の途中で生じるごく小さな成分が増え、FTCS 法の数値解は発散します。同じ ${tex('r')} でも Crank–Nicolson 法は発散しません。`,
  ],
  related: [
    { href: './black-scholes.html', title: 'Black–Scholes 方程式', description: '変数変換で、この熱伝導方程式に帰着するオプション価格の方程式です。' },
    { href: './sturm-liouville.html', title: 'Sturm–Liouville 問題', description: '変数分離で現れる X″ + k²X = 0 の固有値と、固有関数の直交性です。' },
    { href: './wave.html', title: '波動方程式', description: '同じ境界条件の弦の振動で、モードは減らずに振動します。' },
    { href: './elimination.html', title: '連立1次方程式と消去法', description: 'Crank–Nicolson 法の三重対角の方程式を解く Gauss 消去です。' },
  ],
  footer: 'この画面の計算は、両端の温度を 0 に保った1本の棒の熱伝導方程式です。',
});

const form = formReader(defaults);
let method: HeatMethod = 'ftcs';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const scene = document.getElementById('scene') as HTMLCanvasElement;
  const chart = document.getElementById('time-chart') as HTMLCanvasElement;
  const frame = state?.frame;
  if (!state || !frame) {
    clearFigure(scene);
    clearFigure(chart);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const profiles = [line(frame, 'initial'), line(frame, 'numerical'), line(frame, 'exact')];
  const peak = Math.max(...profiles[0].y.map(Math.abs));
  const decade = 10 ** Math.floor(Math.log10(peak / 3));
  const unit = [1, 2, 2.5, 5, 10].map(m => m * decade).find(u => 3 * u >= 1.05 * peak) ?? peak;
  const fits = peak > 0 && profiles.every(p => p.y.every(u => u >= -unit && u <= 3 * unit));
  drawPlot(scene, {
    key: `${key}|profile`,
    label: '位置 x に対する温度。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: Number(config.length),
    yMin: fits ? -unit : undefined,
    yMax: fits ? 3 * unit : undefined,
    lines: profiles,
  });
  drawPlot(chart, {
    key: `${key}|center`,
    label: '中央の温度の時間変化。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: config.steps * config.dt,
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
  downloadName: 'ergion-heat.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    const note = v.ftcs_stable === 1 ? 'r ≤ 1/2 なので FTCS 法は安定です' : 'r > 1/2 なので FTCS 法は不安定です';
    return `格子の上の最大誤差 max|u − u_exact| = ${v.max_error.toExponential(2)}    r = ${v.ratio.toFixed(3)}（${note}）`;
  },
});
bindMethodTabs<HeatMethod>(next => {
  method = next;
  session.reloadMethod();
});
