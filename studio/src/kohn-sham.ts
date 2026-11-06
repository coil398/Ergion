import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

type Mixing = 'mix-07' | 'mix-03';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'md/kohn-sham',
  distance: 1.5,
  length: 20,
  points: 199,
  dt: 1,
  steps: 30,
};

const terms: [string, string][] = [
  ['kinetic', String.raw`T_s`],
  ['external', String.raw`E_{\mathrm{ext}}`],
  ['hartree', String.raw`E_H`],
  ['exchange', String.raw`E_x`],
  ['nuclear', String.raw`V_{nn}`],
  ['total', 'E'],
];

renderLesson({
  id: 'kohn-sham',
  section: { label: '分子動力学' },
  title: '密度汎関数理論と Kohn–Sham 方程式',
  description: `多電子系の基底状態のエネルギーは、電子密度 ${tex('n(x)')} の汎関数として決まります（Hohenberg–Kohn の定理）。Kohn–Sham の方法は、同じ密度をもつ相互作用のない電子の1電子方程式を、密度と有効ポテンシャルが互いに矛盾しなくなるまで繰り返し解きます。このページは、二つの陽子と2個の電子を直線の上に置いた1次元のモデルで、自己無撞着場の反復が収束していく様子を1回ずつ示します。`,
  equation: [
    String.raw`\left[-\frac{1}{2}\frac{d^2}{dx^2} + V_{\mathrm{eff}}[n](x)\right]\psi_0(x) = \varepsilon_0\,\psi_0(x)`,
    String.raw`V_{\mathrm{eff}} = v_{\mathrm{ext}} + V_H[n] + v_x[n],\qquad n(x) = 2\,|\psi_0(x)|^2`,
  ],
  equationNote: '交換のモデル v_x = −(3n/π)^{1/3}、相関は含まない',
  studyHeading: '自己無撞着場の反復の手順',
  steps: [
    `模型を定めます。原子単位 ${tex(String.raw`\hbar = m_e = e = 1`)} を使い、電荷 ${tex('Z = 1')} の原子核を ${tex(String.raw`X_{1,2} = \mp R/2`)} に置きます。電子は2個で、スピンが逆向きの2電子が一つの軌道 ${tex(String.raw`\psi_0`)} を占めるので、密度は ${tex(String.raw`n(x) = 2|\psi_0(x)|^2`)}、${tex(String.raw`\int n\,dx = 2`)} です。相互作用は柔らかい Coulomb 相互作用 ${tex(String.raw`1/\sqrt{r^2 + a^2}`)}（${tex('a = 1')}）です。格子は「Born–Oppenheimer 近似」のページと同じ ${tex('x_j = -L/2 + jh')}、${tex('h = L/(N+1)')} で、積分は格子の和 ${tex(String.raw`\int f\,dx \approx \sum_j f(x_j)\,h`)} です。`,
    `全エネルギーを密度と軌道で項ごとに書きます。
      ${eq(String.raw`E = T_s + E_{\mathrm{ext}} + E_H + E_x + V_{nn}`)}
      ${eq(String.raw`T_s = 2\int \psi_0\left(-\frac{1}{2}\psi_0''\right)dx`)}
      ${eq(String.raw`E_{\mathrm{ext}} = \int n(x)\,v_{\mathrm{ext}}(x)\,dx,\qquad v_{\mathrm{ext}}(x) = -\sum_{I=1}^{2}\frac{1}{\sqrt{(x - X_I)^2 + a^2}}`)}
      ${eq(String.raw`E_H = \frac{1}{2}\iint \frac{n(x)\,n(x')}{\sqrt{(x - x')^2 + a^2}}\,dx\,dx'`)}
      ${eq(String.raw`E_x = -\frac{3}{4}\left(\frac{3}{\pi}\right)^{1/3}\int n(x)^{4/3}\,dx`)}
      ${eq(String.raw`V_{nn} = \frac{1}{\sqrt{R^2 + a^2}}`)}
      ${tex('T_s')} は相互作用のない電子の運動エネルギー、${tex(String.raw`E_{\mathrm{ext}}`)} は原子核との引力、${tex('E_H')} は密度どうしの静電エネルギー（Hartree エネルギー）、${tex('E_x')} は交換エネルギー、${tex(String.raw`V_{nn}`)} は原子核の反発です。${tex('E_x')} は3次元の一様な電子ガスの交換（LDA）の式を1次元の密度に当てはめたモデルで、相関エネルギーは含みません（${coreDoc('molecular', 'exchange_energy', '交換エネルギーの説明')}、${coreDoc('molecular', 'kohn_sham_energy', '全エネルギーの各項の説明')}）。`,
    `${tex(String.raw`\int \psi_0^2\,dx = 1`)} の条件のもとで ${tex('E')} を ${tex(String.raw`\psi_0`)} について極小にします。Lagrange 乗数を ${tex(String.raw`2\varepsilon_0`)} とし、${tex(String.raw`\delta n = 4\psi_0\,\delta\psi_0`)} を使うと
      ${eq(String.raw`\frac{\delta E}{\delta\psi_0} = 4\left(-\frac{1}{2}\psi_0''\right) + \frac{\delta (E_{\mathrm{ext}} + E_H + E_x)}{\delta n}\cdot 4\psi_0 = 4\varepsilon_0\psi_0`)}
      です。密度による汎関数微分は
      ${eq(String.raw`\frac{\delta E_{\mathrm{ext}}}{\delta n} = v_{\mathrm{ext}}(x),\qquad \frac{\delta E_H}{\delta n} = \int\frac{n(x')}{\sqrt{(x - x')^2 + a^2}}\,dx' = V_H(x)`)}
      ${eq(String.raw`\frac{\delta E_x}{\delta n} = -\frac{3}{4}\left(\frac{3}{\pi}\right)^{1/3}\cdot\frac{4}{3}\,n^{1/3} = -\left(\frac{3n}{\pi}\right)^{1/3} = v_x(x)`)}
      です（${tex('E_H')} は ${tex('n')} の2次式なので、微分で係数 ${tex(String.raw`\tfrac12`)} が消えます）。4 で割ると Kohn–Sham 方程式
      ${eq(String.raw`-\frac{1}{2}\psi_0'' + \big(v_{\mathrm{ext}} + V_H + v_x\big)\psi_0 = \varepsilon_0\psi_0`)}
      を得ます（${coreDoc('molecular', 'hartree_potential', 'Hartree ポテンシャルの説明')}、${coreDoc('molecular', 'exchange_potential', '交換ポテンシャルの説明')}）。`,
    `${tex(String.raw`V_{\mathrm{eff}}`)} は解きたい密度 ${tex('n')} に依存するので、反復で解きます。入力の密度 ${tex('n_k')} から
      ${eq(String.raw`V_{\mathrm{eff},j} = v_{\mathrm{ext}}(x_j) + \sum_{i} \frac{n_k(x_i)\,h}{\sqrt{(x_j - x_i)^2 + a^2}} - \left(\frac{3 n_k(x_j)}{\pi}\right)^{1/3}`)}
      を作り、3点の差分の対称三重対角行列の最も低い固有値 ${tex(String.raw`\varepsilon_0`)} と固有ベクトルを Sturm 列の二分法と逆反復法で求めます。軌道を ${tex(String.raw`\sum_j \psi_j^2\,h = 1`)} に正規化し、出力の密度を ${tex(String.raw`n_{\mathrm{out}} = 2\psi_0^2`)} とします（${coreDoc('molecular', 'schrodinger_states', '固有値と固有関数の説明')}）。最初の密度 ${tex('n_0')} は、${tex(String.raw`V_H`)} と ${tex('v_x')} を除いた ${tex(String.raw`-\frac12 d^2/dx^2 + v_{\mathrm{ext}}`)} の最も低い軌道から作ります。`,
    `次の入力は線形混合
      ${eq(String.raw`n_{k+1} = (1 - \alpha)\,n_k + \alpha\,n_{\mathrm{out}}[n_k]`)}
      です。混合しても電子数は ${tex(String.raw`(1 - \alpha)\cdot 2 + \alpha\cdot 2 = 2`)} のままです。収束の目安は密度の変化
      ${eq(String.raw`|\Delta n|_k = \sum_j \big|n_{\mathrm{out}}[n_k](x_j) - n_k(x_j)\big|\,h`)}
      です（${coreDoc('molecular', 'kohn_sham_iteration', '1回の反復の説明')}）。固定点 ${tex(String.raw`n_\infty`)} の近くで ${tex(String.raw`n_{\mathrm{out}}[n] \approx n_\infty + J(n - n_\infty)`)} と線形化すると、誤差 ${tex(String.raw`\delta_k = n_k - n_\infty`)} は
      ${eq(String.raw`\delta_{k+1} \approx \big[(1 - \alpha)I + \alpha J\big]\,\delta_k`)}
      に従い、行列 ${tex(String.raw`(1 - \alpha)I + \alpha J`)} の固有値の絶対値の最大値 ${tex(String.raw`\rho`)} の割合で毎回小さくなります。${tex(String.raw`\rho`)} は ${tex(String.raw`\alpha`)} で変わります。図のタブで、このモデルでは ${tex(String.raw`\alpha = 0.7`)} のほうが ${tex(String.raw`\alpha = 0.3`)} より少ない反復で収束することを確かめます。`,
    `各反復の全エネルギー ${tex('E_k')} は、出力の軌道と密度で手順2の式を計算した値です。${tex('E')} は ${tex(String.raw`n_\infty`)} で停留するので、${tex(String.raw`E_k - E_\infty`)} は密度の誤差の2乗の大きさで小さくなり、${tex(String.raw`|\Delta n|_k`)} より速く 0 に近づきます。${tex(String.raw`E_\infty`)} は、${tex(String.raw`\alpha = 0.5`)} で ${tex(String.raw`|\Delta n| \le 10^{-11}`)} まで反復した値です（${coreDoc('molecular', 'kohn_sham_solve', '収束させる手順の説明')}）。`,
  ],
  figureAlt: '二つの原子核のまわりに広がる電子密度と、SCF 反復の回数に対して指数的に小さくなる全エネルギーの誤差。',
  figure: experimentPanel({
    fieldsetLabel: '原子核と格子',
    fields: [
      { name: 'distance', label: '核間距離', symbol: 'R', value: 1.5, min: 0 },
      { name: 'length', label: '区間の長さ', symbol: 'L', value: 20, min: 4, max: 200 },
      { name: 'points', label: '内部の格子点の数', symbol: 'N', value: 199, min: 9, max: 800, step: '1' },
    ],
    dt: 1,
    steps: 30,
    sceneHeading: '反復ごとの電子密度 n(x)',
    sceneCaption: '時刻 t は反復の回数 k です（時間刻み 1 が1回の反復）。太い実線は入力の密度 n_k、細い実線はそこから得た出力の密度 n_out、破線は収束した密度、点は原子核の位置です。',
    sceneLabel: '二つの原子核のまわりの電子密度',
    readouts: { position: '全エネルギー E_k', velocity: '密度の変化 |Δn|_k', exact: '収束した全エネルギー E_∞', error: '差 E_k − E_∞' },
    plotsHeading: '全エネルギーと密度の収束',
    legend: '<span><i class="numerical"></i>反復の値（近似）</span><span><i class="analytical"></i>収束した値（近似）</span>',
    tabs: methodTabs('密度の混合の割合', [{ id: 'mix-07', label: '線形混合 α = 0.7' }, { id: 'mix-03', label: '線形混合 α = 0.3' }]),
    plots: `<div class="plot-pair">
          <div><h3>全エネルギーの誤差 ${tex(String.raw`|E_k - E_\infty|`)}</h3><canvas id="energy-chart" role="img"></canvas><p>反復の回数 k（縦軸は対数）</p></div>
          <div><h3>密度の変化 ${tex(String.raw`|\Delta n|_k`)}</h3><canvas id="change-chart" role="img"></canvas><p>反復の回数 k（縦軸は対数）</p></div>
        </div>
        <div class="table-scroll"><table class="value-table" id="energy-table">
          <thead><tr><th>項</th><th>反復 k の値（近似）</th></tr></thead>
          <tbody></tbody>
        </table></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('R = 1.5')}、${tex('a = 1')} の原子核の反発は
      ${eq(String.raw`V_{nn} = \frac{1}{\sqrt{1.5^2 + 1^2}} = \frac{1}{\sqrt{3.25}} = 0.5547002\ldots`)}
      で、厳密です。表の ${tex(String.raw`V_{nn}`)} の値は <output id="example-vnn">—</output> です。`,
    `密度が ${tex(String.raw`n = \pi/24 \approx 0.1309`)} の点の交換ポテンシャルは
      ${eq(String.raw`v_x = -\left(\frac{3}{\pi}\cdot\frac{\pi}{24}\right)^{1/3} = -\left(\frac{1}{8}\right)^{1/3} = -\frac{1}{2}`)}
      で、厳密です。`,
    `混合しても電子数は2のままです。画面の反復 ${tex('k')} の密度の和 ${tex(String.raw`\sum_j n_k(x_j)\,h`)} は <output id="example-electrons">—</output>（近似）です。同じ反復の密度の変化 ${tex(String.raw`|\Delta n|_k`)} は <output id="example-change">—</output>（近似）です。`,
  ],
  related: [
    { href: './born-oppenheimer.html', title: 'Born–Oppenheimer 近似' },
    { href: './hellmann-feynman.html', title: 'Hellmann–Feynman の定理' },
    { href: './eigen.html', title: '固有値と固有ベクトル' },
    { href: './newton.html', title: 'ニュートン法' },
  ],
  footer: 'この画面の計算は、二つの陽子と2個の電子を直線の上に置いた1次元の Kohn–Sham モデルです。',
  proof: writtenProof([{
    statement: `格子の上で ${tex(String.raw`\psi_0`)} が ${tex(String.raw`V_{\mathrm{eff}}[n]`)} の Kohn–Sham 方程式の固有値 ${tex(String.raw`\varepsilon_0`)} の解で、${tex(String.raw`\sum_j \psi_j^2 h = 1`)}、${tex(String.raw`n_j = 2\psi_j^2`)}（自己無撞着）とします。このとき全エネルギーは
      ${eq(String.raw`E = 2\varepsilon_0 - E_H - \sum_j v_x(x_j)\,n_j\,h + E_x + V_{nn}`)}
      とも書けます。`,
    proof: [
      `差分の Kohn–Sham 方程式は、${tex(String.raw`(T\psi)_j = -\frac{1}{2h^2}(\psi_{j+1} - 2\psi_j + \psi_{j-1})`)} と書いて
        ${eq(String.raw`(T\psi)_j + V_{\mathrm{eff},j}\,\psi_j = \varepsilon_0\,\psi_j`)}
        です。両辺に ${tex(String.raw`2\psi_j h`)} を掛けて ${tex('j')} について足します。`,
      `右辺は ${tex(String.raw`2\varepsilon_0\sum_j \psi_j^2 h = 2\varepsilon_0`)} です。左辺の第1項は運動エネルギーの定義そのもので ${tex(String.raw`2\sum_j \psi_j (T\psi)_j h = T_s`)}、第2項は ${tex(String.raw`2\psi_j^2 = n_j`)} より
        ${eq(String.raw`\sum_j n_j V_{\mathrm{eff},j}\,h = \sum_j n_j v_{\mathrm{ext},j} h + \sum_j n_j V_{H,j} h + \sum_j n_j v_{x,j} h = E_{\mathrm{ext}} + 2E_H + \sum_j n_j v_{x,j} h`)}
        です（${tex(String.raw`E_H = \frac12\sum_j n_j V_{H,j} h`)}）。`,
      `したがって
        ${eq(String.raw`2\varepsilon_0 = T_s + E_{\mathrm{ext}} + 2E_H + \sum_j n_j v_{x,j}\,h`)}
        ${eq(String.raw`T_s + E_{\mathrm{ext}} = 2\varepsilon_0 - 2E_H - \sum_j n_j v_{x,j}\,h`)}
        です。これを ${tex(String.raw`E = T_s + E_{\mathrm{ext}} + E_H + E_x + V_{nn}`)} に代入すると主張を得ます。軌道のエネルギーの和 ${tex(String.raw`2\varepsilon_0`)} は ${tex('E_H')} を2回数えているので、1回分を引きます。`,
    ],
  }]),
});

const form = formReader(defaults);
let method: Mixing = 'mix-07';

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function positiveSeries(points: Snapshot[], value: (p: Snapshot) => number) {
  const kept = points.filter(p => value(p) > 0);
  return { x: kept.map(p => p.time), y: kept.map(value) };
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'energy-chart', 'change-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const half = Number(config.length) / 2;
  drawPlot(canvases[0], {
    key: `${key}|density`,
    label: '電子密度 n(x)。太い実線は入力の密度、細い実線は出力の密度、破線は収束した密度。',
    xMin: -Math.min(half, 8),
    xMax: Math.min(half, 8),
    lines: [line(frame, 'converged'), line(frame, 'output'), { ...line(frame, 'density'), width: 2.5 }],
    dots: [dot(frame, 'nucleus1', 'X₁'), dot(frame, 'nucleus2', 'X₂')],
    zeroLabel: 'n = 0',
  });
  const end = config.steps * config.dt;
  drawPlot(canvases[1], {
    key: `${key}|energy`,
    label: '全エネルギーの誤差の絶対値と反復の回数のグラフ。縦軸は対数。',
    xMin: 0,
    xMax: end,
    logY: true,
    lines: [{ ...positiveSeries(points, p => Math.abs(p.position_error ?? Number.NaN)), role: 'numerical' }],
    dots: Math.abs(state.position_error ?? 0) > 0 ? [{ x: state.time, y: Math.abs(state.position_error ?? 0), role: 'numerical' }] : [],
  });
  drawPlot(canvases[2], {
    key: `${key}|change`,
    label: '密度の変化と反復の回数のグラフ。縦軸は対数。',
    xMin: 0,
    xMax: end,
    logY: true,
    lines: [{ ...positiveSeries(points, p => p.velocity), role: 'numerical' }],
    dots: state.velocity > 0 ? [{ x: state.time, y: state.velocity, role: 'numerical' }] : [],
  });
  const v = frame.values;
  document.querySelector('#energy-table tbody')!.innerHTML = terms.map(([name, symbol]) =>
    `<tr><th>${tex(symbol)}</th><td>${v[name].toFixed(7)}</td></tr>`).join('');
  setText('example-vnn', v.nuclear.toFixed(7));
  setText('example-electrons', v.electrons.toFixed(10));
  setText('example-change', v.change.toExponential(2));
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-kohn-sham.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => [
    `反復の回数 k ${state.frame?.values.iteration ?? '—'}`,
    `Kohn–Sham 固有値 ε₀ ${state.frame?.values.eigenvalue.toFixed(7) ?? '—'}`,
    `収束した ε₀ ${state.frame?.values.exact_eigenvalue.toFixed(7) ?? '—'}`,
    `密度の変化 |Δn| ${state.velocity.toExponential(2)}`,
    `全エネルギーの誤差 |E − E∞| ${state.frame?.values.energy_error.toExponential(2) ?? '—'}`,
  ].join('\n'),
});
bindMethodTabs<Mixing>(next => {
  method = next;
  session.reloadMethod();
});
