import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, vectors } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'coulomb',
  section: { label: '電磁気学' },
  title: 'Coulomb の法則と静電場',
  description: `静止した点電荷のあいだには、距離の2乗に反比例する Coulomb 力が働きます。電荷 ${tex('+1')} と ${tex('-1')} の組が平面の各点に作る電場 ${tex(String.raw`\mathbf{E}`)} を重ね合わせの原理で求め、電場に沿う電気力線を古典的 RK4 でたどります。`,
  equation: [
    String.raw`\mathbf{F} = \frac{1}{4\pi\varepsilon_0}\,\frac{q_1 q_2}{r^2}\,\hat{\mathbf{r}}`,
    String.raw`\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|^3}\,(\mathbf{r} - \mathbf{r}_i)`,
  ],
  equationLabel: 'Coulomb の法則と、点電荷の組が作る電場。',
  equationNote: 'このページの単位 1/(4πε₀) = 1',
  studyHeading: '点電荷の組の電場と電気力線を求める手順',
  steps: [
    `記号を定めます。${tex('q_1, q_2')} は点電荷の電気量、${tex('r')} は電荷間の距離、${tex(String.raw`\hat{\mathbf{r}}`)} は電荷1から電荷2へ向かう単位ベクトル、${tex(String.raw`\varepsilon_0`)} は真空の誘電率、${tex(String.raw`\mathbf{F}`)} は電荷2が受ける力です。${tex(String.raw`q_1 q_2 > 0`)} ならば斥力、${tex(String.raw`q_1 q_2 < 0`)} ならば引力です。このページでは ${tex(String.raw`\frac{1}{4\pi\varepsilon_0} = 1`)} となる単位を使います。`,
    `位置 ${tex(String.raw`\mathbf{r}`)} に置いた試験電荷 ${tex('q')} が受ける力を ${tex('q')} で割ったものが電場です。位置 ${tex(String.raw`\mathbf{r}_i`)} の電荷 ${tex('q_i')} だけがあるとき、${tex(String.raw`\hat{\mathbf{r}} = \frac{\mathbf{r} - \mathbf{r}_i}{|\mathbf{r} - \mathbf{r}_i|}`)} なので
      ${eq(String.raw`\mathbf{E}_i(\mathbf{r}) = \frac{\mathbf{F}}{q} = \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|^2}\cdot\frac{\mathbf{r} - \mathbf{r}_i}{|\mathbf{r} - \mathbf{r}_i|} = \frac{q_i\,(\mathbf{r} - \mathbf{r}_i)}{|\mathbf{r} - \mathbf{r}_i|^3}`)}
      です。電荷が複数あるときは、各電荷の力をベクトルとして足したものが全体の力です（重ね合わせの原理）。したがって ${tex(String.raw`\mathbf{E} = \sum_i \mathbf{E}_i`)} です（${coreDoc('electromagnetism', 'coulomb_field', '重ね合わせた電場の説明')}）。`,
    `電荷 ${tex('q_1 = +1')} を ${tex('(-1, 0)')}、${tex('q_2 = -1')} を ${tex('(1, 0)')} に置きます。点 ${tex('(x, y)')} の電場の成分は
      ${eq(String.raw`E_x = \frac{x + 1}{\bigl((x + 1)^2 + y^2\bigr)^{3/2}} - \frac{x - 1}{\bigl((x - 1)^2 + y^2\bigr)^{3/2}}`)}
      ${eq(String.raw`E_y = \frac{y}{\bigl((x + 1)^2 + y^2\bigr)^{3/2}} - \frac{y}{\bigl((x - 1)^2 + y^2\bigr)^{3/2}}`)}
      です。どちらも有限回の四則演算と平方根なので、値は厳密です。`,
    `二つの電荷を結ぶ線分の垂直二等分線 ${tex('x = 0')} では、二つの分母はどちらも ${tex('(1 + y^2)^{3/2}')} です。
      ${eq(String.raw`E_x(0, y) = \frac{1}{(1 + y^2)^{3/2}} - \frac{-1}{(1 + y^2)^{3/2}} = \frac{2}{(1 + y^2)^{3/2}}`)}
      ${eq(String.raw`E_y(0, y) = \frac{y - y}{(1 + y^2)^{3/2}} = 0`)}
      二等分線の上の電場は、正電荷から負電荷へ向かう ${tex('x')} 軸の向きです。`,
    `電気力線は、各点で電場に接する曲線です。弧長 ${tex('s')} を媒介変数にすると
      ${eq(String.raw`\frac{d\mathbf{r}}{ds} = \frac{\mathbf{E}(\mathbf{r})}{|\mathbf{E}(\mathbf{r})|}`)}
      という微分方程式になります。正電荷のまわりの半径 ${tex('0.08')} の円周上の16点から、刻み ${tex(String.raw`\Delta s = 0.01`)} の古典的 RK4 でこの方程式を解き、負電荷から距離 ${tex('0.05')} 未満に入るか図の範囲を出たところで止めます（${coreDoc('electromagnetism', 'field_line', '電気力線をたどる計算の説明')}）。たどった曲線は近似です。`,
    `電荷がすべて ${tex('x')} 軸上にあるとき、${tex(String.raw`\cos\theta_i = \frac{x - x_i}{|\mathbf{r} - \mathbf{r}_i|}`)} として
      ${eq(String.raw`\Psi = q_1\cos\theta_1 + q_2\cos\theta_2`)}
      は電気力線に沿って一定です（${coreDoc('electromagnetism', 'axial_flux_function', '力線に沿って一定な量の説明')}）。たどった力線の上で ${tex(String.raw`\Psi`)} が動いた最大の幅を、力線の近似の差として図の下に示します。`,
  ],
  figureAlt: '正電荷と負電荷のまわりの電場の向きの矢印と、正電荷から出て負電荷に入る電気力線。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">点電荷の組の電場 ${tex(String.raw`\mathbf{E}`)} と電気力線</h2><div class="legend"><span><i class="numerical"></i>RK4 でたどった電気力線（近似）</span><span><i class="analytical"></i>厳密な電場</span></div></div>
        <div class="plot-pair">
          <div><h3>電場の向きと電気力線</h3><canvas id="field-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。橙の矢印は各格子点の電場の向き（長さはそろえた）、青の実線は電気力線です。点 ${tex('(0, 1)')} の灰色の矢印は各電荷の寄与 ${tex(String.raw`\mathbf{E}_1, \mathbf{E}_2`)}、青緑の破線の矢印はその和 ${tex(String.raw`\mathbf{E}`)} です。</p></div>
          <div><h3>垂直二等分線上の電場 ${tex('E_x(0, y)')}</h3><canvas id="bisector-chart" role="img"></canvas><p>横軸 ${tex('y')}。破線は ${tex(String.raw`E_x(0, y) = \frac{2}{(1 + y^2)^{3/2}}`)}、点は ${tex('y = 1')} の値です。</p></div>
        </div>
        <div class="readouts">
          <div><span>${tex('E_x(0, 1)')}（厳密な値）</span><output id="field-x">—</output></div>
          <div><span>${tex('E_y(0, 1)')}（厳密な値）</span><output id="field-y">—</output></div>
          <div><span>${tex(String.raw`|\mathbf{E}(0, 1)|`)}（厳密な値）</span><output id="field-size">—</output></div>
          <div><span>力線に沿った ${tex(String.raw`\Psi`)} のずれの最大値（近似の差）</span><output id="flux-drift">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="点 (0, 1) の電場の内訳">
          <thead><tr><th>電場</th><th>${tex('x')} 成分</th><th>${tex('y')} 成分</th></tr></thead>
          <tbody id="parts-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `点 ${tex(String.raw`\mathbf{r} = (0, 1)`)} の電場を求めます。電荷1からの変位は ${tex(String.raw`\mathbf{r} - \mathbf{r}_1 = (1, 1)`)}、その長さの3乗は ${tex(String.raw`(\sqrt{2})^3 = 2\sqrt{2}`)} なので
      ${eq(String.raw`\mathbf{E}_1 = \frac{+1}{2\sqrt{2}}\,(1, 1) = \left(\frac{\sqrt{2}}{4},\ \frac{\sqrt{2}}{4}\right)`)}
      です。電荷2からの変位は ${tex('(-1, 1)')}、長さの3乗は同じく ${tex(String.raw`2\sqrt{2}`)} なので
      ${eq(String.raw`\mathbf{E}_2 = \frac{-1}{2\sqrt{2}}\,(-1, 1) = \left(\frac{\sqrt{2}}{4},\ -\frac{\sqrt{2}}{4}\right)`)}
      です。`,
    `二つを足すと ${tex('y')} 成分が打ち消し合い、
      ${eq(String.raw`\mathbf{E}(0, 1) = \left(\frac{\sqrt{2}}{2},\ 0\right) \approx (0.707107,\ 0)`)}
      です。分数と根号の形が厳密な値、小数は6桁に丸めた値です。垂直二等分線の式でも ${tex(String.raw`E_x(0, 1) = \frac{2}{2^{3/2}} = \frac{1}{\sqrt{2}}`)} で一致します。図の下の値はライブラリが返した値です。`,
  ],
  related: [
    { href: './potential.html', title: '静電ポテンシャルと電位' },
    { href: './gauss.html', title: 'Gauss の法則' },
    { href: './two-body.html', title: '中心力場と2体問題' },
  ],
  footer: 'この画面の計算は、点電荷の組の電場の重ね合わせと、RK4 でたどった電気力線です。',
});

let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  drawPlot(document.querySelector<HTMLCanvasElement>('#field-chart')!, {
    label: '正電荷と負電荷の電場の向きと電気力線。',
    xMin: -4,
    xMax: 4,
    yMin: -3,
    yMax: 3,
    equalAspect: true,
    lines: figure.series.filter(item => item.name.startsWith('line')).map(item => line(figure, item.name)),
    vectors: [...vectors(figure, 'grid'), ...vectors(figure, 'part'), ...vectors(figure, 'field')],
    dots: [dot(figure, 'plus', '+1'), dot(figure, 'minus', '−1'), dot(figure, 'hand', '(0, 1)')],
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#bisector-chart')!, {
    label: '垂直二等分線上の電場の x 成分。',
    xMin: -3,
    xMax: 3,
    yMin: 0,
    yMax: 2.2,
    lines: [line(figure, 'bisector')],
    dots: [dot(figure, 'bisector point', 'y = 1')],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const v = figure.values;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('field-x', v.ex.toFixed(6));
  value('field-y', v.ey.toFixed(6));
  value('field-size', v.magnitude.toFixed(6));
  value('flux-drift', v.flux_drift.toExponential(2));
  const row = (name: string, x: number, y: number) => `<tr><td>${name}</td><td>${x.toFixed(6)}</td><td>${y.toFixed(6)}</td></tr>`;
  document.querySelector('#parts-table')!.innerHTML = [
    row(`電荷1の寄与 ${tex(String.raw`\mathbf{E}_1`)}`, v.e1x, v.e1y),
    row(`電荷2の寄与 ${tex(String.raw`\mathbf{E}_2`)}`, v.e2x, v.e2y),
    row(`和 ${tex(String.raw`\mathbf{E}`)}`, v.ex, v.ey),
  ].join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('em/coulomb', { px: 0, py: 1 }));
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
