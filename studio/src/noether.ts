import { coreDoc, coreStepDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

type Integrator = 'rk4' | 'verlet';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'analytical/noether',
  mass: 1,
  strength: 1,
  radius: 1,
  speed: 1.1,
  dt: 0.3,
  steps: 3000,
};

renderLesson({
  id: 'noether',
  section: { label: '解析力学' },
  title: '対称性と保存則',
  description: `Lagrange 関数が連続的な変換で変わらないとき、その変換に対応する量が運動のあいだ一定に保たれます（Noether の定理）。中心力場の質点で、回転の対称性から角運動量の保存を、時間の並進の対称性からエネルギーの保存を導き、長時間の数値計算で古典的RK4 と速度 Verlet 法の保存の様子を比べます。`,
  equation: [
    String.raw`I = \sum_j \frac{\partial L}{\partial \dot q_j}\,K_j(q) = \text{一定}`,
    String.raw`E = \sum_j \dot q_j\frac{\partial L}{\partial \dot q_j} - L = \text{一定}`,
  ],
  equationLabel: '変換 q から q + ε K(q) で Lagrange 関数が変わらないとき、I は一定。時刻を陽に含まないとき、エネルギー E は一定。',
  studyHeading: '対称性から保存量を求める手順',
  steps: [
    `記号を定めます。${tex(String.raw`L(q, \dot q, t)`)} は一般化座標 ${tex(String.raw`q = (q_1, \ldots, q_s)`)} の Lagrange 関数、${tex(String.raw`p_j = \partial L/\partial\dot q_j`)} は一般化運動量です。座標の変換
      ${eq(String.raw`q_j \to q_j + \varepsilon K_j(q)\qquad (j = 1, \ldots, s)`)}
      を考えます。${tex(String.raw`\varepsilon`)} は小さな実数、${tex('K_j')} は変換の向きを決める関数（生成元）です。速度は ${tex(String.raw`\dot q_j \to \dot q_j + \varepsilon\dot K_j`)} と変わります。${tex(String.raw`\varepsilon`)} の1次で ${tex('L')} が変わらないこと
      ${eq(String.raw`\sum_j\left(\frac{\partial L}{\partial q_j}K_j + \frac{\partial L}{\partial\dot q_j}\dot K_j\right) = 0`)}
      を、${tex('L')} がこの変換で不変であるといいます。このとき ${tex(String.raw`I = \sum_j p_j K_j`)} が保存することを、最後の証明で示します（${coreDoc('analytical', 'noether_charge', 'Noether の保存量の説明')}）。`,
    `平面上で中心力を受ける質量 ${tex('m')} の質点を考えます。引力の強さを ${tex('k > 0')}、位置を ${tex(String.raw`\mathbf{r} = (x, y)`)}、${tex(String.raw`r = \sqrt{x^2 + y^2}`)} とすると、位置エネルギーは ${tex('V = -k/r')} で
      ${eq(String.raw`L = \frac{1}{2} m(\dot x^2 + \dot y^2) + \frac{k}{\sqrt{x^2 + y^2}}`)}
      です。原点のまわりの角 ${tex(String.raw`\varepsilon`)} の回転 ${tex(String.raw`(x\cos\varepsilon - y\sin\varepsilon,\ x\sin\varepsilon + y\cos\varepsilon)`)} を ${tex(String.raw`\varepsilon`)} で微分して ${tex(String.raw`\varepsilon = 0`)} と置くと、生成元は
      ${eq(String.raw`\mathbf{K} = (-y,\ x)`)}
      です（${coreDoc('analytical', 'rotation_generator', '回転の生成元の説明')}）。`,
    `この回転で ${tex('L')} が変わらないことを確かめます。${tex(String.raw`\partial L/\partial x = -kx/r^3`)}、${tex(String.raw`\partial L/\partial y = -ky/r^3`)}、${tex(String.raw`\partial L/\partial\dot x = m\dot x`)}、${tex(String.raw`\partial L/\partial\dot y = m\dot y`)}、${tex(String.raw`\dot K = (-\dot y, \dot x)`)} なので
      ${eq(String.raw`-\frac{kx}{r^3}(-y) - \frac{ky}{r^3}\,x + m\dot x(-\dot y) + m\dot y\,\dot x = \frac{k}{r^3}(xy - yx) + m(\dot y\dot x - \dot x\dot y) = 0`)}
      です。保存量は
      ${eq(String.raw`I = p_x(-y) + p_y\,x = m(x\dot y - y\dot x) = L_z`)}
      で、原点のまわりの角運動量です（${coreDoc('analytical', 'angular_momentum', '角運動量の説明')}）。並進 ${tex(String.raw`\mathbf{K} = (1, 0)`)} では ${tex(String.raw`\frac{\partial L}{\partial x}\cdot 1 = -kx/r^3 \ne 0`)} なので不変ではなく、中心が力を及ぼすので運動量 ${tex('p_x')} は保存しません。`,
    `時間の並進を考えます。解に沿って ${tex('L')} を時間で微分し、Euler–Lagrange 方程式 ${tex(String.raw`\frac{\partial L}{\partial q_j} = \frac{d}{dt}\frac{\partial L}{\partial\dot q_j}`)} を代入します。
      ${eq(String.raw`\frac{dL}{dt} = \sum_j\left(\frac{\partial L}{\partial q_j}\dot q_j + \frac{\partial L}{\partial\dot q_j}\ddot q_j\right) + \frac{\partial L}{\partial t}`)}
      ${eq(String.raw`= \sum_j\left(\dot q_j\frac{d}{dt}\frac{\partial L}{\partial\dot q_j} + \frac{\partial L}{\partial\dot q_j}\ddot q_j\right) + \frac{\partial L}{\partial t} = \frac{d}{dt}\sum_j\dot q_j\frac{\partial L}{\partial\dot q_j} + \frac{\partial L}{\partial t}`)}
      移項すると
      ${eq(String.raw`\frac{dE}{dt} = \frac{d}{dt}\left(\sum_j\dot q_j\frac{\partial L}{\partial\dot q_j} - L\right) = -\frac{\partial L}{\partial t}`)}
      です。中心力の ${tex('L')} は時刻を陽に含まないので ${tex(String.raw`\partial L/\partial t = 0`)} で、${tex('E')} は保存します。${tex(String.raw`\sum_j\dot q_j\,\partial L/\partial\dot q_j = m(\dot x^2 + \dot y^2)`)} から
      ${eq(String.raw`E = m|\dot{\mathbf{r}}|^2 - L = \frac{1}{2} m|\dot{\mathbf{r}}|^2 - \frac{k}{r}`)}
      です（${coreDoc('analytical', 'central_force_energy', 'エネルギーの説明')}）。`,
    `数値解は、加速度 ${tex(String.raw`\mathbf{a}(\mathbf{r}) = -\frac{k}{m}\frac{\mathbf{r}}{r^3}`)}（${coreDoc('analytical', 'central_force_acceleration', '加速度の説明')}）で ${tex(String.raw`\mathbf{r}' = \mathbf{v}`)}、${tex(String.raw`\mathbf{v}' = \mathbf{a}`)} を進めた近似です。速度 Verlet 法の1ステップは
      ${eq(String.raw`\mathbf{v}_{n+1/2} = \mathbf{v}_n + \frac{\Delta t}{2}\mathbf{a}(\mathbf{r}_n),\qquad \mathbf{r}_{n+1} = \mathbf{r}_n + \Delta t\,\mathbf{v}_{n+1/2},\qquad \mathbf{v}_{n+1} = \mathbf{v}_{n+1/2} + \frac{\Delta t}{2}\mathbf{a}(\mathbf{r}_{n+1})`)}
      です（${coreStepDoc('velocity_verlet_step', '速度 Verlet 法の説明')}）。平面の外積 ${tex(String.raw`\mathbf{r}\times\mathbf{v} = x v_y - y v_x`)} で角運動量を ${tex(String.raw`L_z = m\,\mathbf{r}\times\mathbf{v}`)} と書くと、速度を変える段では ${tex(String.raw`\mathbf{a}(\mathbf{r})`)} が ${tex(String.raw`\mathbf{r}`)} に平行なので
      ${eq(String.raw`\mathbf{r}_n\times\Big(\mathbf{v}_n + \frac{\Delta t}{2}\mathbf{a}(\mathbf{r}_n)\Big) = \mathbf{r}_n\times\mathbf{v}_n`)}
      位置を変える段では ${tex(String.raw`\mathbf{v}\times\mathbf{v} = 0`)} なので
      ${eq(String.raw`(\mathbf{r}_n + \Delta t\,\mathbf{v}_{n+1/2})\times\mathbf{v}_{n+1/2} = \mathbf{r}_n\times\mathbf{v}_{n+1/2}`)}
      です。3段とも ${tex('L_z')} を変えないので、速度 Verlet 法は角運動量を刻み幅によらず保ちます。エネルギーの差は ${tex(String.raw`\Delta t^2`)} 程度の幅で振動し、増え続けません。古典的RK4 は1ステップの誤差が ${tex(String.raw`\Delta t^5`)} 程度と小さいものの、同じ向きにたまるので、エネルギーと角運動量は時間に比例して減り続けます。`,
  ],
  figureAlt: '中心力の楕円軌道と一定の角運動量、長時間の計算でのエネルギーの差の時間変化。',
  figure: experimentPanel({
    fieldsetLabel: '中心力場の質点',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'strength', label: '引力の強さ', symbol: 'k', value: 1, min: 0 },
      { name: 'radius', label: '初期距離', symbol: 'r_0', value: 1, min: 0 },
      { name: 'speed', label: '初期の速さ', symbol: 'v_0', value: 1.1, min: 0 },
    ],
    dt: 0.3,
    steps: 3000,
    sceneHeading: '中心力場の軌道',
    sceneCaption: '実線は数値解の軌跡、青緑の破線は初期条件から決まる厳密な楕円、点は質点、矢印は速度の向き、細い破線は動径です。',
    sceneLabel: '原点の引力中心のまわりを回る質点の軌道',
    sceneHeight: 320,
    readouts: { position: 'エネルギー E（数値解）', velocity: '角運動量 L（数値解）', exact: '厳密なエネルギー E₀', error: 'エネルギーの差 E − E₀' },
    plotsHeading: 'エネルギーと角運動量の差の時間変化',
    legend: '<span><i class="numerical"></i>数値解と厳密な値の差</span>',
    tabs: methodTabs('この方程式の数値解法', [{ id: 'rk4', label: '古典的RK4' }, { id: 'verlet', label: '速度 Verlet 法' }]),
    plots: `<div class="plot-pair"><div><h3>エネルギーの差 ${tex('E(t) - E_0')}</h3><canvas id="energy-chart" role="img"></canvas><p>時間 t</p></div><div><h3>角運動量の差 ${tex('L(t) - L_0')}</h3><canvas id="momentum-chart" role="img"></canvas><p>時間 t</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 1')}、${tex('k = 1')}、初期位置 ${tex('(r_0, 0) = (1, 0)')}、初期速度 ${tex('(0, v_0) = (0, 1.1)')} とします。保存量の厳密な値は
      ${eq(String.raw`E_0 = \frac{1}{2}\cdot 1\cdot 1.1^2 - \frac{1}{1} = 0.605 - 1 = -0.395,\qquad L_0 = 1\cdot(1\cdot 1.1 - 0\cdot 0) = 1.1`)}
      です。${tex('E_0 < 0')} なので軌道は閉じた楕円です。`,
    `楕円の大きさと周期は、半直弦 ${tex(String.raw`p = L_0^2/(mk)`)}、離心率 ${tex('e = p/r_0 - 1')}、長半径 ${tex('a = -k/(2E_0)')} から
      ${eq(String.raw`p = 1.21,\qquad e = 0.21,\qquad a = \frac{1}{0.79} \approx 1.26582,\qquad T = 2\pi\sqrt{\frac{m a^3}{k}} \approx 8.948`)}
      です（小数は近似）。既定の ${tex(String.raw`\Delta t = 0.3`)}、3000 ステップの計算時間 900 は、約 100 周です。`,
    `終わりまで再生すると、古典的RK4 ではエネルギーの差が単調に減り、終わりで約 ${tex(String.raw`-1.0\times 10^{-2}`)}、角運動量の差も約 ${tex(String.raw`-1.0\times 10^{-2}`)} になります（近似）。速度 Verlet 法では、エネルギーの差は 1 周ごとに振動して最大でも約 ${tex(String.raw`5\times 10^{-3}`)} にとどまり、角運動量は ${tex('1.10000')} のまま変わりません。`,
  ],
  related: [
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
    { href: './two-body.html', title: '中心力場と2体問題' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
    { href: './hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式' },
  ],
  footer: 'この画面の計算は、逆2乗の引力を受ける一つの質点の長時間の平面運動です。',
  proof: writtenProof([
    {
      statement: `${tex('L')} は連続微分可能、${tex('K_j')} は連続微分可能とし、すべての ${tex(String.raw`(q, \dot q, t)`)} で ${tex(String.raw`\frac{d}{d\varepsilon}L\big(q + \varepsilon K(q),\ \dot q + \varepsilon\,\tfrac{\partial K}{\partial q}\dot q,\ t\big)\big|_{\varepsilon = 0} = 0`)} とします。Euler–Lagrange 方程式の2回連続微分可能な解 ${tex('q(t)')} に沿って、${tex(String.raw`I = \sum_j \frac{\partial L}{\partial\dot q_j}K_j(q)`)} は時刻によらない定数です（Noether の定理）。`,
      proof: [
        `仮定の微分を合成関数の微分で書くと、すべての ${tex(String.raw`(q, \dot q, t)`)} で
          ${eq(String.raw`\sum_j\left(\frac{\partial L}{\partial q_j}K_j(q) + \frac{\partial L}{\partial\dot q_j}\sum_k\frac{\partial K_j}{\partial q_k}\dot q_k\right) = 0`)}
          です。`,
        `解 ${tex('q(t)')} に沿って ${tex(String.raw`K_j(q(t))`)} を時間で微分すると、合成関数の微分により
          ${eq(String.raw`\frac{d}{dt}K_j(q(t)) = \sum_k\frac{\partial K_j}{\partial q_k}\dot q_k`)}
          なので、前の式は解に沿って ${tex(String.raw`\sum_j\left(\frac{\partial L}{\partial q_j}K_j + \frac{\partial L}{\partial\dot q_j}\frac{dK_j}{dt}\right) = 0`)} です。`,
        `${tex('I')} を積の微分で微分します。
          ${eq(String.raw`\frac{dI}{dt} = \sum_j\left(\frac{d}{dt}\frac{\partial L}{\partial\dot q_j}\,K_j + \frac{\partial L}{\partial\dot q_j}\,\frac{dK_j}{dt}\right)`)}`,
        `Euler–Lagrange 方程式 ${tex(String.raw`\frac{d}{dt}\frac{\partial L}{\partial\dot q_j} = \frac{\partial L}{\partial q_j}`)} を第1項に代入すると
          ${eq(String.raw`\frac{dI}{dt} = \sum_j\left(\frac{\partial L}{\partial q_j}K_j + \frac{\partial L}{\partial\dot q_j}\frac{dK_j}{dt}\right) = 0`)}
          で、最後の等号は前の手順の式です。`,
        `導関数が恒等的に 0 の関数は、平均値の定理により定数です。したがって ${tex('I(t) = I(0)')} です。`,
      ],
    },
    {
      statement: `${tex('L')} が時刻を陽に含まない（${tex(String.raw`\partial L/\partial t = 0`)}）とき、Euler–Lagrange 方程式の2回連続微分可能な解に沿って ${tex(String.raw`E = \sum_j\dot q_j\frac{\partial L}{\partial\dot q_j} - L`)} は定数です。`,
      proof: [
        `手順4の計算により、解に沿って ${tex(String.raw`\frac{dE}{dt} = -\frac{\partial L}{\partial t}`)} です。`,
        `仮定から右辺は 0 なので、平均値の定理により ${tex('E(t) = E(0)')} です。`,
      ],
    },
  ]),
});

