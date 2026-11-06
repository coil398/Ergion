import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed, pointsWith } from './figures/statistics';
import { eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

type MdMethod = 'verlet' | 'euler';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'md/nve',
  cells: 3,
  density: 0.8,
  temperature: 1,
  seed: 1,
  cutoff: 2.5,
  dt: 0.002,
  steps: 1000,
};

renderLesson({
  id: 'nve',
  section: { label: '分子動力学' },
  title: 'NVE アンサンブルと速度 Verlet 法',
  description: `粒子数 ${tex('N')}、体積 ${tex('V')}、全エネルギー ${tex('E')} が一定の孤立した Lennard–Jones 粒子系を、周期境界条件、最小イメージ法、カットオフのもとで速度 Verlet 法により進めます。全エネルギーと全運動量が保たれることを確かめ、Euler法と比べます。エネルギー、長さ、質量の単位を ${tex(String.raw`\varepsilon`)}、${tex(String.raw`\sigma`)}、${tex('m')} にとり、${tex(String.raw`\varepsilon = \sigma = m = k_B = 1`)} とします。`,
  equation: [
    String.raw`\mathbf{v}_i\!\left(t + \tfrac{\Delta t}{2}\right) = \mathbf{v}_i(t) + \frac{\Delta t}{2m}\,\mathbf{F}_i(t), \qquad \mathbf{r}_i(t + \Delta t) = \mathbf{r}_i(t) + \Delta t\,\mathbf{v}_i\!\left(t + \tfrac{\Delta t}{2}\right)`,
    String.raw`\mathbf{v}_i(t + \Delta t) = \mathbf{v}_i\!\left(t + \tfrac{\Delta t}{2}\right) + \frac{\Delta t}{2m}\,\mathbf{F}_i(t + \Delta t)`,
    String.raw`E = \sum_i \tfrac{1}{2} m |\mathbf{v}_i|^2 + \sum_{i<j} V_{\mathrm{sf}}(r_{ij})`,
  ],
  studyHeading: '運動方程式、保存則、速度 Verlet 法の手順',
  steps: [
    `記号を定めます。${tex('N')} 個の原子（質量 ${tex('m')}）が一辺 ${tex('L')} の立方体セルにあり、体積は ${tex('V = L^3')}、数密度は ${tex(String.raw`\rho = N/V`)} です。原子 ${tex('i')} の位置を ${tex(String.raw`\mathbf{r}_i`)}、速度を ${tex(String.raw`\mathbf{v}_i`)} とします。ペアの距離 ${tex(String.raw`r_{ij}`)} は最小イメージで測り、${tex(String.raw`r_c = 2.5`)} で force-shifted 補正をした Lennard–Jones ポテンシャル ${tex(String.raw`V_{\mathrm{sf}}`)} を使います。全ポテンシャルエネルギーと力は
      ${eq(String.raw`U = \sum_{i<j} V_{\mathrm{sf}}(r_{ij}), \qquad \mathbf{F}_i = -\nabla_i U = \sum_{j \ne i} F_{\mathrm{sf}}(r_{ij})\,\frac{\mathbf{r}_{ij}}{r_{ij}}`)}
      です（${coreDoc('molecular', 'lj_forces', '全粒子の力の説明')}）。`,
    `初期配置は面心立方格子です。一辺に ${tex('n_c')} 個の単位胞を並べると
      ${eq(String.raw`N = 4n_c^3, \qquad L = \left(\frac{N}{\rho}\right)^{1/3}`)}
      です（${coreDoc('molecular', 'fcc_lattice', '面心立方格子の説明')}）。最小イメージ法が使えるように ${tex(String.raw`r_c < L/2`)} を確かめます。初期速度は各成分を正規分布から引き、平均を引いて全運動量を 0 にし、温度がちょうど ${tex('T_0')} になるよう全体を定数倍します（${coreDoc('molecular', 'initial_velocities', '初期速度の説明')}）。`,
    `全運動量 ${tex(String.raw`\mathbf{P} = \sum_i m\mathbf{v}_i`)} の時間微分は、運動方程式 ${tex(String.raw`m\mathbf{v}_i' = \mathbf{F}_i`)} と作用・反作用 ${tex(String.raw`\mathbf{F}_{ji} = -\mathbf{F}_{ij}`)} から
      ${eq(String.raw`\mathbf{P}' = \sum_i \mathbf{F}_i = \sum_i \sum_{j \ne i} \mathbf{F}_{ij} = \sum_{i<j} \left(\mathbf{F}_{ij} + \mathbf{F}_{ji}\right) = \mathbf{0}`)}
      です。最初に ${tex(String.raw`\mathbf{P} = \mathbf{0}`)} なら、ずっと 0 です（${coreDoc('molecular', 'total_momentum', '全運動量の説明')}）。`,
    `全エネルギー ${tex('E = K + U')}、${tex(String.raw`K = \sum_i \tfrac{1}{2}m|\mathbf{v}_i|^2`)} の時間微分は、合成関数の微分により
      ${eq(String.raw`E' = \sum_i m\,\mathbf{v}_i\cdot\mathbf{v}_i' + \sum_i \nabla_i U\cdot\mathbf{r}_i'`)}
      ${eq(String.raw`= \sum_i \mathbf{v}_i\cdot\mathbf{F}_i - \sum_i \mathbf{F}_i\cdot\mathbf{v}_i = 0`)}
      です。${tex('N')}、${tex('V')}、${tex('E')} が一定の集団を NVE アンサンブル（ミクロカノニカル集団）と呼びます（${coreDoc('molecular', 'kinetic_energy', '運動エネルギーの説明')}）。`,
    `速度 Verlet 法を Taylor 展開から導きます。${tex(String.raw`\mathbf{a}_i = \mathbf{F}_i/m`)} とすると
      ${eq(String.raw`\mathbf{r}_i(t + \Delta t) = \mathbf{r}_i(t) + \Delta t\,\mathbf{v}_i(t) + \tfrac{\Delta t^2}{2}\,\mathbf{a}_i(t) + O(\Delta t^3)`)}
      ${eq(String.raw`= \mathbf{r}_i(t) + \Delta t\left[\mathbf{v}_i(t) + \tfrac{\Delta t}{2}\,\mathbf{a}_i(t)\right] + O(\Delta t^3)`)}
      です。角括弧が半ステップの速度 ${tex(String.raw`\mathbf{v}_i(t + \Delta t/2)`)} です。速度は台形公式で
      ${eq(String.raw`\mathbf{v}_i(t + \Delta t) = \mathbf{v}_i(t) + \tfrac{\Delta t}{2}\left[\mathbf{a}_i(t) + \mathbf{a}_i(t + \Delta t)\right] + O(\Delta t^3)`)}
      ${eq(String.raw`= \mathbf{v}_i\!\left(t + \tfrac{\Delta t}{2}\right) + \tfrac{\Delta t}{2}\,\mathbf{a}_i(t + \Delta t) + O(\Delta t^3)`)}
      と書けます。1ステップの手順は、(1) 半ステップの速度、(2) 新しい位置（周期境界で折り返す）、(3) 新しい位置での力、(4) 残り半分の速度の更新です。力の計算は1ステップに1回です（${coreDoc('molecular', 'velocity_verlet', '速度 Verlet 法の説明')}）。`,
    `Euler法は
      ${eq(String.raw`\mathbf{r}_i(t + \Delta t) = \mathbf{r}_i(t) + \Delta t\,\mathbf{v}_i(t), \qquad \mathbf{v}_i(t + \Delta t) = \mathbf{v}_i(t) + \Delta t\,\mathbf{a}_i(t)`)}
      です（${coreDoc('molecular', 'forward_euler', 'Euler法の説明')}）。どちらの方法も力の総和が 0 なので、全運動量は保たれます。速度 Verlet 法は最後の証明のとおり時間を反転すると元の状態に戻り、全エネルギーの誤差は ${tex(String.raw`O(\Delta t^2)`)} の幅で振動するだけです。Euler法は時間反転について対称でなく、全エネルギーが一方向に増え続けます。`,
    `保存の度合いは、相対エネルギー変化
      ${eq(String.raw`\delta(t) = \frac{E(t) - E_0}{|E_0|}`)}
      で測ります。${tex('E_0')} は初期の全エネルギーです。目安として ${tex(String.raw`|\delta| \le 10^{-4}`)} を保つように時間刻みを選びます。`,
  ],
  figureAlt: '立方体セルの中で熱運動する球状の粒子群と、運動エネルギーとポテンシャルエネルギーが相補的に変わりながら全エネルギーが水平に保たれる時系列。',
  figure: experimentPanel({
    fieldsetLabel: '粒子系',
    fields: [
      { name: 'cells', label: '一辺の単位胞の数', symbol: 'n_c', value: 3, min: 1, max: 5, step: '1' },
      { name: 'density', label: '数密度', symbol: String.raw`\rho`, value: 0.8, min: 0.05, max: 1.2 },
      { name: 'temperature', label: '初期温度', symbol: 'T_0', value: 1, min: 0, max: 10 },
      { name: 'cutoff', label: 'カットオフ距離', symbol: 'r_c', value: 2.5, min: 0 },
      { name: 'seed', label: '擬似乱数の種', value: 1, min: 0, step: '1' },
    ],
    dt: 0.002,
    steps: 1000,
    sceneHeading: 'セルの中の原子（xy 平面への投影）',
    sceneCaption: '青の点は各原子の位置を xy 平面に投影したもの、灰色の枠は基本セルです。原子は面を出ると反対の面から入り直します。最初は面心立方格子の格子点にいるので、投影では列に並んで見えます。',
    sceneLabel: '周期境界のセルの中で動く原子',
    sceneHeight: 360,
    readouts: { position: '全エネルギー E（近似）', velocity: '運動エネルギー K（近似）', exact: '初期の全エネルギー E₀', error: '差 E − E₀' },
    plotsHeading: 'エネルギーの時間変化',
    legend: '<span><i class="numerical"></i>全エネルギー E</span><span><i class="analytical"></i>初期値 E₀</span><span><i class="difference"></i>ポテンシャル U</span>',
    tabs: methodTabs('この運動方程式の数値解法', [{ id: 'verlet', label: '速度 Verlet 法' }, { id: 'euler', label: 'Euler法' }]),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>運動、ポテンシャル、全エネルギー</h3><canvas id="energy-chart" role="img"></canvas><p>時間 t。灰色の線は運動エネルギー K</p></div><div class="plot-phase"><h3>相対エネルギー変化 ${tex(String.raw`\delta(t)`)}</h3><canvas id="drift-chart" role="img"></canvas><p>時間 t</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('n_c = 3')}、${tex(String.raw`\rho = 0.8`)} とします。粒子数とセルの一辺は
      ${eq(String.raw`N = 4\cdot 3^3 = 108, \qquad L = \left(\frac{108}{0.8}\right)^{1/3} = 135^{1/3} \approx 5.129928`)}
      で、${tex(String.raw`L/2 \approx 2.564964 > r_c = 2.5`)} です。ペアは ${tex(String.raw`108\cdot 107/2 = 5778`)} 組です。${tex(String.raw`N`)} と ${tex('5778')} は厳密、${tex('L')} の小数は近似です。`,
    `${tex('T_0 = 1')} なので、初期の運動エネルギーは ${tex(String.raw`K_0 = \tfrac{3N - 3}{2}\,T_0 = \tfrac{321}{2} = 160.5`)} で厳密です。格子の位置のポテンシャルエネルギーは ${tex(String.raw`U_0 \approx -574.636025`)}、全エネルギーは ${tex(String.raw`E_0 \approx -414.136025`)} です（ライブラリの値、近似）。`,
    `既定の条件 ${tex(String.raw`\Delta t = 0.002`)}、1000 ステップでは、速度 Verlet 法の ${tex(String.raw`|\delta|`)} の最大値は約 ${tex(String.raw`2.2\times 10^{-5}`)} で、目安の ${tex(String.raw`10^{-4}`)} を下回ります。運動エネルギーは約 160.5 から約 81.7 へ減り、その分ポテンシャルエネルギーが増えます。格子の位置はポテンシャルの谷底なので、運動エネルギーの約半分が振動のポテンシャルエネルギーに移り、温度は約 0.51 になります。全運動量の大きさは ${tex(String.raw`10^{-12}`)} より小さいままです。`,
    `Euler法の同じ条件では、全エネルギーが約 −1.82 まで増え、${tex(String.raw`\delta \approx 0.996`)} です（近似）。温度は約 2.14 に上がります。さらにステップ数を増やすと原子どうしが近づきすぎて計算が続けられなくなります。`,
  ],
  related: [
    { href: './accelerated.html', title: '等加速度直線運動' },
    { href: './noether.html', title: '対称性と保存則' },
    { href: './observables.html', title: '温度・圧力・動径分布関数' },
    { href: './nvt.html', title: 'NVT アンサンブルと熱浴法' },
  ],
  footer: 'この画面の計算は、周期境界の立方体セルの中の Lennard–Jones 粒子系です。',
  proof: writtenProof([{
    statement: `速度 Verlet 法の1ステップを ${tex(String.raw`\Phi_{\Delta t}`)} と書きます。状態 ${tex(String.raw`(\mathbf{r}, \mathbf{v})`)} から ${tex(String.raw`(\mathbf{r}', \mathbf{v}') = \Phi_{\Delta t}(\mathbf{r}, \mathbf{v})`)} へ進めたあと、速度の符号を変えて同じ手順を適用すると ${tex(String.raw`\Phi_{\Delta t}(\mathbf{r}', -\mathbf{v}') = (\mathbf{r}, -\mathbf{v})`)} です。すなわちこの方法は時間反転について対称です。`,
    proof: [
      `力は位置だけの関数 ${tex(String.raw`\mathbf{a}(\mathbf{r})`)} とします。1ステップは
        ${eq(String.raw`\mathbf{u} = \mathbf{v} + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}), \qquad \mathbf{r}' = \mathbf{r} + \Delta t\,\mathbf{u}, \qquad \mathbf{v}' = \mathbf{u} + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}')`)}
        です。`,
      `${tex(String.raw`(\mathbf{r}', -\mathbf{v}')`)} から同じ手順で進めます。半ステップの速度は
        ${eq(String.raw`\tilde{\mathbf{u}} = -\mathbf{v}' + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}') = -\mathbf{u} - \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}') + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}') = -\mathbf{u}`)}
        です。`,
      `位置は ${tex(String.raw`\mathbf{r}' + \Delta t\,\tilde{\mathbf{u}} = \mathbf{r} + \Delta t\,\mathbf{u} - \Delta t\,\mathbf{u} = \mathbf{r}`)} に戻ります。`,
      `速度は
        ${eq(String.raw`\tilde{\mathbf{u}} + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}) = -\mathbf{u} + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}) = -\mathbf{v} - \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}) + \tfrac{\Delta t}{2}\mathbf{a}(\mathbf{r}) = -\mathbf{v}`)}
        です。よって ${tex(String.raw`\Phi_{\Delta t}(\mathbf{r}', -\mathbf{v}') = (\mathbf{r}, -\mathbf{v})`)} です。Euler法では同じ計算が ${tex(String.raw`\mathbf{r}' - \Delta t\,\mathbf{v}' = \mathbf{r} - \Delta t^2\,\mathbf{a}(\mathbf{r})`)} となり、元に戻りません。`,
    ],
  }]),
});

const form = formReader(defaults);
let method: MdMethod = 'verlet';

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'energy-chart', 'drift-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const l = frame.values.box_length;
  const timeEnd = config.steps * config.dt;
  drawPlot(canvases[0], {
    label: 'セルの中の原子の xy 平面への投影。',
    lines: [line(frame, 'box')],
    dots: pointsWith(frame, 'atom', 3.5),
    equalAspect: true,
    xMin: 0,
    xMax: l,
    yMin: 0,
    yMax: l,
  });
  drawPlot(canvases[1], {
    key: `${key}|energy`,
    label: 'エネルギーと時間のグラフ。灰色の線は運動エネルギー、誤差の色の線はポテンシャルエネルギー、実線は全エネルギー、破線は初期の全エネルギー。',
    xMin: 0,
    xMax: timeEnd,
    lines: [line(frame, 'kinetic', 'K'), line(frame, 'potential', 'U'), line(frame, 'initial'), line(frame, 'total', 'E')],
    zeroLabel: '0',
  });
  const drift = line(frame, 'drift');
  const spread = drift.y.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
  drawPlot(canvases[2], {
    key: spread < 1e-4 ? undefined : `${key}|drift`,
    label: '相対エネルギー変化と時間のグラフ。',
    xMin: 0,
    xMax: timeEnd,
    ...(spread < 1e-4 ? { yMin: -1e-4, yMax: 1e-4 } : {}),
    lines: [drift],
    zeroLabel: 'δ = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-nve.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `粒子数 N ${v ? v.particles : '—'}`,
      `セルの一辺 L ${fixed(v?.box_length)}`,
      `瞬時温度 T ${fixed(v?.temperature)}（近似）`,
      `全運動量の大きさ |P| ${v ? v.momentum.toExponential(2) : '—'}`,
      `相対エネルギー変化 δ ${v ? v.drift.toExponential(2) : '—'}`,
      `|δ| の最大値 ${v ? v.max_drift.toExponential(2) : '—'}`,
    ].join('\n');
  },
});
bindMethodTabs<MdMethod>(next => {
  method = next;
  session.reloadMethod();
});
