import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, vectors, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'magnetostatics',
  section: { label: '電磁気学' },
  title: '定常電流と静磁場',
  description: `時間的に変化しない電流は、そのまわりに渦状の静磁場を作ります。直線導線と円形電流の磁束密度を Biot–Savart の法則の数値線積分で求めて厳密な式と比べ、導線を囲む閉曲線に沿った周回積分が ${tex(String.raw`\mu_0 I`)} になること（Ampère の法則）を確かめます。`,
  equation: [
    String.raw`d\mathbf{B} = \frac{\mu_0}{4\pi}\,\frac{I\,d\mathbf{l} \times \hat{\mathbf{r}}}{r^2}`,
    String.raw`\oint_C \mathbf{B} \cdot d\mathbf{l} = \mu_0 I_{\mathrm{enclosed}},\qquad \nabla \times \mathbf{B} = \mu_0 \mathbf{J}`,
  ],
  equationLabel: 'Biot–Savart の法則と Ampère の法則。',
  equationNote: 'このページの単位 μ₀/(4π) = 1、すなわち μ₀ = 4π',
  studyHeading: '電流が作る磁束密度を求める手順',
  steps: [
    `記号を定めます。${tex('I')} は導線を流れる電流、${tex(String.raw`d\mathbf{l}`)} は電流の向きを向いた導線の微小な長さ、${tex('r')} はその要素から磁場を求める点までの距離、${tex(String.raw`\hat{\mathbf{r}}`)} はその向きの単位ベクトル、${tex(String.raw`\mathbf{B}`)} は磁束密度、${tex(String.raw`\mu_0`)} は真空の透磁率、${tex(String.raw`\mathbf{J}`)} は電流密度、${tex(String.raw`I_{\mathrm{enclosed}}`)} は閉曲線 ${tex('C')} を貫く電流です。このページでは ${tex(String.raw`\frac{\mu_0}{4\pi} = 1`)} の単位を使います。要素の位置を ${tex(String.raw`\mathbf{r}'`)}、点を ${tex(String.raw`\mathbf{r}`)} とすると、導線全体の磁場は
      ${eq(String.raw`\mathbf{B}(\mathbf{r}) = \int \frac{I\,d\mathbf{l} \times (\mathbf{r} - \mathbf{r}')}{|\mathbf{r} - \mathbf{r}'|^3}`)}
      です。`,
    `${tex('z')} 軸上の ${tex('z = -L')} から ${tex('L')} までの直線導線に、${tex('+z')} の向きに電流 ${tex('I')} が流れているとします。点 ${tex('(r, 0, 0)')} では
      ${eq(String.raw`d\mathbf{l} = (0, 0, dz'),\qquad \mathbf{r} - \mathbf{r}' = (r, 0, -z')`)}
      ${eq(String.raw`d\mathbf{l} \times (\mathbf{r} - \mathbf{r}') = \bigl(0 \cdot (-z') - dz' \cdot 0,\ dz' \cdot r - 0 \cdot (-z'),\ 0 \cdot 0 - 0 \cdot r\bigr) = (0,\ r\,dz',\ 0)`)}
      なので、磁場は ${tex('y')} 方向を向き、
      ${eq(String.raw`B_y = \int_{-L}^{L} \frac{I r}{(r^2 + z'^2)^{3/2}}\,dz'`)}
      です。`,
    `${tex(String.raw`\frac{d}{dz'}\frac{z'}{\sqrt{r^2 + z'^2}} = \frac{(r^2 + z'^2) - z'^2}{(r^2 + z'^2)^{3/2}} = \frac{r^2}{(r^2 + z'^2)^{3/2}}`)} を使うと
      ${eq(String.raw`B_y = \frac{I}{r}\left[\frac{z'}{\sqrt{r^2 + z'^2}}\right]_{-L}^{L} = \frac{2IL}{r\sqrt{r^2 + L^2}}`)}
      です（${coreDoc('electromagnetism', 'finite_wire_field', '有限の直線導線の磁場の説明')}）。${tex(String.raw`L \to \infty`)} では ${tex(String.raw`\frac{L}{\sqrt{r^2 + L^2}} \to 1`)} なので
      ${eq(String.raw`B = \frac{2I}{r} = \frac{\mu_0 I}{2\pi r}`)}
      で、これが無限長直線電流の磁場です。向きは電流の向きに右ねじを進めるときにねじが回る向きで、磁力線は導線を中心とする円です。`,
    `数値線積分では、導線を長さ ${tex(String.raw`\Delta = 2L/N`)} の ${tex('N')} 本の線分に分け、各線分の中点 ${tex(String.raw`z_k = -L + (k + \tfrac{1}{2})\Delta`)} の値で積分を置き換えます（${coreDoc('electromagnetism', 'biot_savart_polyline', 'Biot–Savart の中点則の説明')}）。
      ${eq(String.raw`B_N = \sum_{k=0}^{N-1} \frac{I r\,\Delta}{(r^2 + z_k^2)^{3/2}}`)}
      この値は近似で、${tex('N')} を増やすと厳密な値に近づきます。`,
    `平面 ${tex('z = 0')} 上の半径 ${tex('R')} の円形電流が、中心軸上の点 ${tex('(0, 0, z)')} に作る磁場を求めます。円周の各要素から点までの距離は ${tex(String.raw`\sqrt{R^2 + z^2}`)} で、${tex(String.raw`d\mathbf{l}`)} は点への向きと直交するので、${tex(String.raw`|d\mathbf{l} \times (\mathbf{r} - \mathbf{r}')| = \sqrt{R^2 + z^2}\,dl`)} です。軸に垂直な成分は円周を一周すると打ち消し合い、軸方向の成分はその ${tex(String.raw`\frac{R}{\sqrt{R^2 + z^2}}`)} 倍が残ります。
      ${eq(String.raw`B_z = \oint \frac{I\,dl}{R^2 + z^2}\cdot\frac{R}{\sqrt{R^2 + z^2}} = \frac{I R}{(R^2 + z^2)^{3/2}}\cdot 2\pi R = \frac{2\pi I R^2}{(R^2 + z^2)^{3/2}} = \frac{\mu_0 I R^2}{2(R^2 + z^2)^{3/2}}`)}
      です（${coreDoc('electromagnetism', 'loop_axis_field', '円形電流の軸上の磁場の説明')}）。数値線積分では、円を内接する正 ${tex('N')} 角形に置き換えて中点則を当てます。`,
    `Ampère の法則を確かめます。導線を中心とする半径 ${tex(String.raw`\rho`)} の円では、${tex(String.raw`\mathbf{B}`)} は接線の向きで大きさ ${tex(String.raw`\frac{2I}{\rho}`)} は一定なので
      ${eq(String.raw`\oint_C \mathbf{B}\cdot d\mathbf{l} = \frac{2I}{\rho}\cdot 2\pi\rho = 4\pi I = \mu_0 I`)}
      です。中心をずらした円では ${tex(String.raw`\mathbf{B}\cdot d\mathbf{l}`)} は場所ごとに変わるので、円の媒介変数 ${tex(String.raw`t \in [0, 2\pi]`)} についての積分を Simpson 則（64等分）で近似します（${coreDoc('electromagnetism', 'ampere_circulation', 'Ampère の法則の周回積分の説明')}）。導線を囲む円の値は ${tex(String.raw`4\pi I`)} に、囲まない円の値は ${tex('0')} に近づきます。どの閉曲線でも成り立つことの証明はページの最後にあります。`,
  ],
  figureAlt: '紙面に垂直な直線導線のまわりの同心円状の磁力線と磁場の矢印、および円形電流の中心軸上の磁場の大きさ。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">電流が作る磁束密度 ${tex(String.raw`\mathbf{B}`)}</h2><div class="legend"><span><i class="numerical"></i>Biot–Savart の中点則（近似）</span><span><i class="analytical"></i>厳密な磁場</span></div></div>
        <div class="plot-pair">
          <div><h3>直線導線のまわりの磁場 ${tex('z = 0')}</h3><canvas id="wire-chart" role="img"></canvas><p>横軸 ${tex('x')}、縦軸 ${tex('y')}。原点の導線（${tex('L = 1')}）を紙面の裏から表へ電流 ${tex('I = 1')} が流れます。青の矢印は ${tex('N = 8')} の中点則の磁場の向き（長さはそろえた）、破線は厳密な磁力線の円です。黒の円は導線を囲む Ampère の閉曲線、点線は囲まない閉曲線です。</p></div>
          <div><h3>円形電流の中心軸上の磁場 ${tex('B_z(z)')}</h3><canvas id="axis-chart" role="img"></canvas><p>横軸 ${tex('z')}。${tex('R = 1')}、${tex('I = 1')}。実線は正16角形の中点則、破線は厳密な ${tex(String.raw`\frac{2\pi R^2}{(R^2 + z^2)^{3/2}}`)} です。</p></div>
        </div>
        <div class="readouts">
          <div><span>直線導線 ${tex('N = 8')}、${tex('r = 1')}（近似値）</span><output id="wire-numerical">—</output></div>
          <div><span>直線導線の厳密な値 ${tex(String.raw`\sqrt{2}`)}</span><output id="wire-exact">—</output></div>
          <div><span>円形電流の中心 ${tex('N = 16')}（近似値）</span><output id="loop-numerical">—</output></div>
          <div><span>円形電流の中心の厳密な値 ${tex(String.raw`2\pi`)}</span><output id="loop-exact">—</output></div>
          <div><span>導線を囲む円の ${tex(String.raw`\oint \mathbf{B}\cdot d\mathbf{l}`)}（近似値）</span><output id="ampere-enclosing">—</output></div>
          <div><span>囲まない円の ${tex(String.raw`\oint \mathbf{B}\cdot d\mathbf{l}`)}（近似値）</span><output id="ampere-apart">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" aria-label="線分の数ごとの直線導線の磁場">
          <thead><tr><th>線分の数 ${tex('N')}</th><th>直線導線 ${tex('B_N')}（${tex('r = 1')}）</th><th>${tex(String.raw`\sqrt{2}`)} との差</th></tr></thead>
          <tbody id="wire-table"></tbody>
        </table></div>
        <div class="table-scroll"><table class="value-table" aria-label="辺の数ごとの円形電流の中心の磁場">
          <thead><tr><th>正 ${tex('N')} 角形</th><th>中心の ${tex('B_z')}</th><th>${tex(String.raw`2\pi`)} との差</th></tr></thead>
          <tbody id="loop-table"></tbody>
        </table></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `電流 ${tex('I = 1')}、導線の半分の長さ ${tex('L = 1')}、距離 ${tex('r = 1')} とします。厳密な値は
      ${eq(String.raw`B = \frac{2 \cdot 1 \cdot 1}{1 \cdot \sqrt{1 + 1}} = \sqrt{2} \approx 1.414214`)}
      で、無限長の導線なら ${tex(String.raw`\frac{2 \cdot 1}{1} = 2`)} です。`,
    `線分1本（${tex('N = 1')}）の中点則を手で計算します。中点は ${tex('z_0 = 0')}、長さは ${tex(String.raw`\Delta = 2`)} なので
      ${eq(String.raw`B_1 = \frac{1 \cdot 1 \cdot 2}{(1 + 0)^{3/2}} = 2`)}
      です。導線の中央の値で全体を代表させたため、厳密な ${tex(String.raw`\sqrt{2}`)} より大きくなります。線分を増やすと表のように ${tex(String.raw`\sqrt{2}`)} に近づきます。`,
    `半径 ${tex('R = 1')} の円形電流の中心では ${tex(String.raw`B_z = \frac{2\pi \cdot 1}{1^{3}} = 2\pi \approx 6.283185`)}、${tex('z = 1')} では ${tex(String.raw`B_z = \frac{2\pi}{2^{3/2}} = \frac{\pi}{\sqrt{2}} \approx 2.221441`)} です。正方形（${tex('N = 4')}）に置き換えると、各辺の長さは ${tex(String.raw`\sqrt{2}`)}、中点までの距離は ${tex(String.raw`\frac{\sqrt{2}}{2}`)} なので
      ${eq(String.raw`B_z = 4\cdot\frac{\sqrt{2}\cdot\frac{\sqrt{2}}{2}}{\left(\frac{\sqrt{2}}{2}\right)^3} = 4\cdot\frac{1}{\frac{\sqrt{2}}{4}} = 8\sqrt{2} \approx 11.313708`)}
      です。`,
    `Ampère の法則の厳密な値は ${tex(String.raw`\mu_0 I = 4\pi \approx 12.566371`)} です。表と上の値はライブラリが返した値です。`,
  ],
  related: [
    { href: './lorentz.html', title: '磁場中の荷電粒子' },
    { href: './faraday.html', title: 'Faraday の電磁誘導の法則' },
    { href: './maxwell.html', title: 'Maxwell 方程式と電磁波' },
    { href: './numerical-integration.html', title: '数値積分' },
  ],
  footer: 'この画面の計算は、直線導線と円形電流の Biot–Savart の中点則と、Ampère の法則の周回積分です。',
  proof: writtenProof([{
    statement: `${tex('z')} 軸上の無限長直線電流 ${tex('I')} の磁場 ${tex(String.raw`\mathbf{B} = \frac{\mu_0 I}{2\pi}\,\frac{(-y,\ x)}{x^2 + y^2}`)} について、平面 ${tex('z = 0')} 上で導線を通らない、微分できる閉曲線 ${tex('C')} が導線のまわりを ${tex('w')} 回まわるならば
      ${eq(String.raw`\oint_C \mathbf{B}\cdot d\mathbf{l} = \mu_0 I\,w`)}
      です。導線を1回囲めば ${tex(String.raw`\mu_0 I`)}、囲まなければ ${tex('0')} です。`,
    proof: [
      `閉曲線を ${tex(String.raw`\mathbf{r}(t) = (x(t), y(t))`)}（${tex(String.raw`0 \le t \le 1`)}、${tex(String.raw`\mathbf{r}(0) = \mathbf{r}(1)`)}）とし、極座標で ${tex(String.raw`x = \rho\cos\theta`)}、${tex(String.raw`y = \rho\sin\theta`)} と書きます。${tex(String.raw`\rho(t) > 0`)} で、${tex(String.raw`\theta(t)`)} は連続に選べます。`,
      `微分すると
        ${eq(String.raw`x' = \rho'\cos\theta - \rho\theta'\sin\theta,\qquad y' = \rho'\sin\theta + \rho\theta'\cos\theta`)}
        です。したがって
        ${eq(String.raw`-y\,x' + x\,y' = -\rho\sin\theta(\rho'\cos\theta - \rho\theta'\sin\theta) + \rho\cos\theta(\rho'\sin\theta + \rho\theta'\cos\theta) = \rho^2\theta'(\sin^2\theta + \cos^2\theta) = \rho^2\theta'`)}
        です。`,
      `被積分関数は
        ${eq(String.raw`\mathbf{B}(\mathbf{r}(t))\cdot\mathbf{r}'(t) = \frac{\mu_0 I}{2\pi}\,\frac{-y\,x' + x\,y'}{\rho^2} = \frac{\mu_0 I}{2\pi}\,\theta'(t)`)}
        です。`,
      `積分すると
        ${eq(String.raw`\oint_C \mathbf{B}\cdot d\mathbf{l} = \frac{\mu_0 I}{2\pi}\bigl(\theta(1) - \theta(0)\bigr)`)}
        です。曲線は閉じているので ${tex(String.raw`\theta(1) - \theta(0)`)} は ${tex(String.raw`2\pi`)} の整数倍 ${tex(String.raw`2\pi w`)} で、${tex('w')} は導線のまわりを回った回数です。よって ${tex(String.raw`\oint_C \mathbf{B}\cdot d\mathbf{l} = \mu_0 I\,w`)} です。`,
    ],
  }]),
});

let current: LessonFigure | undefined;

function paint() {
  if (!current) return;
  const figure = current;
  drawPlot(document.querySelector<HTMLCanvasElement>('#wire-chart')!, {
    label: '直線導線のまわりの磁場の向きと磁力線、Ampère の閉曲線。',
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
    equalAspect: true,
    lines: [
      ...figure.series.filter(item => item.name.startsWith('field circle')).map(item => line(figure, item.name)),
      line(figure, 'ampere loop'),
      line(figure, 'apart loop'),
    ],
    vectors: vectors(figure, 'grid'),
    dots: [dot(figure, 'wire', 'I')],
  });
  drawPlot(document.querySelector<HTMLCanvasElement>('#axis-chart')!, {
    label: '円形電流の中心軸上の磁場。',
    xMin: -3,
    xMax: 3,
    yMin: 0,
    yMax: 7,
    lines: [line(figure, 'axis exact'), line(figure, 'axis numerical')],
    dots: [dot(figure, 'axis center', 'z = 0'), dot(figure, 'axis one', 'z = 1')],
  });
}

function show(figure: LessonFigure) {
  current = figure;
  const { values: v, arrays: a } = figure;
  const value = (id: string, text: string) => { document.querySelector<HTMLOutputElement>(`#${id}`)!.textContent = text; };
  value('wire-numerical', v.wire_numerical.toFixed(6));
  value('wire-exact', v.wire_exact.toFixed(6));
  value('loop-numerical', v.loop_numerical.toFixed(6));
  value('loop-exact', v.loop_exact.toFixed(6));
  value('ampere-enclosing', v.ampere_enclosing.toFixed(6));
  value('ampere-apart', v.ampere_apart.toExponential(2));
  document.querySelector('#wire-table')!.innerHTML = a.wire_counts.map((n, i) =>
    `<tr><td>${n}</td><td>${a.wire_by_n[i].toFixed(6)}</td><td>${a.wire_error[i].toExponential(2)}</td></tr>`).join('');
  document.querySelector('#loop-table')!.innerHTML = a.loop_counts.map((n, i) =>
    `<tr><td>${n}</td><td>${a.loop_by_n[i].toFixed(6)}</td><td>${a.loop_error[i].toExponential(2)}</td></tr>`).join('');
  paint();
}

async function load() {
  try {
    show(await lessonFigure('em/magnetostatics', { segments: 8, loop_segments: 16, circulation_n: 64 }));
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
