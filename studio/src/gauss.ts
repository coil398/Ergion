import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, vectors, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Surface = 'sphere' | 'cube';

renderLesson({
  id: 'gauss',
  section: { label: '電磁気学' },
  title: 'Gauss の法則',
  description: `閉曲面を外向きに貫く電場の流束（電束）は、曲面の形によらず、内部にある電荷の和だけで決まります。原点の点電荷の電束を球面と立方体の上の中点則で数値的に求めて ${tex(String.raw`Q/\varepsilon_0`)} と比べ、一様に帯電した球の電場を Gauss の法則から導きます。`,
  equation: [
    String.raw`\oint_S \mathbf{E} \cdot d\mathbf{S} = \frac{Q_{\mathrm{enclosed}}}{\varepsilon_0}`,
    String.raw`\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}`,
  ],
  equationLabel: 'Gauss の法則の積分形と微分形。',
  equationNote: 'このページの単位 1/(4πε₀) = 1、すなわち 1/ε₀ = 4π',
  studyHeading: '閉曲面を貫く電束を求める手順',
  steps: [
    `記号を定めます。${tex('S')} は閉曲面、${tex(String.raw`\mathbf{n}`)} はその外向きの単位法線、${tex('dS')} は面積要素、${tex(String.raw`d\mathbf{S} = \mathbf{n}\,dS`)} です。${tex(String.raw`\Phi = \oint_S \mathbf{E}\cdot\mathbf{n}\,dS`)} を電束、${tex(String.raw`Q_{\mathrm{enclosed}}`)} を ${tex('S')} の内部にある電荷の和、${tex(String.raw`\rho`)} を電荷密度、${tex(String.raw`\varepsilon_0`)} を真空の誘電率と呼びます。このページでは ${tex(String.raw`\frac{1}{4\pi\varepsilon_0} = 1`)} の単位を使うので ${tex(String.raw`\frac{1}{\varepsilon_0} = 4\pi`)} で、電荷 ${tex('Q')} を囲む面の電束は ${tex(String.raw`4\pi Q`)} です（${coreDoc('electromagnetism', 'gauss_flux', '電束の厳密な値の説明')}）。`,
    `原点の電荷 ${tex('Q')} を中心とする半径 ${tex('R')} の球面では、電場は外向きの法線と同じ向きで大きさは一定です。
      ${eq(String.raw`\mathbf{E}\cdot\mathbf{n} = \frac{Q}{R^2},\qquad \oint_S dS = 4\pi R^2`)}
      ${eq(String.raw`\Phi = \frac{Q}{R^2}\cdot 4\pi R^2 = 4\pi Q = \frac{Q}{\varepsilon_0}`)}
      です。面積が ${tex('4\\pi R^2')} であることの証明はページの最後にあります。`,
    `一般の閉曲面では、面を小さな区画に分けて和をとります。球面を極角 ${tex(String.raw`\theta`)} と方位角 ${tex(String.raw`\varphi`)} で
      ${eq(String.raw`\mathbf{r} = \mathbf{c} + R\,(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta),\qquad dS = R^2\sin\theta\,d\theta\,d\varphi`)}
      と表し（${tex(String.raw`\mathbf{c}`)} は球の中心）、${tex(String.raw`\theta`)} を ${tex('n')} 等分、${tex(String.raw`\varphi`)} を ${tex('2n')} 等分した各区画の中点で
      ${eq(String.raw`\Phi_n = \sum_{i=0}^{n-1}\sum_{j=0}^{2n-1} \mathbf{E}(\mathbf{r}_{ij})\cdot\mathbf{n}_{ij}\,R^2\sin\theta_i\,\Delta\theta\,\Delta\varphi,\qquad \Delta\theta = \Delta\varphi = \frac{\pi}{n}`)}
      とします（${coreDoc('electromagnetism', 'sphere_flux_midpoint', '球面の中点則の説明')}）。この値は近似です。`,
    `立方体（中心 ${tex(String.raw`\mathbf{c}`)}、一辺 ${tex('2a')}）では、6枚の面をそれぞれ ${tex(String.raw`n \times n`)} の正方形に分け、一辺 ${tex(String.raw`\Delta = 2a/n`)} の正方形の中心 ${tex(String.raw`\mathbf{r}_k`)} で
      ${eq(String.raw`\Phi_n = \sum_{\text{面}}\sum_k \mathbf{E}(\mathbf{r}_k)\cdot\mathbf{n}\,\Delta^2`)}
      とします（${coreDoc('electromagnetism', 'cube_flux_midpoint', '立方体の中点則の説明')}）。この値も近似です。`,
    `3通りの面で比べます。中心が電荷にある面、中心を ${tex('(0.5, 0.3, 0)')} にずらしても電荷を囲む面、中心を ${tex('(2.6, 0, 0)')} に置いて電荷を囲まない面です。大きさはどれも ${tex('R = 1')}（立方体は ${tex('a = 1')}）です。Gauss の法則により、厳密な電束は前の二つが ${tex(String.raw`4\pi`)}、最後が ${tex('0')} です。電荷を囲まない面では、面に入る電束と出る電束が打ち消し合います。`,
    `全電荷 ${tex('Q')} が半径 ${tex('a')} の球に一様に分布しているとき、電荷密度は ${tex(String.raw`\rho = \frac{3Q}{4\pi a^3}`)} です。中心から半径 ${tex('r')} の球面を Gauss 面にとると、対称性から電場は動径方向で、面の上で大きさ ${tex('E(r)')} は一定です。
      ${eq(String.raw`4\pi r^2\,E(r) = 4\pi\,Q_{\mathrm{enclosed}}(r)`)}
      ${tex(String.raw`r \le a`)} では ${tex(String.raw`Q_{\mathrm{enclosed}} = \rho\cdot\frac{4}{3}\pi r^3 = Q\frac{r^3}{a^3}`)}、${tex('r > a')} では ${tex(String.raw`Q_{\mathrm{enclosed}} = Q`)} なので
      ${eq(String.raw`E(r) = \begin{cases} \dfrac{Q r}{a^3} & (r \le a) \\[1ex] \dfrac{Q}{r^2} & (r > a) \end{cases}`)}
      です（${coreDoc('electromagnetism', 'uniform_ball_field', '一様な球の電場の説明')}）。球の外では、全電荷が中心に集まった点電荷の電場と同じです。`,
  ],
  figureAlt: '原点の点電荷と、中心をずらした Gauss 面の断面、面を貫く電場の矢印。一様に帯電した球の電場の大きさ。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">閉曲面を貫く電束 ${tex(String.raw`\Phi`)}</h2><div class="legend"><span><i class="analytical"></i>Gauss の法則による厳密な電場</span></div></div>
        ${methodTabs('電束を求める面と中点則', [{ id: 'sphere', label: '球面の中点則' }, { id: 'cube', label: '立方体の中点則' }])}
        <div class="plot-pair">
          <div><h3>Gauss 面の断面 ${tex('z = 0')}</h3><canvas id="section-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。原点が電荷 ${tex('Q = 1')} です。青の線は電荷を囲む中心をずらした面、灰色の線は中心が電荷にある面、点線は電荷を囲まない面です。橙の矢印はその面の上の電場の0.15倍です。</p></div>
          <div><h3>一様に帯電した球の電場 ${tex('E(r)')}</h3><canvas id="ball-chart" role="img"></canvas><p>横軸は中心からの距離 ${tex('r')}。${tex('Q = 1')}、${tex('a = 1')}。破線は ${tex('E(r)')}、灰色の線は点電荷の電場 ${tex(String.raw`Q/r^2`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>厳密な電束 ${tex(String.raw`4\pi Q`)}</span><output id="exact">—</output></div>
          <div><span>中心が電荷にある面、${tex('n = 1')}（近似値）</span><output id="flux-one">—</output></div>
          <div><span>中心をずらした面、${tex('n = 8')}（近似値）</span><output id="flux-offset">—</output></div>
          <div><span>電荷を囲まない面、${tex('n = 8')}（近似値）</span><output id="flux-outside">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="分割数ごとの電束">
          <thead><tr><th>分割数 ${tex('n')}</th><th>中心が電荷にある面</th><th>${tex(String.raw`4\pi`)} との差</th><th>中心をずらした面</th><th>${tex(String.raw`4\pi`)} との差</th><th>囲まない面</th></tr></thead>
          <tbody id="flux-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `電荷 ${tex('Q = 1')}、半径 ${tex('R = 1')} とします。厳密な電束は ${tex(String.raw`4\pi \approx 12.566371`)} です。`,
    `中心が電荷にある球面を ${tex('n = 1')} の中点則で計算します。区画は1行だけで、中点は ${tex(String.raw`\theta_0 = \frac{\pi}{2}`)}、${tex(String.raw`\Delta\theta = \Delta\varphi = \pi`)}、${tex(String.raw`\varphi`)} 方向は2区画です。${tex(String.raw`\mathbf{E}\cdot\mathbf{n} = 1`)} なので
      ${eq(String.raw`\Phi_1 = 2 \cdot 1 \cdot 1^2 \cdot \sin\frac{\pi}{2}\cdot\pi\cdot\pi = 2\pi^2 \approx 19.739209`)}
      です。${tex(String.raw`\sin\theta`)} を区間の中央の値1で代表させたので、面積を ${tex(String.raw`2\pi^2`)} と大きく見積もっています。`,
    `中心が電荷にある立方体（${tex('a = 1')}）を ${tex('n = 1')} の中点則で計算します。各面の中心は電荷から距離 ${tex('1')} で、電場は法線の向きに大きさ ${tex('1')}、面積は ${tex('2^2 = 4')} です。
      ${eq(String.raw`\Phi_1 = 6 \cdot 1 \cdot 4 = 24`)}
      です。面の中心は電荷にもっとも近い点なので、電場を大きく見積もっています。分割を増やすと、どちらの面も表のように ${tex(String.raw`4\pi`)} に近づきます。`,
    `一様な球（${tex('Q = 1')}、${tex('a = 1')}）では ${tex(String.raw`E(0.5) = \frac{0.5}{1} = 0.5`)}、${tex('E(1) = 1')}、${tex(String.raw`E(2) = \frac{1}{4} = 0.25`)} で、どれも厳密な値です。表と上の値はライブラリが返した値です。`,
  ],
  related: [
    { href: './coulomb.html', title: 'Coulomb の法則と静電場' },
    { href: './potential.html', title: '静電ポテンシャルと電位' },
    { href: './maxwell.html', title: 'Maxwell 方程式と電磁波' },
    { href: './multiple-integral.html', title: '重積分' },
  ],
  footer: 'この画面の計算は、点電荷の電場が閉曲面を貫く電束の中点則と、一様に帯電した球の電場です。',
  proof: writtenProof([{
    statement: `点電荷 ${tex('Q')} を中心とする半径 ${tex('R')} の球面 ${tex('S')} について
      ${eq(String.raw`\oint_S \mathbf{E}\cdot d\mathbf{S} = \frac{Q}{\varepsilon_0}`)}
      です。値は ${tex('R')} によりません。`,
    proof: [
      `電荷を原点に置きます。球面の点を ${tex(String.raw`\mathbf{r} = R\,\mathbf{n}`)}（${tex(String.raw`|\mathbf{n}| = 1`)}）と書くと、外向きの単位法線は ${tex(String.raw`\mathbf{n}`)} そのものです。Coulomb の法則から
        ${eq(String.raw`\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0}\,\frac{Q}{R^3}\,R\,\mathbf{n} = \frac{Q}{4\pi\varepsilon_0 R^2}\,\mathbf{n}`)}
        ${eq(String.raw`\mathbf{E}\cdot\mathbf{n} = \frac{Q}{4\pi\varepsilon_0 R^2}\,(\mathbf{n}\cdot\mathbf{n}) = \frac{Q}{4\pi\varepsilon_0 R^2}`)}
        で、面の上で一定です。`,
      `球面の面積を求めます。${tex(String.raw`\mathbf{r}(\theta, \varphi) = R(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)`)} とすると
        ${eq(String.raw`\mathbf{r}_\theta = R(\cos\theta\cos\varphi,\ \cos\theta\sin\varphi,\ -\sin\theta),\qquad \mathbf{r}_\varphi = R(-\sin\theta\sin\varphi,\ \sin\theta\cos\varphi,\ 0)`)}
        です。${tex(String.raw`|\mathbf{r}_\theta| = R`)}、${tex(String.raw`|\mathbf{r}_\varphi| = R\sin\theta`)}、${tex(String.raw`\mathbf{r}_\theta\cdot\mathbf{r}_\varphi = R^2(-\cos\theta\sin\theta\cos\varphi\sin\varphi + \cos\theta\sin\theta\sin\varphi\cos\varphi) = 0`)} なので、面積要素は ${tex(String.raw`dS = |\mathbf{r}_\theta \times \mathbf{r}_\varphi|\,d\theta\,d\varphi = R^2\sin\theta\,d\theta\,d\varphi`)} です。`,
      `面積は
        ${eq(String.raw`\oint_S dS = \int_0^{2\pi}\!\!\int_0^{\pi} R^2\sin\theta\,d\theta\,d\varphi = R^2\cdot\bigl[-\cos\theta\bigr]_0^{\pi}\cdot 2\pi = R^2\cdot 2\cdot 2\pi = 4\pi R^2`)}
        です。`,
      `${tex(String.raw`\mathbf{E}\cdot\mathbf{n}`)} は一定なので積分の外に出せます。
        ${eq(String.raw`\oint_S \mathbf{E}\cdot d\mathbf{S} = \frac{Q}{4\pi\varepsilon_0 R^2}\cdot 4\pi R^2 = \frac{Q}{\varepsilon_0}`)}
        です。${tex('R^2')} が約分されるので、値は半径によりません。`,
    ],
  }]),
});

