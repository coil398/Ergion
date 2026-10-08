import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, lessonFigure, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, LessonFigure, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';
import { onThemeChange } from './theme';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'analytical/euler-lagrange',
  length: 1,
  gravity: 1,
  amplitude: 90,
  dt: 0.01,
  steps: 1500,
};

renderLesson({
  id: 'euler-lagrange',
  section: { label: '解析力学' },
  title: '最小作用の原理と Euler–Lagrange 方程式',
  description: `端の位置と時刻を決めた経路のうち、実際の運動は作用 ${tex(String.raw`S = \int L\,dt`)} を停留させる経路です。作用の変分から Euler–Lagrange 方程式を導き、大きく振れる単振子の方程式 ${tex(String.raw`\theta'' + \frac{g}{l}\sin\theta = 0`)} と、楕円積分で表した厳密な周期を求めます。`,
  equation: [
    String.raw`\delta S = 0 \iff \frac{d}{dt}\frac{\partial L}{\partial \dot q} - \frac{\partial L}{\partial q} = 0`,
    String.raw`\theta'' + \frac{g}{l}\sin\theta = 0,\qquad T = 4\sqrt{\frac{l}{g}}\,K\!\left(\sin\frac{\theta_0}{2}\right)`,
  ],
  equationLabel: '作用の変分が 0 であることと Euler–Lagrange 方程式は同値。単振子の方程式と、完全楕円積分 K による周期。',
  studyHeading: '作用の変分から単振子の周期への手順',
  steps: [
    `記号を定めます。${tex('q(t)')} は一般化座標、${tex(String.raw`\dot q = dq/dt`)} は一般化速度、${tex(String.raw`L(q, \dot q, t) = T - V`)} は Lagrange 関数（運動エネルギー ${tex('T')} から位置エネルギー ${tex('V')} を引いたもの）です。端の条件 ${tex('q(t_1) = q_1')}、${tex('q(t_2) = q_2')} を満たす経路に対して、作用を
      ${eq(String.raw`S[q] = \int_{t_1}^{t_2} L\big(q(t), \dot q(t), t\big)\,dt`)}
      と定めます。経路を ${tex(String.raw`q + \varepsilon\eta`)} とずらします。${tex(String.raw`\varepsilon`)} は実数、${tex(String.raw`\eta(t)`)} は端で ${tex(String.raw`\eta(t_1) = \eta(t_2) = 0`)} となる関数なので、ずらした経路も同じ端を通ります。`,
    `作用を ${tex(String.raw`\varepsilon`)} の関数 ${tex(String.raw`S(\varepsilon) = S[q + \varepsilon\eta]`)} とみて微分します。積分の中で合成関数の微分を使うと
      ${eq(String.raw`\frac{dS}{d\varepsilon} = \int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q}\,\eta + \frac{\partial L}{\partial \dot q}\,\dot\eta\right)dt`)}
      です（偏微分は ${tex(String.raw`(q + \varepsilon\eta, \dot q + \varepsilon\dot\eta, t)`)} で評価します）。`,
    `第2項を部分積分します。
      ${eq(String.raw`\int_{t_1}^{t_2}\frac{\partial L}{\partial \dot q}\,\dot\eta\,dt = \left[\frac{\partial L}{\partial \dot q}\,\eta\right]_{t_1}^{t_2} - \int_{t_1}^{t_2}\frac{d}{dt}\!\left(\frac{\partial L}{\partial \dot q}\right)\eta\,dt`)}
      端で ${tex(String.raw`\eta = 0`)} なので、括弧の項は 0 です。${tex(String.raw`\varepsilon = 0`)} と置くと
      ${eq(String.raw`\left.\frac{dS}{d\varepsilon}\right|_{\varepsilon = 0} = \int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q} - \frac{d}{dt}\frac{\partial L}{\partial \dot q}\right)\eta\,dt`)}
      です。`,
    `作用が停留する（${tex(String.raw`\delta S = 0`)}）とは、端で 0 となるすべての ${tex(String.raw`\eta`)} で上の積分が 0 になることです。最後の証明で示す変分法の基本補題により、括弧の中が恒等的に 0 になります。
      ${eq(String.raw`\frac{d}{dt}\frac{\partial L}{\partial \dot q} - \frac{\partial L}{\partial q} = 0`)}
      これが Euler–Lagrange 方程式です。座標が ${tex('s')} 個あるときは、各 ${tex(String.raw`q_j`)} だけをずらして同じ式を ${tex(String.raw`j = 1, \ldots, s`)} について得ます。`,
    `長さ ${tex('l')} の糸の先の質量 ${tex('m')} の単振子で、鉛直下向きからの振れ角 ${tex(String.raw`\theta`)} を一般化座標にとります。おもりの速さは ${tex(String.raw`l\dot\theta`)}、最下点からの高さは ${tex(String.raw`l(1 - \cos\theta)`)} なので
      ${eq(String.raw`L = \frac{1}{2} m l^2\dot\theta^2 - m g l\,(1 - \cos\theta)`)}
      です（${coreDoc('analytical', 'pendulum_lagrangian', '単振子の Lagrange 関数の説明')}）。偏微分は
      ${eq(String.raw`\frac{\partial L}{\partial\dot\theta} = m l^2\dot\theta,\qquad \frac{d}{dt}\frac{\partial L}{\partial\dot\theta} = m l^2\ddot\theta,\qquad \frac{\partial L}{\partial\theta} = -m g l\sin\theta`)}
      で、Euler–Lagrange 方程式は
      ${eq(String.raw`m l^2\ddot\theta + m g l\sin\theta = 0`)}
      ${eq(String.raw`\ddot\theta + \frac{g}{l}\sin\theta = 0`)}
      です（${coreDoc('analytical', 'pendulum_acceleration', '角加速度の説明')}）。糸の張力は式に現れません。`,
    `振幅 ${tex(String.raw`\theta_0`)} で静止から放します。方程式に ${tex(String.raw`\dot\theta`)} を掛けると
      ${eq(String.raw`\dot\theta\ddot\theta + \frac{g}{l}\sin\theta\,\dot\theta = \frac{d}{dt}\left(\frac{1}{2}\dot\theta^2 - \frac{g}{l}\cos\theta\right) = 0`)}
      なので括弧の中は一定で、${tex(String.raw`t = 0`)} の値 ${tex(String.raw`-\frac{g}{l}\cos\theta_0`)} に等しくなります。
      ${eq(String.raw`\dot\theta^2 = \frac{2g}{l}(\cos\theta - \cos\theta_0)`)}
      ${tex(String.raw`\cos\theta = 1 - 2\sin^2\frac{\theta}{2}`)} を使い、${tex(String.raw`k = \sin\frac{\theta_0}{2}`)} と置くと
      ${eq(String.raw`\dot\theta^2 = \frac{4g}{l}\left(k^2 - \sin^2\frac{\theta}{2}\right)`)}
      です。`,
    `最下点 ${tex(String.raw`\theta = 0`)} から ${tex(String.raw`\theta_0`)} までにかかる時間は周期の ${tex('1/4')} です。${tex(String.raw`\sin\frac{\theta}{2} = k\sin\phi`)} と置換すると、${tex(String.raw`\frac{1}{2}\cos\frac{\theta}{2}\,d\theta = k\cos\phi\,d\phi`)}、${tex(String.raw`\dot\theta = 2\sqrt{g/l}\;k\cos\phi`)} なので
      ${eq(String.raw`\frac{d\theta}{\dot\theta} = \frac{2k\cos\phi\,d\phi}{\sqrt{1 - k^2\sin^2\phi}}\cdot\frac{1}{2\sqrt{g/l}\;k\cos\phi} = \sqrt{\frac{l}{g}}\,\frac{d\phi}{\sqrt{1 - k^2\sin^2\phi}}`)}
      ${eq(String.raw`\frac{T}{4} = \sqrt{\frac{l}{g}}\int_0^{\pi/2}\frac{d\phi}{\sqrt{1 - k^2\sin^2\phi}} = \sqrt{\frac{l}{g}}\,K(k)`)}
      です。${tex('K')} は第1種完全楕円積分です（${coreDoc('analytical', 'pendulum_period', '厳密な周期の説明')}）。振幅が小さいと ${tex(String.raw`K \to \pi/2`)} で、単振動の周期 ${tex(String.raw`2\pi\sqrt{l/g}`)} に戻ります。`,
    `${tex('K')} は Gauss の公式
      ${eq(String.raw`K(k) = \frac{\pi}{2\,\mathrm{AGM}\big(1, \sqrt{1 - k^2}\big)}`)}
      で計算します。算術幾何平均 ${tex(String.raw`\mathrm{AGM}`)} は ${tex(String.raw`a_{n+1} = (a_n + b_n)/2`)}、${tex(String.raw`b_{n+1} = \sqrt{a_n b_n}`)} の共通の極限で、差 ${tex(String.raw`a_{n+1} - b_{n+1} = (\sqrt{a_n} - \sqrt{b_n})^2/2`)} が2乗で縮むので数回で収束します（${coreDoc('analytical', 'elliptic_k', '楕円積分の説明')}）。時刻ごとの厳密解は Jacobi の楕円関数で
      ${eq(String.raw`\theta(t) = 2\arcsin\!\big(k\,\mathrm{sn}(K - \omega_0 t,\,k)\big),\qquad \omega_0 = \sqrt{g/l}`)}
      です（${coreDoc('analytical', 'pendulum_angle', '振れ角の厳密解の説明')}）。画面の破線はこの式の値です。`,
    `数値解は ${tex(String.raw`\theta' = \omega`)}、${tex(String.raw`\omega' = -\frac{g}{l}\sin\theta`)} を選んだ方法で進めた近似です。1ステップの前後で ${tex(String.raw`\theta`)} の符号が変わったら、2点を結ぶ直線の根
      ${eq(String.raw`t_\ast = t_n + \Delta t\,\frac{\theta_n}{\theta_n - \theta_{n+1}}`)}
      を横切った時刻とします。隣り合う横切りの間隔は半周期なので、${tex('n')} 回の横切り ${tex(String.raw`t_1 < \cdots < t_n`)} から
      ${eq(String.raw`T \approx \frac{2\,(t_n - t_1)}{n - 1}`)}
      とします（${coreDoc('analytical', 'period_from_crossings', '周期の測り方の説明')}）。`,
    `作用が真の経路で停留することを数値で確かめます。区間 ${tex(String.raw`[0, T/4]`)} を ${tex('n = 400')} 等分し、${tex(String.raw`\Delta t = T/(4n)`)}、${tex(String.raw`q_i`)} を厳密解の値として、作用を台形則で
      ${eq(String.raw`S[q] \approx \sum_{i=0}^{n-1}\left[\frac{1}{2} m l^2\left(\frac{q_{i+1} - q_i}{\Delta t}\right)^2 - \frac{V(q_i) + V(q_{i+1})}{2}\right]\Delta t`)}
      と近似します（${coreDoc('analytical', 'discrete_action', '離散的な作用の説明')}）。ずらし方は ${tex(String.raw`\eta(t) = \sin(4\pi t/T)`)} で、端で 0 です。${tex(String.raw`S(\varepsilon)`)} の傾きは中心差分 ${tex(String.raw`\big(S(10^{-3}) - S(-10^{-3})\big)/(2\cdot 10^{-3})`)} で求めます。`,
  ],
  figureAlt: '端を止めた単振子の経路をずらした曲線群と、作用 S(ε) が ε = 0 で最小になるグラフ。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">ずらした経路と作用 ${tex(String.raw`S(\varepsilon)`)}</h2><div class="legend"><span><i class="numerical"></i>離散的な作用（近似）</span><span><i class="analytical"></i>厳密解の経路</span></div></div>
        <div class="plot-pair">
          <div><h3>振れ角の経路 ${tex(String.raw`q(t) + \varepsilon\eta(t)`)}</h3><canvas id="path-chart" role="img"></canvas><p>時間 t。破線は真の経路、細い破線は ${tex(String.raw`\varepsilon = \pm 0.2, \pm 0.4`)} の経路です。</p></div>
          <div><h3>作用 ${tex(String.raw`S(\varepsilon)`)}</h3><canvas id="action-chart" role="img"></canvas><p>ずらす量 ε。点は ${tex(String.raw`\varepsilon = 0`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex(String.raw`\varepsilon = 0`)} での ${tex(String.raw`dS/d\varepsilon`)}（近似）</span><output id="slope">—</output></div>
          <div><span>${tex('S(0)')}（近似）</span><output id="action0">—</output></div>
          <div><span>${tex('S(0.2)')}（近似）</span><output id="action-plus">—</output></div>
          <div><span>${tex('S(-0.2)')}（近似）</span><output id="action-minus">—</output></div>
        </div>
      </section>
      ${experimentPanel({
        fieldsetLabel: '単振子',
        fields: [
          { name: 'length', label: '糸の長さ', symbol: 'l', value: 1, min: 0 },
          { name: 'gravity', label: '重力加速度', symbol: 'g', value: 1, min: 0 },
          { name: 'amplitude', label: '振幅（度）', symbol: String.raw`\theta_0`, value: 90, min: 0, max: 179 },
        ],
        dt: 0.01,
        steps: 1500,
        sceneHeading: '大きく振れる単振子',
        sceneCaption: '点は数値解のおもりの位置、青緑の破線の輪は同じ時刻の厳密解の位置、細い破線は鉛直線です。',
        sceneLabel: '支点のまわりを大きく振れる単振子',
        sceneHeight: 300,
        readouts: { position: '振れ角 θ', velocity: '角速度 θ′', exact: '厳密解の振れ角', error: '振れ角の差 θ − θ_exact' },
        plotsHeading: '振れ角の時間変化と位相図',
        tabs: methodTabs('この方程式の数値解法'),
        plots: `<div class="plot-grid"><div class="plot-main"><h3>振れ角の時間変化 ${tex(String.raw`\theta(t)`)}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>振れ角と角速度の位相図</h3><canvas id="phase-chart" role="img"></canvas><p>振れ角 θ（縦軸は角速度 θ′）</p></div></div>`,
        code: codeDisclosure('pendulum'),
      })}`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('l = 1')}、${tex('g = 1')}、${tex(String.raw`\theta_0 = 90^\circ = \pi/2`)} とします。${tex(String.raw`k = \sin\frac{\pi}{4} = \frac{1}{\sqrt2}`)}、${tex(String.raw`\sqrt{1 - k^2} = \frac{1}{\sqrt2} \approx 0.7071068`)} です。算術幾何平均の反復は
      ${eq(String.raw`a_1 = \frac{1 + 0.7071068}{2} = 0.8535534,\qquad b_1 = \sqrt{0.7071068} = 0.8408964`)}
      ${eq(String.raw`a_2 = \frac{0.8535534 + 0.8408964}{2} = 0.8472249,\qquad b_2 = \sqrt{0.8535534\cdot 0.8408964} = 0.8472012`)}
      ${eq(String.raw`a_3 = 0.8472130,\qquad b_3 = 0.8472130`)}
      で、3回で小数7桁がそろいます（小数は近似）。`,
    `周期は
      ${eq(String.raw`K = \frac{\pi}{2\cdot 0.8472130} = 1.8540747,\qquad T = 4\cdot 1\cdot 1.8540747 = 7.4162988`)}
      です（近似）。ライブラリの値は <output id="example-period">—</output> です。単振動の周期 ${tex(String.raw`2\pi \approx 6.2831853`)} より約 18% 長くなります。`,
    `既定の ${tex(String.raw`\Delta t = 0.01`)}、1500 ステップ（${tex('t = 15')}）では、振れ角は ${tex(String.raw`t = T/4, 3T/4, 5T/4, 7T/4`)} の4回 0 を横切ります。古典的RK4 で終わりまで再生すると、横切りから測った周期は ${tex('7.41630')}（近似）で、厳密な周期と小数5桁まで一致します。Euler 法ではエネルギーが増えて振幅が広がり、測った周期は ${tex('7.50476')}（近似）に延びます。`,
    `作用の傾きは <output id="example-slope">—</output>（近似）で、0 との差は台形則の誤差 ${tex(String.raw`O(\Delta t^2)`)} の大きさです。${tex(String.raw`S(\pm 0.2)`)} はどちらも ${tex('S(0)')} より大きく、区間 ${tex(String.raw`[0, T/4]`)} では真の経路の作用は最小です。`,
  ],
  related: [
    { href: './noether.html', title: '対称性と保存則' },
    { href: './hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式' },
    { href: './harmonic.html', title: '単振動' },
    { href: './virtual-work.html', title: "仮想仕事の原理と d'Alembert の原理" },
  ],
  footer: 'この画面の計算は、大きく振れる一つの単振子の作用と運動です。',
  proof: writtenProof([{
    statement: `${tex('L')} は3変数について2回連続微分可能、${tex('q')} は ${tex('[t_1, t_2]')} で2回連続微分可能とします。${tex(String.raw`\eta(t_1) = \eta(t_2) = 0`)} となるすべての連続微分可能な ${tex(String.raw`\eta`)} について ${tex(String.raw`\frac{d}{d\varepsilon}S[q + \varepsilon\eta]\big|_{\varepsilon = 0} = 0`)} ならば、${tex('q')} は ${tex('[t_1, t_2]')} のすべての点で Euler–Lagrange 方程式 ${tex(String.raw`\frac{d}{dt}\frac{\partial L}{\partial\dot q} - \frac{\partial L}{\partial q} = 0`)} を満たします。`,
    proof: [
      `${tex(String.raw`L(q + \varepsilon\eta, \dot q + \varepsilon\dot\eta, t)`)} の ${tex(String.raw`\varepsilon`)} による偏微分は、${tex(String.raw`(\varepsilon, t)`)} について連続です。有界閉区間の上では積分と微分を入れかえてよいので、手順2の式
        ${eq(String.raw`S'(0) = \int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q}\,\eta + \frac{\partial L}{\partial \dot q}\,\dot\eta\right)dt`)}
        が成り立ちます。偏微分は真の経路 ${tex(String.raw`(q(t), \dot q(t), t)`)} で評価します。`,
      `${tex('L')} が2回連続微分可能で ${tex('q')} が2回連続微分可能なので、${tex(String.raw`p(t) = \frac{\partial L}{\partial\dot q}(q(t), \dot q(t), t)`)} は連続微分可能です。手順3の部分積分と ${tex(String.raw`\eta(t_1) = \eta(t_2) = 0`)} により
        ${eq(String.raw`S'(0) = \int_{t_1}^{t_2} E(t)\,\eta(t)\,dt,\qquad E(t) = \frac{\partial L}{\partial q} - \frac{dp}{dt}`)}
        で、${tex('E')} は連続です。仮定から、この積分はすべての ${tex(String.raw`\eta`)} で 0 です。`,
      `ある ${tex(String.raw`t_0 \in (t_1, t_2)`)} で ${tex(String.raw`E(t_0) \ne 0`)} と仮定し、${tex(String.raw`E(t_0) > 0`)} とします（負なら ${tex('-E')} で同じ議論をします）。${tex('E')} は連続なので、ある ${tex(String.raw`\delta > 0`)} があって ${tex(String.raw`(t_0 - \delta, t_0 + \delta) \subset (t_1, t_2)`)} の上で ${tex(String.raw`E(t) > E(t_0)/2`)} です。`,
      `${tex(String.raw`a = t_0 - \delta`)}、${tex(String.raw`b = t_0 + \delta`)} として
        ${eq(String.raw`\eta(t) = \begin{cases}(t - a)^2 (b - t)^2 & (a < t < b)\\ 0 & (\text{それ以外})\end{cases}`)}
        と定めます。${tex(String.raw`\eta`)} と ${tex(String.raw`\dot\eta = 2(t - a)(b - t)(a + b - 2t)`)} は ${tex('t = a, b')} で 0 なので、${tex(String.raw`\eta`)} は連続微分可能で、端で 0 です。`,
      `この ${tex(String.raw`\eta`)} は ${tex('(a, b)')} で正、その外で 0 なので
        ${eq(String.raw`\int_{t_1}^{t_2} E\,\eta\,dt = \int_a^b E\,\eta\,dt \ge \frac{E(t_0)}{2}\int_a^b (t - a)^2(b - t)^2\,dt = \frac{E(t_0)}{2}\cdot\frac{(b - a)^5}{30} > 0`)}
        です。これは積分が 0 であることに反します。したがって開区間 ${tex('(t_1, t_2)')} で ${tex('E = 0')} です。`,
      `${tex('E')} は連続なので、端点でも ${tex(String.raw`E(t_1) = \lim_{t \to t_1} E(t) = 0`)}、${tex('E(t_2) = 0')} です。${tex('E = 0')} は Euler–Lagrange 方程式そのものです。`,
    ],
  }]),
});

const pathChart = document.querySelector<HTMLCanvasElement>('#path-chart')!;
const actionChart = document.querySelector<HTMLCanvasElement>('#action-chart')!;
let action: LessonFigure | undefined;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paintAction() {
  if (!action) {
    clearFigure(pathChart);
    clearFigure(actionChart);
    return;
  }
  const figure = action;
  drawPlot(pathChart, {
    label: '真の経路と、端を止めてずらした経路。破線は厳密解、細い破線はずらした経路。',
    lines: [...figure.series.filter(s => s.name === 'shifted'), line(figure, 'true_path')],
    zeroLabel: 'θ = 0',
  });
  drawPlot(actionChart, {
    label: '離散的な作用 S(ε) とずらす量 ε のグラフ。点は ε = 0。',
    lines: [line(figure, 'action')],
    dots: [dot(figure, 'stationary', 'ε = 0')],
  });
}

async function loadAction() {
  try {
    action = await lessonFigure('analytical/euler-lagrange', { length: 1, gravity: 1, amplitude: 90, n: 400 });
    const v = action.values;
    setText('slope', v.slope.toExponential(2));
    setText('action0', v.action0.toFixed(6));
    setText('action-plus', v.action_plus.toFixed(6));
    setText('action-minus', v.action_minus.toFixed(6));
    setText('example-period', `K ≈ ${v.elliptic_k.toFixed(7)}、T ≈ ${v.period.toFixed(7)}`);
    setText('example-slope', v.slope.toExponential(2));
    paintAction();
  } catch (error) {
    console.error(error);
  }
}

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const length = Number(config.length);
  drawPlot(canvases[0], {
    label: '単振子。点は数値解のおもり、輪は厳密解のおもり、線は糸。',
    equalAspect: true,
    xMin: -1.2 * length,
    xMax: 1.2 * length,
    yMin: -1.2 * length,
    yMax: 1.2 * length,
    lines: [line(frame, 'vertical'), line(frame, 'rod')],
    dots: [dot(frame, 'pivot'), { ...dot(frame, 'exact', undefined, true), radius: 9 }, { ...dot(frame, 'bob'), radius: 7 }],
  });
  const times = points.map(p => p.time);
  drawPlot(canvases[1], {
    key: `${key}|angle`,
    label: '振れ角と時間のグラフ。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: config.steps * config.dt,
    lines: [
      { x: times, y: points.map(p => p.position), role: 'numerical' },
      { x: times, y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'θ = 0',
  });
  drawPlot(canvases[2], {
    key: `${key}|phase`,
    label: '振れ角と角速度の位相図。実線は数値解、破線は厳密解。',
    lines: [
      { x: points.map(p => p.position), y: points.map(p => p.velocity), role: 'numerical' },
      { x: points.map(p => p.exact_position), y: points.map(p => p.exact_velocity), role: 'exact' },
    ],
    dots: [{ x: state.position, y: state.velocity, role: 'numerical' }],
    zeroLabel: 'θ′ = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-euler-lagrange.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return `横切りから測った周期 ${v?.measured_period?.toFixed(5) ?? '—'}\n厳密な周期 ${v?.period.toFixed(5) ?? '—'}\n0 を横切った回数 ${v?.crossings ?? '—'}`;
  },
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
window.addEventListener('resize', paintAction);
onThemeChange(paintAction);
void loadAction();
