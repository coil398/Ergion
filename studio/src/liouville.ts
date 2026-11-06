import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'analytical/liouville',
  mass: 1,
  length: 1,
  gravity: 1,
  center_q: 1,
  center_p: 0,
  radius: 0.5,
  points: 400,
  dt: 0.05,
  steps: 400,
};

renderLesson({
  id: 'liouville',
  section: { label: '解析力学' },
  title: '相空間と Liouville の定理',
  description: `Hamilton の正準方程式に従う多数の状態点は、相空間 ${tex('(q, p)')} の中を、形を変えながらも囲む面積を変えずに流れます。単振子の相空間に置いた円の上の状態点を同時に進め、それらが囲む多角形の面積を靴ひもの公式で求めて、数値解法ごとに面積が保たれるかを確かめます。`,
  equation: [
    String.raw`\nabla\cdot F = \frac{\partial \dot q}{\partial q} + \frac{\partial \dot p}{\partial p} = \frac{\partial^2 H}{\partial q\,\partial p} - \frac{\partial^2 H}{\partial p\,\partial q} = 0`,
    String.raw`A(t) = \int_{D(t)} dq\,dp = A(0)`,
  ],
  studyHeading: '相空間の流れの発散と面積を求める手順',
  steps: [
    `記号を定めます。${tex('q')} は一般化座標、${tex('p')} は正準運動量、${tex('H(q, p)')} は Hamilton 関数です。相空間の点 ${tex('(q, p)')} の速度は正準方程式の右辺
      ${eq(String.raw`F(q, p) = \left(\dot q,\ \dot p\right) = \left(\frac{\partial H}{\partial p},\ -\frac{\partial H}{\partial q}\right)`)}
      です。時刻 0 の点 ${tex('(q_0, p_0)')} を時刻 ${tex('t')} の点へ移す写像を ${tex(String.raw`\Phi_t`)}、初めの領域を ${tex('D(0)')}、その像を ${tex(String.raw`D(t) = \Phi_t(D(0))`)}、その面積を ${tex(String.raw`A(t) = \int_{D(t)} dq\,dp`)} とします。${tex('D(0)')} の各点は、同じ方程式に従う別々の初期状態です。`,
    `流れ ${tex('F')} の発散を計算します。
      ${eq(String.raw`\nabla\cdot F = \frac{\partial}{\partial q}\left(\frac{\partial H}{\partial p}\right) + \frac{\partial}{\partial p}\left(-\frac{\partial H}{\partial q}\right) = \frac{\partial^2 H}{\partial q\,\partial p} - \frac{\partial^2 H}{\partial p\,\partial q}`)}
      ${tex('H')} の2階の偏導関数が連続なら、偏微分の順序を交換できるので ${tex(String.raw`\nabla\cdot F = 0`)} です。発散が 0 の流れは、領域の面積を変えません。このことはページの最後で証明します。`,
    `単振子に当てはめます。${tex('m')} は質量、${tex('l')} は糸の長さ、${tex('g')} は重力加速度、${tex(String.raw`q = \theta`)} は振れ角です。
      ${eq(String.raw`F(\theta, p) = \left(\frac{p}{m l^2},\ -m g l\sin\theta\right)`)}
      ${eq(String.raw`\frac{\partial \dot\theta}{\partial \theta} = \frac{\partial}{\partial \theta}\frac{p}{m l^2} = 0,\qquad \frac{\partial \dot p}{\partial p} = \frac{\partial}{\partial p}\left(-m g l\sin\theta\right) = 0`)}
      で、どの点でも ${tex(String.raw`\nabla\cdot F = 0`)} です。画面は中心差分で発散を求めます（${coreDoc('analytical', 'flow_divergence', '流れの発散の説明')}）。`,
    `面積を数で求めます。中心 ${tex(String.raw`(\theta_c, p_c)`)}、半径 ${tex('r')} の円に内接する正 ${tex('N')} 角形の頂点
      ${eq(String.raw`\theta_i = \theta_c + r\cos\frac{2\pi i}{N},\qquad p_i = p_c + r\sin\frac{2\pi i}{N},\qquad i = 0, \ldots, N - 1`)}
      を初期状態にします（${coreDoc('analytical', 'circle_polygon', '頂点の説明')}）。この多角形の面積は、頂角 ${tex(String.raw`2\pi/N`)} の二等辺三角形 ${tex('N')} 個の和で
      ${eq(String.raw`A_0 = N\cdot\frac{1}{2} r^2\sin\frac{2\pi}{N} = \frac{N}{2} r^2 \sin\frac{2\pi}{N}`)}
      です（${coreDoc('analytical', 'regular_polygon_area', '正多角形の面積の説明')}）。各頂点を数値解法で進め、頂点を順に結んだ多角形の面積を靴ひもの公式
      ${eq(String.raw`A = \frac{1}{2}\sum_{i=0}^{N-1}\left(\theta_i\,p_{i+1} - \theta_{i+1}\,p_i\right),\qquad (\theta_N, p_N) = (\theta_0, p_0)`)}
      で求めます（${coreDoc('analytical', 'shoelace_area', '靴ひもの公式の説明')}）。頂点の間を直線で結ぶので、この面積は領域 ${tex('D(t)')} の面積の近似です。`,
    `数値解法の1ステップの写像が面積を何倍にするかは、そのヤコビ行列式で決まります。Euler 法 ${tex(String.raw`\theta_{n+1} = \theta_n + \Delta t\,p_n/(ml^2)`)}、${tex(String.raw`p_{n+1} = p_n - \Delta t\,mgl\sin\theta_n`)} では
      ${eq(String.raw`\det\begin{pmatrix} 1 & \Delta t/(m l^2) \\ -\Delta t\,m g l\cos\theta_n & 1 \end{pmatrix} = 1\cdot 1 - \frac{\Delta t}{m l^2}\left(-\Delta t\,m g l\cos\theta_n\right)`)}
      ${eq(String.raw`= 1 + \Delta t^2\,\frac{m g l}{m l^2}\cos\theta_n = 1 + \Delta t^2\,\frac{g}{l}\cos\theta_n`)}
      です（${coreDoc('analytical', 'pendulum_euler_area_factor', 'Euler 法の面積の倍率の説明')}）。${tex(String.raw`|\theta_n| < \pi/2`)} では 1 より大きく、面積はステップごとに広がります。`,
    `シンプレクティック Euler 法 ${tex(String.raw`p_{n+1} = p_n - \Delta t\,mgl\sin\theta_n`)}、${tex(String.raw`\theta_{n+1} = \theta_n + \Delta t\,p_{n+1}/(ml^2)`)} では、${tex(String.raw`\theta_{n+1} = \theta_n + \Delta t\,p_n/(ml^2) - \Delta t^2 (g/l)\sin\theta_n`)} なので
      ${eq(String.raw`\det\begin{pmatrix} 1 - \Delta t^2 (g/l)\cos\theta_n & \Delta t/(m l^2) \\ -\Delta t\,m g l\cos\theta_n & 1 \end{pmatrix} = \left(1 - \Delta t^2\frac{g}{l}\cos\theta_n\right)\cdot 1 - \frac{\Delta t}{m l^2}\left(-\Delta t\,m g l\cos\theta_n\right)`)}
      ${eq(String.raw`= 1 - \Delta t^2\frac{g}{l}\cos\theta_n + \Delta t^2\,\frac{m g l}{m l^2}\cos\theta_n`)}
      ${eq(String.raw`= 1 - \Delta t^2\frac{g}{l}\cos\theta_n + \Delta t^2\frac{g}{l}\cos\theta_n = 1`)}
      で、面積は厳密に保たれます（${coreDoc('analytical', 'symplectic_euler_step', 'シンプレクティック Euler 法の説明')}）。古典的RK4 の行列式は厳密には 1 ではありませんが、1 との差は ${tex(String.raw`\Delta t`)} の高い次数で小さくなります。`,
  ],
  figureAlt: '時間とともに形を変えながら面積を保つ、相空間の状態点の領域。',
  figure: experimentPanel({
    fieldsetLabel: '単振子と初めの領域',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'length', label: '糸の長さ', symbol: 'l', value: 1, min: 0 },
      { name: 'gravity', label: '重力加速度', symbol: 'g', value: 1, min: 0 },
      { name: 'radius', label: '円の半径', symbol: 'r', value: 0.5, min: 0 },
      { name: 'center_q', label: '中心の振れ角', symbol: String.raw`\theta_c`, value: 1 },
      { name: 'center_p', label: '中心の運動量', symbol: 'p_c', value: 0 },
      { name: 'points', label: '頂点の数', symbol: 'N', value: 400, min: 3, max: 4000, step: '1' },
    ],
    dt: 0.05,
    steps: 400,
    sceneHeading: `相空間の領域 ${tex(String.raw`D(t)`)}`,
    sceneCaption: '塗った多角形は数値解法で進めた状態点の領域、灰色の破線は初めの円、灰色の線は分離線 H = 2mgl です。点は領域の中心から出た状態点です。',
    sceneLabel: '単振子の相空間で、多数の状態点が囲む領域が流れる様子',
    sceneHeight: 320,
    readouts: { position: '多角形の面積 A(t)', velocity: '面積の比 A/A₀', exact: '初めの面積 A₀', error: '差 A − A₀' },
    plotsHeading: '面積の比の時間変化',
    tabs: methodTabs('相空間の点を進める数値解法', [
      { id: 'euler', label: 'Euler法' },
      { id: 'symplectic-euler', label: 'シンプレクティック Euler 法' },
      { id: 'rk4', label: '古典的RK4' },
    ]),
    plots: `<div><h3>面積の比 ${tex('A(t)/A_0')}</h3><canvas id="area-chart" role="img"></canvas><p>時間 t</p></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = l = g = 1')}、${tex(String.raw`(\theta_c, p_c) = (1, 0)`)}、${tex('r = 0.5')}、${tex('N = 400')} とします。初めの面積は
      ${eq(String.raw`A_0 = \frac{400}{2}\cdot 0.5^2\cdot\sin\frac{2\pi}{400} = 50\sin\frac{\pi}{200} \approx 0.785366`)}
      で、円の面積 ${tex(String.raw`\pi r^2 = 0.25\pi \approx 0.785398`)} より少し小さい値です。式の形が厳密な値で、小数は近似です。計器の初めの面積は 0.78537 です。`,
    `${tex(String.raw`\Delta t = 0.05`)} の Euler 法の1ステップは、中心 ${tex(String.raw`\theta = 1`)} の近くで面積を
      ${eq(String.raw`1 + 0.05^2\cos 1 = 1 + 0.0025\times 0.540302 \approx 1.001351`)}
      倍にします（近似）。400 ステップ（${tex('t = 20')}）で倍率が積み重なり、面積の比は約 1.83（近似）まで広がります。`,
    `シンプレクティック Euler 法では、1ステップの行列式は厳密に 1 です。400 ステップ後の面積の比は約 0.99993（近似）で、残る差 ${tex(String.raw`7\times 10^{-5}`)} は、引き伸ばされた領域の境界を頂点の間の直線で近似した差です。${tex('N = 1600')} にすると差は約 ${tex(String.raw`4.5\times 10^{-6}`)} に小さくなります。古典的RK4 も約 0.99993（近似）です。`,
  ],
  related: [
    { href: './hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式' },
    { href: './poisson.html', title: '正準変換と Poisson 括弧' },
    { href: './observables.html', title: '温度・圧力・動径分布関数' },
  ],
  footer: 'この画面の計算は、単振子の相空間に置いた多数の状態点の時間発展です。',
  proof: writtenProof([{
    statement: `${tex('H(q, p)')} の2階の偏導関数は連続とし、${tex(String.raw`\Phi_t`)} を正準方程式の流れの写像とします。面積をもつ有界な領域 ${tex('D')} について、${tex(String.raw`\Phi_t(D)`)} の面積は ${tex('D')} の面積に等しいです。`,
    proof: [
      `${tex(String.raw`(q(t), p(t)) = \Phi_t(q_0, p_0)`)} と書き、ヤコビ行列の成分を
        ${eq(String.raw`a = \frac{\partial q}{\partial q_0},\quad b = \frac{\partial q}{\partial p_0},\quad c = \frac{\partial p}{\partial q_0},\quad d = \frac{\partial p}{\partial p_0},\qquad J = ad - bc`)}
        と置きます。${tex(String.raw`\Phi_0`)} は恒等写像なので ${tex('a = d = 1')}、${tex('b = c = 0')}、${tex('J(0) = 1')} です。`,
      `${tex(String.raw`H_{pq} = \partial^2 H/\partial p\,\partial q`)} などを点 ${tex('(q(t), p(t))')} の値とします。${tex(String.raw`\dot q = H_p(q, p)`)}、${tex(String.raw`\dot p = -H_q(q, p)`)} を ${tex('q_0')} で偏微分すると、合成関数の微分により
        ${eq(String.raw`\dot a = H_{pq}\,a + H_{pp}\,c,\qquad \dot c = -H_{qq}\,a - H_{qp}\,c`)}
        です。${tex('p_0')} で偏微分すると、同じように
        ${eq(String.raw`\dot b = H_{pq}\,b + H_{pp}\,d,\qquad \dot d = -H_{qq}\,b - H_{qp}\,d`)}
        です。`,
      `${tex('J')} を微分して代入します。
        ${eq(String.raw`\dot J = \dot a\,d + a\,\dot d - \dot b\,c - b\,\dot c`)}
        ${eq(String.raw`= (H_{pq} a + H_{pp} c)\,d + a\,(-H_{qq} b - H_{qp} d) - (H_{pq} b + H_{pp} d)\,c - b\,(-H_{qq} a - H_{qp} c)`)}
        ${eq(String.raw`= H_{pq}\,ad + H_{pp}\,cd - H_{qq}\,ab - H_{qp}\,ad - H_{pq}\,bc - H_{pp}\,cd + H_{qq}\,ab + H_{qp}\,bc`)}
        ${eq(String.raw`= (H_{pq} - H_{qp})(ad - bc)`)}
        です。`,
      `2階の偏導関数が連続なので、Schwarz の定理により ${tex(String.raw`H_{pq} = H_{qp}`)} です。したがって ${tex(String.raw`\dot J = 0`)} で、${tex('J(t) = J(0) = 1')} です。`,
      `${tex(String.raw`\Phi_t`)} は逆写像 ${tex(String.raw`\Phi_{-t}`)} をもつ微分可能な写像なので、重積分の変数変換の公式が使えます。
        ${eq(String.raw`\int_{\Phi_t(D)} dq\,dp = \int_D |J|\,dq_0\,dp_0 = \int_D 1\,dq_0\,dp_0 = \int_D dq_0\,dp_0`)}
        よって ${tex(String.raw`\Phi_t(D)`)} の面積は ${tex('D')} の面積に等しいです。`,
    ],
  }]),
});

