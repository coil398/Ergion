import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

const levels = [1, 2, 3, 4];

renderLesson({
  id: 'poisson',
  section: { label: '解析力学' },
  title: '正準変換と Poisson 括弧',
  description: `相空間の二つの関数の Poisson 括弧 ${tex(String.raw`\{f, g\}`)} を定め、正準方程式が ${tex(String.raw`\dot f = \{f, H\}`)} と書けることを示します。角運動量の関係 ${tex(String.raw`\{L_x, L_y\} = L_z`)} と、単振動の作用・角変数 ${tex(String.raw`(\theta, I)`)} が ${tex(String.raw`\{\theta, I\} = 1`)} を満たす正準変換であることを、中心差分で計算した値で確かめます。`,
  equation: [
    String.raw`\{f, g\} = \sum_{j}\left(\frac{\partial f}{\partial q_j}\frac{\partial g}{\partial p_j} - \frac{\partial f}{\partial p_j}\frac{\partial g}{\partial q_j}\right)`,
    String.raw`\dot f = \{f, H\},\qquad \{Q, P\} = 1`,
  ],
  studyHeading: 'Poisson 括弧と正準変換を計算する手順',
  steps: [
    `記号を定めます。${tex(String.raw`q = (q_1, \ldots, q_s)`)} は一般化座標、${tex(String.raw`p = (p_1, \ldots, p_s)`)} は正準運動量、${tex('f(q, p)')} と ${tex('g(q, p)')} は相空間の微分可能な関数です。Poisson 括弧を
      ${eq(String.raw`\{f, g\} = \sum_{j=1}^{s}\left(\frac{\partial f}{\partial q_j}\frac{\partial g}{\partial p_j} - \frac{\partial f}{\partial p_j}\frac{\partial g}{\partial q_j}\right)`)}
      と定めます。${tex('f')} と ${tex('g')} を入れかえると符号が変わるので ${tex(String.raw`\{g, f\} = -\{f, g\}`)}、特に ${tex(String.raw`\{f, f\} = 0`)} です。`,
    `座標と運動量どうしの括弧を求めます。${tex(String.raw`\partial q_i/\partial q_j = \delta_{ij}`)}、${tex(String.raw`\partial q_i/\partial p_j = 0`)}、${tex(String.raw`\partial p_i/\partial p_j = \delta_{ij}`)}、${tex(String.raw`\partial p_i/\partial q_j = 0`)} なので
      ${eq(String.raw`\{q_i, p_k\} = \sum_j\left(\delta_{ij}\,\delta_{kj} - 0\cdot 0\right) = \delta_{ik},\qquad \{q_i, q_k\} = 0,\qquad \{p_i, p_k\} = 0`)}
      です。これを基本 Poisson 括弧と呼びます。`,
    `時間変化を括弧で書きます。運動に沿った ${tex('f')} の変化に正準方程式 ${tex(String.raw`\dot q_j = \partial H/\partial p_j`)}、${tex(String.raw`\dot p_j = -\partial H/\partial q_j`)} を代入すると
      ${eq(String.raw`\dot f = \sum_j\left(\frac{\partial f}{\partial q_j}\dot q_j + \frac{\partial f}{\partial p_j}\dot p_j\right) = \sum_j\left(\frac{\partial f}{\partial q_j}\frac{\partial H}{\partial p_j} - \frac{\partial f}{\partial p_j}\frac{\partial H}{\partial q_j}\right) = \{f, H\}`)}
      です。${tex(String.raw`\{f, H\} = 0`)} の関数は保存量で、${tex(String.raw`\{H, H\} = 0`)} から ${tex('H')} 自身も保存されます。`,
    `角運動量 ${tex(String.raw`\mathbf{L} = \mathbf{r}\times\mathbf{p}`)} の成分は ${tex(String.raw`L_x = y p_z - z p_y`)}、${tex(String.raw`L_y = z p_x - x p_z`)}、${tex(String.raw`L_z = x p_y - y p_x`)} です（${coreDoc('analytical', 'angular_momentum_components', '角運動量の成分の説明')}）。偏微分は
      ${eq(String.raw`\left(\frac{\partial L_x}{\partial x}, \frac{\partial L_x}{\partial y}, \frac{\partial L_x}{\partial z}\right) = (0,\ p_z,\ -p_y),\qquad \left(\frac{\partial L_x}{\partial p_x}, \frac{\partial L_x}{\partial p_y}, \frac{\partial L_x}{\partial p_z}\right) = (0,\ -z,\ y)`)}
      ${eq(String.raw`\left(\frac{\partial L_y}{\partial x}, \frac{\partial L_y}{\partial y}, \frac{\partial L_y}{\partial z}\right) = (-p_z,\ 0,\ p_x),\qquad \left(\frac{\partial L_y}{\partial p_x}, \frac{\partial L_y}{\partial p_y}, \frac{\partial L_y}{\partial p_z}\right) = (z,\ 0,\ -x)`)}
      です。定義に代入すると
      ${eq(String.raw`\{L_x, L_y\} = \left(0\cdot z + p_z\cdot 0 + (-p_y)(-x)\right) - \left(0\cdot(-p_z) + (-z)\cdot 0 + y\,p_x\right) = x p_y - y p_x = L_z`)}
      です。添字を ${tex(String.raw`x \to y \to z \to x`)} と入れかえると ${tex(String.raw`\{L_y, L_z\} = L_x`)}、${tex(String.raw`\{L_z, L_x\} = L_y`)} です。`,
    `1自由度の変数の取りかえ ${tex(String.raw`(q, p) \to (Q, P)`)} を考えます。${tex(String.raw`f_Q = \partial f/\partial Q`)} のように書くと、合成関数の微分により ${tex(String.raw`\partial f/\partial q = f_Q Q_q + f_P P_q`)}、${tex(String.raw`\partial f/\partial p = f_Q Q_p + f_P P_p`)} なので
      ${eq(String.raw`\{f, g\} = (f_Q Q_q + f_P P_q)(g_Q Q_p + g_P P_p) - (f_Q Q_p + f_P P_p)(g_Q Q_q + g_P P_q)`)}
      二つの積を展開します。
      ${eq(String.raw`= f_Q g_Q\,Q_q Q_p + f_Q g_P\,Q_q P_p + f_P g_Q\,P_q Q_p + f_P g_P\,P_q P_p - f_Q g_Q\,Q_p Q_q - f_Q g_P\,Q_p P_q - f_P g_Q\,P_p Q_q - f_P g_P\,P_p P_q`)}
      ${tex(String.raw`Q_q Q_p = Q_p Q_q`)}、${tex(String.raw`P_q P_p = P_p P_q`)} なので、${tex(String.raw`f_Q g_Q`)} の項と ${tex(String.raw`f_P g_P`)} の項は
      ${eq(String.raw`f_Q g_Q\,Q_q Q_p - f_Q g_Q\,Q_p Q_q = 0, \qquad f_P g_P\,P_q P_p - f_P g_P\,P_p P_q = 0`)}
      です。残る項をまとめます。
      ${eq(String.raw`= f_Q g_P\,(Q_q P_p - Q_p P_q) + f_P g_Q\,(P_q Q_p - P_p Q_q)`)}
      ${tex(String.raw`P_q Q_p - P_p Q_q = -(Q_q P_p - Q_p P_q)`)} で、括弧の中は ${tex(String.raw`\{Q, P\}`)} なので
      ${eq(String.raw`= (f_Q g_P - f_P g_Q)\,\{Q, P\}`)}
      です。${tex(String.raw`\{Q, P\} = 1`)} なら、${tex('f = Q')}、${tex('f = P')}、${tex('g = H')} と置いて
      ${eq(String.raw`\dot Q = \{Q, H\} = \frac{\partial H}{\partial P},\qquad \dot P = \{P, H\} = -\frac{\partial H}{\partial Q}`)}
      となり、正準方程式の形が保たれます。この取りかえを正準変換と呼びます。`,
    `単振動 ${tex(String.raw`H = \frac{p^2}{2m} + \frac{1}{2} m\omega^2 q^2`)}（${tex('m')} は質量、${tex(String.raw`\omega`)} は角振動数）の作用・角変数を
      ${eq(String.raw`I = \frac{H}{\omega} = \frac{p^2}{2m\omega} + \frac{1}{2} m\omega q^2,\qquad \theta = \operatorname{atan2}(m\omega q,\ p)`)}
      と定めます。逆に解くと
      ${eq(String.raw`q = \sqrt{\frac{2I}{m\omega}}\,\sin\theta,\qquad p = \sqrt{2 I m\omega}\,\cos\theta`)}
      です（${coreDoc('analytical', 'action_angle', '作用・角変数の説明')}、${coreDoc('analytical', 'action_angle_inverse', '逆の変換の説明')}）。${tex(String.raw`H = \omega I`)} なので、正準方程式は ${tex(String.raw`\dot\theta = \partial H/\partial I = \omega`)}、${tex(String.raw`\dot I = -\partial H/\partial\theta = 0`)} です。${tex('(q, p)')} の楕円の上の運動は、${tex('I')} が一定のまま角 ${tex(String.raw`\theta`)} が一定の速さ ${tex(String.raw`\omega`)} で増える運動になります。楕円の半軸は ${tex(String.raw`\sqrt{2I/(m\omega)}`)} と ${tex(String.raw`\sqrt{2Im\omega}`)} で、面積は ${tex(String.raw`\pi\sqrt{2I/(m\omega)}\sqrt{2Im\omega} = 2\pi I`)} です。`,
    `図のために ${tex(String.raw`X = \sqrt{m\omega}\,q = \sqrt{2I}\sin\theta`)}、${tex(String.raw`Y = p/\sqrt{m\omega} = \sqrt{2I}\cos\theta`)} と置きます。楕円は半径 ${tex(String.raw`\sqrt{2I}`)} の円に写り、状態点はその円の上を角速度 ${tex(String.raw`\omega`)} で回ります。${tex(String.raw`\{X, Y\} = \sqrt{m\omega}\cdot\frac{1}{\sqrt{m\omega}} - 0 = 1`)} なので、これも正準変換です。`,
    `画面の括弧の値は、偏微分を刻み ${tex(String.raw`h = 10^{-4}`)} の中心差分
      ${eq(String.raw`\frac{\partial f}{\partial q_j} \approx \frac{f(q + h e_j, p) - f(q - h e_j, p)}{2h}`)}
      で置きかえた近似です（${coreDoc('analytical', 'poisson_bracket', 'Poisson 括弧の差分の説明')}）。${tex('e_j')} は ${tex('j')} 番目の単位ベクトルです。${tex('q')}、${tex('p')}、${tex(String.raw`L_x`)}、${tex(String.raw`L_y`)} は2次以下の多項式なので差分は偏微分に等しく、残る差は丸めの分だけです。${tex(String.raw`\theta`)} の差分の誤差は ${tex('h^2')} に比例します。`,
  ],
  figureAlt: '単振動の相空間の楕円が、作用・角変数によって一定の速さで回る同心円に写る様子。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">相空間の楕円と作用・角変数の円</h2><div class="legend"><span><i class="analytical"></i>等エネルギー線 I = 0.5, 1, 1.5, 2（厳密）</span><span><i class="numerical"></i>時間 T/8 ごとの状態点</span></div></div>
        <div class="plot-pair">
          <div><h3>相空間 ${tex('(q, p)')} の楕円</h3><canvas id="ellipse-chart" role="img"></canvas><p>位置 q（縦軸は運動量 p）</p></div>
          <div><h3>${tex(String.raw`(X, Y) = (\sqrt{2I}\sin\theta,\ \sqrt{2I}\cos\theta)`)} の円</h3><canvas id="circle-chart" role="img"></canvas><p>横軸 X、縦軸 Y。t = 0 の状態点は (q, p) = (1, 0)、(X, Y) = (√2, 0) です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex(String.raw`\{q, p\}`)} の近似</span><output id="bracket-qp">—</output></div>
          <div><span>${tex(String.raw`|\{L_x, L_y\} - L_z|`)} の最大値</span><output id="lz-error">—</output></div>
          <div><span>${tex(String.raw`\{\theta, I\}`)} の近似（${tex('(q, p) = (1, 0)')}）</span><output id="bracket-angle">—</output></div>
          <div><span>${tex(String.raw`\{q, p\}_{\theta, I}`)} の近似</span><output id="bracket-inverse">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" id="angular-table">
          <thead><tr><th>${tex('(x, y, z)')}</th><th>${tex('(p_x, p_y, p_z)')}</th><th>${tex(String.raw`\{L_x, L_y\}`)}（近似）</th><th>${tex('L_z')}（厳密）</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <div class="table-scroll"><table class="value-table" id="action-table">
          <thead><tr><th>${tex('(q, p)')}</th><th>${tex(String.raw`\{\theta, I\}`)}（近似）</th><th>${tex(String.raw`(\theta, I)`)}</th><th>${tex(String.raw`\{q, p\}_{\theta, I}`)}（近似）</th></tr></thead>
          <tbody></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`(x, y, z) = (1, 2, 3)`)}、${tex(String.raw`(p_x, p_y, p_z) = (4, 5, 6)`)} とします。角運動量は
      ${eq(String.raw`L_x = 2\cdot 6 - 3\cdot 5 = -3,\qquad L_y = 3\cdot 4 - 1\cdot 6 = 6,\qquad L_z = 1\cdot 5 - 2\cdot 4 = -3`)}
      で、どれも厳密な値です。手順の式から ${tex(String.raw`\{L_x, L_y\} = x p_y - y p_x = -3`)} です。中心差分で求めた値は <output id="example-lxly">—</output>（近似）です。`,
    `単振動で ${tex('m = 1')}、${tex(String.raw`\omega = 2`)}、${tex('(q, p) = (1, 0)')} とします。
      ${eq(String.raw`I = \frac{0^2}{2\cdot 1\cdot 2} + \frac{1}{2}\cdot 1\cdot 2\cdot 1^2 = 1,\qquad \theta = \operatorname{atan2}(2, 0) = \frac{\pi}{2}`)}
      です。楕円の半軸は ${tex(String.raw`\sqrt{2\cdot 1/2} = 1`)} と ${tex(String.raw`\sqrt{2\cdot 1\cdot 2} = 2`)}、円の半径は ${tex(String.raw`\sqrt{2} \approx 1.41421`)}、1周の時間は ${tex(String.raw`T = 2\pi/\omega = \pi`)} です。根号と ${tex(String.raw`\pi`)} の形が厳密な値で、小数は近似です。`,
    `この点の偏微分は、${tex(String.raw`p^2 + m^2\omega^2 q^2 = 0 + 4 = 4`)} を分母として
      ${eq(String.raw`\frac{\partial\theta}{\partial q} = \frac{2\cdot 0}{4} = 0,\quad \frac{\partial\theta}{\partial p} = -\frac{2\cdot 1}{4} = -\frac{1}{2},\quad \frac{\partial I}{\partial q} = 2\cdot 1 = 2,\quad \frac{\partial I}{\partial p} = \frac{0}{2} = 0`)}
      ${eq(String.raw`\{\theta, I\} = 0\cdot 0 - \left(-\frac{1}{2}\right)\cdot 2 = 1`)}
      で、厳密に 1 です。中心差分で求めた値は <output id="example-angle">—</output>（近似）です。`,
  ],
  related: [
    { href: './hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式' },
    { href: './liouville.html', title: '相空間と Liouville の定理' },
    { href: './born-oppenheimer.html', title: 'Born–Oppenheimer 近似' },
  ],
  footer: 'この画面の計算は、Poisson 括弧の中心差分と、単振動の作用・角変数です。',
  proof: writtenProof([{
    statement: `${tex('m > 0')}、${tex(String.raw`\omega > 0`)} とし、${tex(String.raw`I = \frac{p^2}{2m\omega} + \frac{1}{2} m\omega q^2`)}、${tex(String.raw`\theta = \operatorname{atan2}(m\omega q, p)`)} とします。原点を除くすべての点 ${tex('(q, p)')} で ${tex(String.raw`\{\theta, I\} = 1`)} です。`,
    proof: [
      `${tex(String.raw`D = p^2 + m^2\omega^2 q^2`)} と置きます。原点以外では ${tex('D > 0')} です。${tex(String.raw`\operatorname{atan2}(y, x)`)} の全微分は ${tex(String.raw`(x\,dy - y\,dx)/(x^2 + y^2)`)} なので、${tex(String.raw`y = m\omega q`)}、${tex('x = p')} を代入して
        ${eq(String.raw`d\theta = \frac{p\cdot m\omega\,dq - m\omega q\,dp}{D}`)}
        ${eq(String.raw`\frac{\partial\theta}{\partial q} = \frac{m\omega\,p}{D},\qquad \frac{\partial\theta}{\partial p} = -\frac{m\omega\,q}{D}`)}
        です。`,
      `${tex('I')} の偏微分は
        ${eq(String.raw`\frac{\partial I}{\partial q} = m\omega\,q,\qquad \frac{\partial I}{\partial p} = \frac{p}{m\omega}`)}
        です。`,
      `定義に代入します。
        ${eq(String.raw`\{\theta, I\} = \frac{\partial\theta}{\partial q}\frac{\partial I}{\partial p} - \frac{\partial\theta}{\partial p}\frac{\partial I}{\partial q} = \frac{m\omega\,p}{D}\cdot\frac{p}{m\omega} + \frac{m\omega\,q}{D}\cdot m\omega\,q`)}
        ${eq(String.raw`= \frac{p^2 + m^2\omega^2 q^2}{D} = \frac{D}{D} = 1`)}
        です。したがって ${tex(String.raw`(q, p) \to (\theta, I)`)} は正準変換で、手順の結果から ${tex(String.raw`\dot\theta = \partial H/\partial I = \omega`)}、${tex(String.raw`\dot I = 0`)} が成り立ちます。`,
    ],
  }]),
});

const ellipseChart = document.querySelector<HTMLCanvasElement>('#ellipse-chart')!;
const circleChart = document.querySelector<HTMLCanvasElement>('#circle-chart')!;
let shown: LessonFigure | undefined;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paint() {
  if (!shown) {
    clearFigure(ellipseChart);
    clearFigure(circleChart);
    return;
  }
  const figure = shown;
  const steps = [0, 1, 2, 3, 4, 5, 6, 7];
  drawPlot(ellipseChart, {
    label: '相空間 (q, p) の等エネルギーの楕円と、時間 T/8 ごとの状態点。',
    equalAspect: true,
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
    lines: levels.map(k => line(figure, `ellipse${k}`)),
    dots: steps.map(j => dot(figure, `q${j}`)),
    zeroLabel: 'p = 0',
  });
  drawPlot(circleChart, {
    label: '作用・角変数の円。状態点は円の上を一定の角速度で回る。',
    equalAspect: true,
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
    lines: levels.map(k => line(figure, `circle${k}`)),
    dots: steps.map(j => dot(figure, `c${j}`)),
    zeroLabel: 'Y = 0',
  });
}

function fill(figure: LessonFigure) {
  const v = figure.values;
  const a = figure.arrays;
  setText('bracket-qp', v.qp.toFixed(9));
  setText('lz-error', v.lz_error.toExponential(2));
  setText('bracket-angle', a.theta_action[0].toFixed(9));
  setText('bracket-inverse', a.qp_inverse[0].toFixed(9));
  setText('example-lxly', a.lxly[0].toFixed(9));
  setText('example-angle', a.theta_action[0].toFixed(9));
  const triple = (values: number[]) => `(${values.join(', ')})`;
  document.querySelector('#angular-table tbody')!.innerHTML = a.lz.map((lz, i) => {
    const s = a.samples.slice(6 * i, 6 * i + 6);
    return `<tr><td>${triple(s.slice(0, 3))}</td><td>${triple(s.slice(3))}</td><td>${a.lxly[i].toFixed(9)}</td><td>${lz}</td></tr>`;
  }).join('');
  document.querySelector('#action-table tbody')!.innerHTML = a.theta_action.map((b, i) => {
    const angle = a.angles[2 * i];
    const label = Math.abs(angle - Math.PI / 2) < 1e-12 ? 'π/2' : String(angle);
    return `<tr><td>${triple(a.points.slice(2 * i, 2 * i + 2))}</td><td>${b.toFixed(9)}</td><td>(${label}, ${a.angles[2 * i + 1]})</td><td>${a.qp_inverse[i].toFixed(9)}</td></tr>`;
  }).join('');
}

async function load() {
  setStatus('loading', '計算中');
  try {
    shown = await lessonFigure('analytical/poisson', { mass: 1, omega: 2, h: 1e-4 });
    fill(shown);
    paint();
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
