import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

type Search = 'golden' | 'newton';

renderLesson({
  id: 'born-oppenheimer',
  section: { label: '分子動力学' },
  title: 'Born–Oppenheimer 近似',
  description: `原子核の質量は電子の質量の千倍以上なので、電子は原子核の配置にすぐに追従します。原子核を止めて電子の固有値問題を解き、その基底状態のエネルギーに原子核の反発を加えた ${tex('U_0(R)')} を、原子核が動くポテンシャルとします。このページは、二つの陽子と1個の電子を直線の上に置いた1次元のモデルで、断熱ポテンシャルの曲線、平衡距離、振動数を求めます。`,
  equation: [
    String.raw`\hat H = \hat T_n + \hat H_e,\qquad \hat H_e = \hat T_e + \hat V_{en} + \hat V_{nn}`,
    String.raw`\hat H_e(R)\,\psi_k(x; R) = E_k(R)\,\psi_k(x; R)`,
    String.raw`\mu R'' = -\frac{dU_0}{dR},\qquad U_0(R) = E_0(R) + V_{nn}(R)`,
  ],
  equationNote: '換算質量 μ = M_p/2 = 918.075（M_p = 1836.15）',
  studyHeading: '断熱ポテンシャルを求める手順',
  steps: [
    `単位と模型を定めます。原子単位 ${tex(String.raw`\hbar = m_e = e = 1`)} を使います。電子の位置を ${tex('x')}、電荷 ${tex('Z = 1')} の二つの原子核の位置を ${tex(String.raw`X_1 = -R/2`)}、${tex(String.raw`X_2 = R/2`)} とし、${tex('R')} を核間距離と呼びます。3次元の Coulomb 相互作用 ${tex('1/r')} の代わりに、${tex('r = 0')} でも有限な柔らかい相互作用 ${tex(String.raw`1/\sqrt{r^2 + a^2}`)}（${tex('a = 1')}）を使います。電子が感じるポテンシャルと原子核どうしの反発は
      ${eq(String.raw`v(x; R) = -\frac{1}{\sqrt{(x + R/2)^2 + a^2}} - \frac{1}{\sqrt{(x - R/2)^2 + a^2}}`)}
      ${eq(String.raw`V_{nn}(R) = \frac{1}{\sqrt{R^2 + a^2}}`)}
      です（${coreDoc('molecular', 'external_potential', '電子が感じるポテンシャルの説明')}）。これは1次元のモデルで、3次元の H₂⁺ の数を再現するものではありません。陽子の質量を ${tex(String.raw`M_p = 1836.15`)} とすると、核間距離の運動の換算質量は ${tex(String.raw`\mu = M_p/2`)} です。全ハミルトニアンは
      ${eq(String.raw`\hat H = -\frac{1}{2\mu}\frac{\partial^2}{\partial R^2} - \frac{1}{2}\frac{\partial^2}{\partial x^2} + v(x; R) + V_{nn}(R)`)}
      です。`,
    `原子核を止めた電子の問題を先に解きます。${tex('R')} を定数とみなした電子のハミルトニアン ${tex(String.raw`\hat H_e = -\frac{1}{2}\frac{\partial^2}{\partial x^2} + v(x; R) + V_{nn}(R)`)} の固有値問題
      ${eq(String.raw`\left[-\frac{1}{2}\frac{\partial^2}{\partial x^2} + v(x; R)\right]\psi_k(x; R) = E_k(R)\,\psi_k(x; R)`)}
      の固有値 ${tex(String.raw`E_0(R) < E_1(R) < \cdots`)} を電子のエネルギーと呼びます。全体の波動関数を ${tex(String.raw`\Psi(x, R) = \chi(R)\,\psi_0(x; R)`)} と置いて原子核の運動エネルギーを作用させると、積の微分により
      ${eq(String.raw`-\frac{1}{2\mu}\frac{\partial^2}{\partial R^2}(\chi\psi_0) = -\frac{1}{2\mu}\left(\chi''\psi_0 + 2\chi'\frac{\partial\psi_0}{\partial R} + \chi\frac{\partial^2\psi_0}{\partial R^2}\right)`)}
      です。右辺の後ろの2項は ${tex(String.raw`\psi_0`)} の ${tex('R')} による変化を含み、係数 ${tex(String.raw`1/\mu`)} が小さいので無視します。これが Born–Oppenheimer 近似です。残る式は
      ${eq(String.raw`\hat H(\chi\psi_0) \approx \psi_0\left[-\frac{1}{2\mu}\chi'' + \big(E_0(R) + V_{nn}(R)\big)\chi\right]`)}
      で、原子核は ${tex(String.raw`U_0(R) = E_0(R) + V_{nn}(R)`)} をポテンシャルとして動きます。古典的に扱うと運動方程式は ${tex(String.raw`\mu R'' = -U_0'(R)`)} です。`,
    `電子の固有値問題を格子で離散化します。区間 ${tex('[-L/2, L/2]')} の内部に間隔 ${tex('h = L/(N+1)')} の点 ${tex('x_j = -L/2 + jh')}（${tex(String.raw`j = 1, \ldots, N`)}）をとり、両端で ${tex(String.raw`\psi = 0`)} とします。2階微分を3点の差分
      ${eq(String.raw`\psi''(x_j) \approx \frac{\psi_{j+1} - 2\psi_j + \psi_{j-1}}{h^2}`)}
      で置き換えると、固有値問題は
      ${eq(String.raw`-\frac{1}{2h^2}\psi_{j-1} + \left(\frac{1}{h^2} + v_j\right)\psi_j - \frac{1}{2h^2}\psi_{j+1} = E\,\psi_j`)}
      となります。行列 ${tex('H')} は対角 ${tex(String.raw`d_j = 1/h^2 + v_j`)}、副対角 ${tex(String.raw`e = -1/(2h^2)`)} の対称三重対角行列です（${coreDoc('molecular', 'schrodinger_hamiltonian', '行列の説明')}）。`,
    `対称三重対角行列の固有値を Sturm 列の二分法で求めます。${tex(String.raw`H - \lambda I`)} を ${tex(String.raw`LDL^{\mathsf T}`)} と分解した対角は
      ${eq(String.raw`q_1 = d_1 - \lambda,\qquad q_j = d_j - \lambda - \frac{e^2}{q_{j-1}}\quad (j = 2, \ldots, N)`)}
      で、負の ${tex('q_j')} の個数 ${tex(String.raw`\nu(\lambda)`)} は ${tex(String.raw`\lambda`)} より小さい固有値の個数です（${coreDoc('molecular', 'sturm_count', 'Sturm 列の説明')}）。${tex('k')} 番目の固有値は ${tex(String.raw`\nu(\alpha) \le k < \nu(\beta)`)} を保ったまま区間 ${tex(String.raw`[\alpha, \beta]`)} を半分にしていけば求まります（${coreDoc('molecular', 'tridiagonal_eigenvalues', '二分法の説明')}）。固有ベクトルは、求めた固有値のごく近くの ${tex(String.raw`\sigma`)} で
      ${eq(String.raw`(H - \sigma I)\,y^{(m+1)} = v^{(m)},\qquad v^{(m+1)} = \frac{y^{(m+1)}}{\lVert y^{(m+1)}\rVert}`)}
      を繰り返す逆反復法で求めます（${coreDoc('molecular', 'tridiagonal_eigenvector', '逆反復法の説明')}）。固有関数は ${tex(String.raw`\sum_j \psi_j^2\,h = 1`)} に正規化します。`,
    `解き方を厳密解のある二つの問題で確かめます。幅 ${tex('L')} の箱の中の粒子（${tex('v = 0')}）の厳密な固有値と、3点の差分の行列の厳密な固有値は
      ${eq(String.raw`E_n = \frac{n^2\pi^2}{2L^2},\qquad E_n^{(h)} = \frac{2}{h^2}\sin^2\frac{n\pi h}{2L}`)}
      です（${coreDoc('molecular', 'box_energy', '箱の中の粒子の説明')}、${coreDoc('molecular', 'box_energy_discrete', '差分の固有値の説明')}）。${tex(String.raw`\sin u = u - u^3/6 + \cdots`)} より
      ${eq(String.raw`E_n^{(h)} = E_n\left(1 - \frac{n^2\pi^2 h^2}{12 L^2} + \cdots\right)`)}
      なので、差は ${tex('h^2')} に比例して小さくなります。調和振動子 ${tex(String.raw`v = x^2/2`)} の厳密な固有値は ${tex(String.raw`E_n = n + \tfrac{1}{2}`)} です。図の下の表は、二分法の値がこれらと一致することを示します。`,
    `平衡距離 ${tex('R_e')} は ${tex(String.raw`U_0(R)`)} の極小点です。黄金分割法は、${tex(String.raw`\varphi = (\sqrt5 - 1)/2`)} として内点
      ${eq(String.raw`c = b - \varphi(b - a),\qquad d = a + \varphi(b - a)`)}
      をとり、${tex('U_0(c) < U_0(d)')} なら ${tex('[a, d]')}、そうでなければ ${tex('[c, b]')} を残します。幅は1回ごとに ${tex(String.raw`\varphi \approx 0.618`)} 倍です（${coreDoc('molecular', 'golden_section_minimum', '黄金分割法の説明')}）。放物線の Newton 法は、3点 ${tex(String.raw`R_k, R_k \pm \delta`)} を通る放物線の頂点へ進みます。
      ${eq(String.raw`U_0' \approx \frac{U_0(R_k + \delta) - U_0(R_k - \delta)}{2\delta},\qquad U_0'' \approx \frac{U_0(R_k + \delta) - 2U_0(R_k) + U_0(R_k - \delta)}{\delta^2}`)}
      ${eq(String.raw`R_{k+1} = R_k - \frac{U_0'(R_k)}{U_0''(R_k)}`)}
      これは ${tex(String.raw`U_0'(R) = 0`)} の Newton 法で、極小点の近くでは誤差が1回ごとにほぼ2乗になります（${coreDoc('molecular', 'parabola_newton_minimum', '放物線の Newton 法の説明')}）。`,
    `${tex('R_e')} のまわりで ${tex(String.raw`U_0(R) \approx U_0(R_e) + \tfrac{1}{2}k(R - R_e)^2`)} と近似すると、原子核の運動は単振動です。曲率 ${tex(String.raw`k = U_0''(R_e)`)} を中心差分（${tex(String.raw`\delta = 0.01`)}）で求め、
      ${eq(String.raw`\omega = \sqrt{\frac{k}{\mu}},\qquad \mu = \frac{M_p}{2}`)}
      とします（${coreDoc('molecular', 'vibrational_frequency', '振動数の説明')}）。電子の励起エネルギー ${tex(String.raw`\Delta E = E_1(R_e) - E_0(R_e)`)} に対応する周期 ${tex(String.raw`\tau_e = 2\pi/\Delta E`)} と、原子核の振動の周期 ${tex(String.raw`\tau_n = 2\pi/\omega`)} の比は
      ${eq(String.raw`\frac{\tau_n}{\tau_e} = \frac{\Delta E}{\omega}`)}
      です。${tex(String.raw`\omega \propto \mu^{-1/2}`)} なので、この比はおよそ ${tex(String.raw`\sqrt{M_p/m_e} \approx 43`)} の大きさになります。比が大きいことが、電子が原子核にすぐ追従するという近似の前提です。`,
  ],
  figureAlt: '核間距離 R に対する基底状態と励起状態の断熱ポテンシャル曲線と、その極小点にある原子核。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">断熱ポテンシャル ${tex('U_k(R)')} と電子の固有関数</h2><div class="legend"><span><i class="numerical"></i>二分法の固有値（近似）</span></div></div>
        ${methodTabs('極小点を探す方法', [{ id: 'golden', label: '黄金分割法' }, { id: 'newton', label: '放物線の Newton 法' }])}
        <div class="plot-pair">
          <div><h3>断熱ポテンシャル ${tex(String.raw`U_0(R)`)}、${tex(String.raw`U_1(R)`)}</h3><canvas id="curve-chart" role="img"></canvas><p>核間距離 R。太い実線は ${tex('U_0')}、細い実線は ${tex('U_1')}、破線は ${tex(String.raw`V_{nn}`)} と ${tex('E_0')}。点は極小点を探す反復の点です。</p></div>
          <div><h3>${tex('R = R_e')} の固有関数 ${tex(String.raw`\psi_0`)}、${tex(String.raw`\psi_1`)}</h3><canvas id="orbital-chart" role="img"></canvas><p>電子の位置 x。太い実線は ${tex(String.raw`\psi_0`)}、細い実線は ${tex(String.raw`\psi_1`)}、破線は ${tex('v(x; R_e)')}、点は原子核の位置です。</p></div>
        </div>
        <div class="readouts">
          <div><span>平衡距離 ${tex('R_e')}（近似）</span><output id="r-e">—</output></div>
          <div><span>${tex('U_0(R_e)')}（近似）</span><output id="u-e">—</output></div>
          <div><span>反復の回数</span><output id="iterations">—</output></div>
          <div><span>曲率 ${tex('k')}（近似）</span><output id="curvature">—</output></div>
          <div><span>角振動数 ${tex(String.raw`\omega`)}（近似）</span><output id="omega">—</output></div>
          <div><span>周期の比 ${tex(String.raw`\tau_n/\tau_e`)}（近似）</span><output id="ratio">—</output></div>
        </div>
        <div class="table-scroll"><table class="value-table" id="box-table">
          <thead><tr><th>${tex('n')}</th><th>二分法の固有値（近似）</th><th>${tex(String.raw`E_n^{(h)}`)}（厳密）</th><th>${tex('E_n')}（厳密）</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <p>箱の中の粒子、${tex('L = 1')}、${tex('N = 19')}、${tex('h = 0.05')}。</p>
        <div class="table-scroll"><table class="value-table" id="oscillator-table">
          <thead><tr><th>${tex('n')}</th><th>二分法の固有値（近似）</th><th>${tex(String.raw`n + \tfrac{1}{2}`)}（厳密）</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <p>調和振動子 ${tex(String.raw`v = x^2/2`)}、${tex('L = 20')}、${tex('N = 199')}、${tex('h = 0.1')}。</p>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `幅 ${tex('L = 4')} の箱を ${tex('N = 3')} 点で離散化すると、${tex('h = 4/4 = 1')}、格子点は ${tex('x_j = -1, 0, 1')} です。行列と固有値の方程式は、${tex('s = 1 - E')} と置いて
      ${eq(String.raw`H = \begin{pmatrix} 1 & -\tfrac12 & 0 \\ -\tfrac12 & 1 & -\tfrac12 \\ 0 & -\tfrac12 & 1 \end{pmatrix}`)}
      ${eq(String.raw`\det(H - EI) = s\left(s^2 - \tfrac14\right) - \tfrac14 s = s\left(s^2 - \tfrac12\right) = 0`)}
      ${eq(String.raw`E = 1 - \frac{\sqrt2}{2},\quad 1,\quad 1 + \frac{\sqrt2}{2}`)}
      です。最も低い固有値は ${tex(String.raw`1 - \sqrt2/2 = 0.2928932\ldots`)}（厳密）で、公式 ${tex(String.raw`E_1^{(h)} = 2\sin^2(\pi/8) = 1 - \cos(\pi/4)`)} と一致します。固有ベクトルは ${tex(String.raw`(1, \sqrt2, 1)/2`)} です。二分法の値は <output id="example-e1">—</output>（近似）です。連続な箱の厳密な値は ${tex(String.raw`E_1 = \pi^2/32 = 0.3084251\ldots`)} で、3点では5% 小さくなります。`,
    `換算質量は ${tex(String.raw`\mu = 1836.15/2 = 918.075`)}（厳密）です。曲率 ${tex('k')} = <output id="example-k">—</output>（近似）を代入すると
      ${eq(String.raw`\omega = \sqrt{k/918.075}`)}
      で、${tex(String.raw`\omega`)} = <output id="example-omega">—</output>（近似）です。電子の励起エネルギー ${tex(String.raw`\Delta E`)} = <output id="example-gap">—</output>（近似）との比 ${tex(String.raw`\Delta E/\omega`)} は <output id="example-ratio">—</output>（近似）です。`,
  ],
  related: [
    { href: './kohn-sham.html', title: '密度汎関数理論と Kohn–Sham 方程式' },
    { href: './hellmann-feynman.html', title: 'Hellmann–Feynman の定理' },
    { href: './eigen.html', title: '固有値と固有ベクトル' },
    { href: './sturm-liouville.html', title: 'Sturm–Liouville 問題' },
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
  ],
  footer: 'この画面の計算は、二つの陽子と1個の電子を直線の上に置いた1次元のモデルです。',
  proof: writtenProof([
    {
      statement: `${tex('H')} を ${tex(String.raw`N \times N`)} の実対称行列、最も小さい固有値を ${tex('E_0')} とします。0 でない任意のベクトル ${tex('v')} について ${tex(String.raw`\dfrac{v^{\mathsf T} H v}{v^{\mathsf T} v} \ge E_0`)} で、等号は ${tex('v')} が ${tex('E_0')} の固有ベクトルのときに成り立ちます（変分原理）。`,
      proof: [
        `実対称行列は、正規直交な固有ベクトル ${tex(String.raw`u_0, \ldots, u_{N-1}`)}、${tex(String.raw`H u_k = E_k u_k`)}、${tex(String.raw`E_0 \le E_1 \le \cdots`)} をもちます。${tex('v')} を展開して ${tex(String.raw`v = \sum_k c_k u_k`)}、${tex(String.raw`c_k = u_k^{\mathsf T} v`)} とします。`,
        `${tex(String.raw`u_k^{\mathsf T} u_l = \delta_{kl}`)} より
          ${eq(String.raw`v^{\mathsf T} v = \sum_k c_k^2,\qquad v^{\mathsf T} H v = \sum_{k,l} c_k c_l\, u_k^{\mathsf T} H u_l = \sum_{k,l} c_k c_l E_l \delta_{kl} = \sum_k E_k c_k^2`)}
          です。`,
        `${tex(String.raw`E_k \ge E_0`)} と ${tex(String.raw`c_k^2 \ge 0`)} より
          ${eq(String.raw`v^{\mathsf T} H v - E_0\, v^{\mathsf T} v = \sum_k (E_k - E_0)\, c_k^2 \ge 0`)}
          です。${tex(String.raw`v^{\mathsf T} v > 0`)} で割ると主張を得ます。等号は ${tex(String.raw`E_k > E_0`)} の ${tex('k')} について ${tex('c_k = 0')} のとき、すなわち ${tex('v')} が ${tex('E_0')} の固有空間にあるときです。`,
      ],
    },
    {
      statement: `${tex('h = L/(N+1)')} とします。対角 ${tex('1/h^2')}、副対角 ${tex(String.raw`-1/(2h^2)`)} の ${tex(String.raw`N \times N`)} 行列 ${tex('H')} について、${tex(String.raw`\psi_j = \sin\dfrac{n\pi j}{N+1}`)}（${tex(String.raw`j = 1, \ldots, N`)}）は固有値 ${tex(String.raw`E_n^{(h)} = \dfrac{2}{h^2}\sin^2\dfrac{n\pi h}{2L}`)} の固有ベクトルです（${tex(String.raw`n = 1, \ldots, N`)}）。`,
      proof: [
        `${tex(String.raw`\theta = n\pi/(N+1)`)} と置きます。${tex(String.raw`\psi_j = \sin j\theta`)} は ${tex('j = 0')} と ${tex('j = N+1')} でも定義でき、${tex(String.raw`\psi_0 = \sin 0 = 0`)}、${tex(String.raw`\psi_{N+1} = \sin n\pi = 0`)} なので、両端の条件を満たします。したがって ${tex(String.raw`j = 1, \ldots, N`)} のすべての行で
          ${eq(String.raw`(H\psi)_j = -\frac{1}{2h^2}\big(\psi_{j+1} - 2\psi_j + \psi_{j-1}\big)`)}
          と書けます。`,
        `加法定理 ${tex(String.raw`\sin(\alpha + \beta) + \sin(\alpha - \beta) = 2\sin\alpha\cos\beta`)} より
          ${eq(String.raw`\psi_{j+1} + \psi_{j-1} = \sin(j+1)\theta + \sin(j-1)\theta = 2\cos\theta\,\sin j\theta = 2\cos\theta\,\psi_j`)}
          です。`,
        `代入すると
          ${eq(String.raw`(H\psi)_j = -\frac{1}{2h^2}(2\cos\theta - 2)\,\psi_j = \frac{1 - \cos\theta}{h^2}\,\psi_j = \frac{2}{h^2}\sin^2\frac{\theta}{2}\,\psi_j`)}
          です。${tex(String.raw`\theta/2 = n\pi/(2(N+1)) = n\pi h/(2L)`)} なので固有値は ${tex(String.raw`E_n^{(h)}`)} です。${tex(String.raw`1 \le n \le N`)} では ${tex(String.raw`0 < \theta < \pi`)} で、${tex(String.raw`\psi_1 = \sin\theta \ne 0`)} なので ${tex(String.raw`\psi \ne 0`)} です。`,
      ],
    },
  ]),
});

const curveChart = document.querySelector<HTMLCanvasElement>('#curve-chart')!;
const orbitalChart = document.querySelector<HTMLCanvasElement>('#orbital-chart')!;
let search: Search = 'golden';
let shown: LessonFigure | undefined;
let request = 0;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paint() {
  if (!shown) {
    clearFigure(curveChart);
    clearFigure(orbitalChart);
    return;
  }
  const figure = shown;
  const path = figure.arrays.path;
  const pathEnergy = figure.arrays.path_energy;
  drawPlot(curveChart, {
    label: '核間距離 R に対する断熱ポテンシャル。太い実線は基底状態 U0、細い実線は励起状態 U1、破線は原子核の反発と電子のエネルギー E0。',
    xMin: 0,
    xMax: 8,
    yMin: -1.6,
    yMax: 1.0,
    lines: [
      { ...line(figure, 'ground'), width: 2.5 },
      line(figure, 'excited'),
      line(figure, 'repulsion'),
      line(figure, 'electronic_ground'),
    ],
    dots: [
      ...path.map((r, i) => ({ x: r, y: pathEnergy[i], role: 'muted', radius: 2.5 })),
      { ...dot(figure, 'minimum', 'Rₑ'), radius: 6 },
    ],
    zeroLabel: 'U = 0',
  });
  drawPlot(orbitalChart, {
    label: '平衡距離での電子の固有関数 ψ0 と ψ1、および電子が感じるポテンシャル v(x)。',
    xMin: -8,
    xMax: 8,
    yMin: -1.6,
    yMax: 0.8,
    lines: [
      { ...line(figure, 'orbital0'), width: 2.5 },
      line(figure, 'orbital1'),
      line(figure, 'potential'),
    ],
    dots: [dot(figure, 'nucleus1', 'X₁'), dot(figure, 'nucleus2', 'X₂')],
    zeroLabel: 'ψ = 0',
  });
}

function fill(figure: LessonFigure) {
  const v = figure.values;
  setText('r-e', v.r_e.toFixed(6));
  setText('u-e', v.u_e.toFixed(6));
  setText('iterations', String(v.iterations));
  setText('curvature', v.curvature.toFixed(5));
  setText('omega', v.omega.toFixed(6));
  setText('ratio', v.ratio.toFixed(2));
  setText('example-e1', v.hand1.toFixed(7));
  setText('example-k', v.curvature.toFixed(5));
  setText('example-omega', v.omega.toFixed(6));
  setText('example-gap', v.gap.toFixed(5));
  setText('example-ratio', v.ratio.toFixed(2));
  document.querySelector('#box-table tbody')!.innerHTML = [1, 2, 3, 4].map(n =>
    `<tr><td>${n}</td><td>${v[`box${n}`].toFixed(7)}</td><td>${v[`box_discrete${n}`].toFixed(7)}</td><td>${v[`box_exact${n}`].toFixed(7)}</td></tr>`).join('');
  document.querySelector('#oscillator-table tbody')!.innerHTML = [0, 1, 2, 3].map(n =>
    `<tr><td>${n}</td><td>${v[`oscillator${n}`].toFixed(7)}</td><td>${v[`oscillator_exact${n}`].toFixed(1)}</td></tr>`).join('');
}

async function load() {
  const id = ++request;
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('md/born-oppenheimer', { method: search });
    if (id !== request) return;
    shown = figure;
    fill(figure);
    paint();
    setStatus('finished');
  } catch (error) {
    if (id !== request) return;
    console.error(error);
    setStatus('error');
  }
}

bindMethodTabs<Search>(next => {
  search = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