const form = formReader(defaults);
let method = 'euler';

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'area-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const pm = 1.15 * frame.values.separatrix_p;
  drawPlot(canvases[0], {
    key: `${key}|phase`,
    label: '単振子の相空間。塗った多角形は状態点の領域、破線は初めの円、灰色の線は分離線。',
    xMin: -Math.PI,
    xMax: Math.PI,
    yMin: -pm,
    yMax: pm,
    polygons: frame.polygons.map(p => ({ x: p.x, y: p.y })),
    lines: [line(frame, 'separatrix-upper'), line(frame, 'separatrix-lower'), line(frame, 'initial'), line(frame, 'outline')],
    dots: [dot(frame, 'center')],
    zeroLabel: 'p = 0',
  });
  drawPlot(canvases[1], {
    key: `${key}|area`,
    label: '面積の比と時間のグラフ。実線は数値解法の多角形、破線は厳密な値 1。',
    xMin: 0,
    xMax: config.steps * config.dt,
    lines: [line(frame, 'area-exact'), line(frame, 'area-ratio')],
    dots: [dot(frame, 'area-now')],
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-liouville.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    return [
      `面積の比 A/A₀ = ${v.ratio.toFixed(6)}`,
      `中心の点での発散 ∇·F = ${v.divergence.toExponential(2)}`,
      `Euler 法の1ステップの倍率（中心 θ_c）= ${v.euler_factor.toFixed(6)}`,
    ].join('\n');
  },
});
bindMethodTabs<string>(next => {
  method = next;
  session.reloadMethod();
});