let current: LessonFigure | undefined;
let surface: Surface = 'sphere';
let request = 0;

function paint() {
  if (!current) return;
  const figure = current;
  drawPlot(document.querySelector<HTMLCanvasElement>('#section-chart')!, {
    label: 'Gauss 面の z = 0 の断面と、面を貫く電場の矢印。',
    xMin: -1.6,
    xMax: 3.8,
    yMin: -1.6,
    yMax: 1.6,
    equalAspect: true,
    lines: [line(figure, 'centered surface'), line(figure, 'offset surface'), line(figure, 'outside surface')],
    vectors: vectors(figure, 'flux'),
    dots: [dot(figure, 'charge', 'Q')],
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#ball-chart')!, {
    label: '一様に帯電した球の電場の大きさ。',
    xMin: 0,
    xMax: 3,
    yMin: 0,
    yMax: 1.6,
    lines: [line(figure, 'point charge'), line(figure, 'ball')],
    dots: [dot(figure, 'ball half'), dot(figure, 'ball surface', 'r = a'), dot(figure, 'ball two')],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const { values: v, arrays: a } = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('exact', v.exact.toFixed(6));
  value('flux-one', v.flux_one.toFixed(6));
  value('flux-offset', v.flux_offset.toFixed(6));
  value('flux-outside', v.flux_outside.toExponential(2));
  document.querySelector('#flux-table')!.innerHTML = a.counts.map((n, i) =>
    `<tr><td>${n}</td><td>${a.centered_by_n[i].toFixed(6)}</td><td>${a.centered_error[i].toExponential(2)}</td><td>${a.offset_by_n[i].toFixed(6)}</td><td>${a.offset_error[i].toExponential(2)}</td><td>${a.outside_by_n[i].toExponential(2)}</td></tr>`).join('');
  paint();
}

async function load() {
  const id = ++request;
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('em/gauss', { method: surface, n: 8 });
    if (id !== request) return;
    show(figure);
    setStatus('finished');
  } catch (error) {
    if (id !== request) return;
    console.error(error);
    setStatus('error');
  }
}

bindMethodTabs<Surface>(next => {
  surface = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