const form = formReader(defaults);
let method: Integrator = 'rk4';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'energy-chart', 'momentum-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawPlot(canvases[0], {
    key: `${key}|orbit`,
    label: '中心力場の軌道。実線は数値解の軌跡、破線は厳密な楕円、矢印は速度。',
    equalAspect: true,
    lines: [line(frame, 'orbit'), line(frame, 'radius'), line(frame, 'trail')],
    vectors: frame.arrows.map(a => ({ ...a, label: 'v' })),
    dots: [dot(frame, 'center'), { ...dot(frame, 'body'), radius: 6 }],
  });
  const times = points.map(p => p.time);
  drawPlot(canvases[1], {
    label: 'エネルギーの差 E − E₀ と時間のグラフ。',
    xMin: 0,
    xMax: timeEnd,
    lines: [{ x: times, y: points.map(p => p.position_error ?? Number.NaN), role: 'numerical' }],
    dots: [{ x: state.time, y: state.position_error ?? Number.NaN, role: 'numerical' }],
    zeroLabel: '差 0',
  });
  drawPlot(canvases[2], {
    label: '角運動量の差 L − L₀ と時間のグラフ。',
    xMin: 0,
    xMax: timeEnd,
    lines: [{ x: times, y: points.map(p => p.velocity_error ?? Number.NaN), role: 'numerical' }],
    dots: [{ x: state.time, y: state.velocity_error ?? Number.NaN, role: 'numerical' }],
    zeroLabel: '差 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-noether.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return `厳密な角運動量 L₀ ${state.exact_velocity.toFixed(5)}\n角運動量の差 L − L₀ ${(state.velocity_error ?? Number.NaN).toExponential(2)}\nエネルギーの差の最大値 ${v?.max_energy_error.toExponential(2) ?? '—'}`;
  },
});
bindMethodTabs<Integrator>(next => {
  method = next;
  session.reloadMethod();
});
