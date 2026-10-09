import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { dot, eq, experimentPanel, formReader, lessonFigure, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, LessonFigure, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';
import { onThemeChange } from './theme';

type DimerMethod = 'verlet' | 'euler';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'md/lennard-jones',
  mass: 1,
  speed: 1,
  dt: 0.005,
  steps: 1000,
};

const legend = '<span><i class="analytical"></i>V(r)、F(r)</span><span><i class="numerical"></i>force-shifted 補正</span><span><i class="difference"></i>切断だけ</span>';

renderLesson({
  id: 'lennard-jones',
  section: { label: '分子動力学' },
  title: 'Lennard–Jones ポテンシャル',
  description: `中性原子の間の相互作用を、近距離の反発と遠距離の引力をもつ中心力ポテンシャル ${tex('V(r)')} で表します。力 ${tex('F(r) = -V\'(r)')} を導き、最も低い点 ${tex(String.raw`r_0 = 2^{1/6}\sigma`)}、カットオフでの補正、2原子の振動を計算します。エネルギー、長さ、質量の単位を ${tex(String.raw`\varepsilon`)}、${tex(String.raw`\sigma`)}、${tex('m')} にとり、${tex(String.raw`\varepsilon = \sigma = m = k_B = 1`)} とします。`,
  equation: [
    String.raw`V(r) = 4\varepsilon\left[\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]`,
    String.raw`F(r) = -V'(r) = \frac{24\varepsilon}{r}\left[2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]`,
  ],
  studyHeading: 'ポテンシャルから力、最小点、カットオフ補正への手順',
  steps: [
    `記号を定めます。${tex('r > 0')} は2原子の中心間距離、${tex(String.raw`\varepsilon > 0`)} は井戸の深さ（エネルギー）、${tex(String.raw`\sigma > 0`)} は ${tex('V = 0')} となる距離です。第1項 ${tex(String.raw`(\sigma/r)^{12}`)} は電子雲の重なりによる反発、第2項 ${tex(String.raw`-(\sigma/r)^{6}`)} は分散力による引力を表します。べきを ${tex('r')} について書き直すと
      ${eq(String.raw`V(r) = 4\varepsilon\sigma^{12}\,r^{-12} - 4\varepsilon\sigma^{6}\,r^{-6}`)}
      です（${coreDoc('molecular', 'lj_potential', 'Lennard–Jones ポテンシャルの説明')}）。`,
    `${tex('r^{-n}')} の微分 ${tex(String.raw`-n\,r^{-n-1}`)} を各項に使います。
      ${eq(String.raw`V'(r) = 4\varepsilon\sigma^{12}\cdot(-12)\,r^{-13} - 4\varepsilon\sigma^{6}\cdot(-6)\,r^{-7}`)}
      ${eq(String.raw`= -48\varepsilon\sigma^{12}\,r^{-13} + 24\varepsilon\sigma^{6}\,r^{-7}`)}
      ${eq(String.raw`= -\frac{24\varepsilon}{r}\left[2\,\sigma^{12} r^{-12} - \sigma^{6} r^{-6}\right]`)}
      ${eq(String.raw`= -\frac{24\varepsilon}{r}\left[2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]`)}
      符号を変えた ${tex(String.raw`F(r) = -V'(r)`)} が力の大きさで、正が反発、負が引力です（${coreDoc('molecular', 'lj_force_magnitude', '力の大きさの説明')}）。`,
    `原子 ${tex('i')} の位置を ${tex(String.raw`\mathbf{r}_i`)}、${tex(String.raw`\mathbf{r}_{ij} = \mathbf{r}_i - \mathbf{r}_j`)}、${tex(String.raw`r_{ij} = |\mathbf{r}_{ij}|`)} とします。${tex(String.raw`r_{ij} = \sqrt{(x_i - x_j)^2 + (y_i - y_j)^2 + (z_i - z_j)^2}`)} を ${tex('x_i')} で偏微分すると ${tex(String.raw`\partial r_{ij}/\partial x_i = (x_i - x_j)/r_{ij}`)} なので、
      ${eq(String.raw`\nabla_i r_{ij} = \frac{\mathbf{r}_{ij}}{r_{ij}}`)}
      ${eq(String.raw`\mathbf{F}_{ij} = -\nabla_i V(r_{ij}) = -V'(r_{ij})\,\frac{\mathbf{r}_{ij}}{r_{ij}} = 24\varepsilon\left[2\left(\frac{\sigma}{r_{ij}}\right)^{12} - \left(\frac{\sigma}{r_{ij}}\right)^{6}\right]\frac{\mathbf{r}_{ij}}{r_{ij}^2}`)}
      です。${tex(String.raw`\nabla_j r_{ij} = -\mathbf{r}_{ij}/r_{ij}`)} なので ${tex(String.raw`\mathbf{F}_{ji} = -\mathbf{F}_{ij}`)} で、作用・反作用の法則を満たします。`,
    `ポテンシャルが最も低い距離 ${tex('r_0')} では力が 0 です。
      ${eq(String.raw`F(r_0) = 0 \iff 2\left(\frac{\sigma}{r_0}\right)^{12} = \left(\frac{\sigma}{r_0}\right)^{6} \iff \left(\frac{\sigma}{r_0}\right)^{6} = \frac{1}{2}`)}
      ${eq(String.raw`r_0 = 2^{1/6}\sigma`)}
      ${eq(String.raw`V(r_0) = 4\varepsilon\left[\left(\tfrac{1}{2}\right)^{2} - \tfrac{1}{2}\right] = 4\varepsilon\left(\tfrac{1}{4} - \tfrac{1}{2}\right) = -\varepsilon`)}
      です（${coreDoc('molecular', 'lj_equilibrium_distance', '最小点の距離の説明')}）。${tex('r < r_0')} で ${tex('F > 0')}（反発）、${tex('r > r_0')} で ${tex('F < 0')}（引力）です。2階微分 ${tex(String.raw`V''(r) = 4\varepsilon(156\,\sigma^{12} r^{-14} - 42\,\sigma^{6} r^{-8})`)} に ${tex(String.raw`(\sigma/r_0)^6 = 1/2`)} を入れると
      ${eq(String.raw`V''(r_0) = \frac{4\varepsilon}{r_0^2}\left(\frac{156}{4} - \frac{42}{2}\right) = \frac{72\varepsilon}{r_0^2} = \frac{72\varepsilon}{2^{1/3}\sigma^2} > 0`)}
      なので、${tex('r_0')} は極小点です。`,
    `多数の原子の和では、遠いペアを省いて計算量を減らします。カットオフ距離 ${tex('r_c')}（通常 ${tex(String.raw`2.5\sigma`)}）より遠いペアを 0 とする切断だけのポテンシャルは
      ${eq(String.raw`V_{\mathrm{c}}(r) = \begin{cases} V(r) & (r < r_c) \\ 0 & (r \ge r_c) \end{cases}`)}
      です。${tex('r = r_c')} でポテンシャルは ${tex('-V(r_c)')} だけ、力は ${tex('-F(r_c)')} だけ跳びます。原子がこの距離をまたぐたびにエネルギーが跳ぶので、全エネルギーが保たれません（${coreDoc('molecular', 'lj_truncated_potential', '切断だけのポテンシャルの説明')}）。`,
    `force-shifted 補正では、${tex('r_c')} での値と傾きを引きます。
      ${eq(String.raw`V_{\mathrm{sf}}(r) = V(r) - V(r_c) - (r - r_c)\,V'(r_c) \quad (r < r_c)`)}
      ${eq(String.raw`V_{\mathrm{sf}}(r_c) = V(r_c) - V(r_c) - 0 = 0`)}
      ${eq(String.raw`V_{\mathrm{sf}}'(r) = V'(r) - V'(r_c), \qquad V_{\mathrm{sf}}'(r_c) = 0`)}
      ${eq(String.raw`F_{\mathrm{sf}}(r) = -V_{\mathrm{sf}}'(r) = F(r) - F(r_c)`)}
      ポテンシャルと力がともに ${tex('r_c')} で連続に 0 になります。その代わりに井戸は少し浅くなります（${coreDoc('molecular', 'lj_force_shifted_potential', 'force-shifted ポテンシャルの説明')}、${coreDoc('molecular', 'lj_force_shifted_force', 'force-shifted の力の説明')}）。`,
    `2原子（質量 ${tex('m')}）を ${tex('x')} 軸に置き、${tex('x_1 < x_2')}、${tex('r = x_2 - x_1')} とします。運動方程式と、その差をとった相対運動の式は
      ${eq(String.raw`m x_1'' = -F(r), \qquad m x_2'' = F(r)`)}
      ${eq(String.raw`r'' = x_2'' - x_1'' = \frac{2F(r)}{m}, \qquad \mu\,r'' = F(r), \quad \mu = \frac{m}{2}`)}
      です。全エネルギー ${tex(String.raw`E = \tfrac{1}{2}m v_1^2 + \tfrac{1}{2}m v_2^2 + V(r)`)}（${tex(String.raw`v_i = x_i'`)}）の時間微分は
      ${eq(String.raw`E' = v_1\,m x_1'' + v_2\,m x_2'' + V'(r)\,r' = -v_1 F + v_2 F - F\,(v_2 - v_1) = 0`)}
      なので、${tex('E')} は一定です。${tex('r')} は ${tex('V(r) = E')} となる2つの折り返し点のあいだを往復します（${coreDoc('molecular', 'lj_turning_points', '折り返し点の説明')}）。`,
    `画面の数値解は速度 Verlet 法で、時間刻み ${tex(String.raw`\Delta t`)}、加速度 ${tex(String.raw`a_i = \mp F(r)/m`)} として
      ${eq(String.raw`v_i\!\left(t + \tfrac{\Delta t}{2}\right) = v_i(t) + \tfrac{\Delta t}{2}\,a_i(t)`)}
      ${eq(String.raw`x_i(t + \Delta t) = x_i(t) + \Delta t\,v_i\!\left(t + \tfrac{\Delta t}{2}\right)`)}
      ${eq(String.raw`v_i(t + \Delta t) = v_i\!\left(t + \tfrac{\Delta t}{2}\right) + \tfrac{\Delta t}{2}\,a_i(t + \Delta t)`)}
      と進めた近似です。この方法は時間を反転しても同じ式になり、${tex('E')} の誤差は ${tex(String.raw`O(\Delta t^2)`)} の幅で振動するだけです。Euler法 ${tex(String.raw`x_i \gets x_i + \Delta t\,v_i`)}、${tex(String.raw`v_i \gets v_i + \Delta t\,a_i`)} はこの対称性をもたず、${tex('E')} が増え続けます。`,
  ],
  figureAlt: 'Lennard–Jones ポテンシャル V(r) と力 F(r) の曲線。r₀ = 2^{1/6}σ で V が最小値 −ε をとり、F が反発から引力へ符号を変える図。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="curve-heading">
        <div class="panel-heading"><h2 id="curve-heading">ポテンシャル ${tex('V(r)')} と力 ${tex('F(r)')}</h2><div class="legend">${legend}</div></div>
        <div class="plot-pair">
          <div><h3>ポテンシャル ${tex(String.raw`V(r)/\varepsilon`)}</h3><canvas id="potential-chart" role="img"></canvas><p>距離 ${tex(String.raw`r/\sigma`)}</p></div>
          <div><h3>力 ${tex(String.raw`F(r)\,\sigma/\varepsilon`)}</h3><canvas id="force-chart" role="img"></canvas><p>距離 ${tex(String.raw`r/\sigma`)}</p></div>
        </div>
        <div class="readouts">
          <div><span>最小点 r₀（近似）</span><output id="lj-r0">—</output></div>
          <div><span>V(r₀)（厳密に −1）</span><output id="lj-v-r0">—</output></div>
          <div><span>V(r_c)、r_c = 2.5（厳密）</span><output id="lj-v-rc">—</output></div>
          <div><span>F(r_c)（厳密）</span><output id="lj-f-rc">—</output></div>
        </div>
      </section>
      ${experimentPanel({
        fieldsetLabel: '2原子',
        fields: [
          { name: 'mass', label: '原子の質量', symbol: 'm', value: 1, min: 0 },
          { name: 'speed', label: 'r₀ での相対速度', symbol: 'w_0', value: 1, min: 0, max: 1.9 },
        ],
        dt: 0.005,
        steps: 1000,
        sceneHeading: `ポテンシャルの上の2原子の距離 ${tex('r(t)')}`,
        sceneCaption: '原子1を原点に固定した相対座標で描きます。上の段の灰色の点が原子1、青の点が原子2で、横軸の位置がそのまま原子間距離 r です。曲線上の青い点は (r, V(r))、灰色の水平線は全エネルギー E₀ の高さで、その両端が折り返し点です。青緑の輪は最小点 (r₀, −1) です。',
        sceneLabel: 'ポテンシャル曲線と、その上を往復する原子間距離',
        sceneHeight: 320,
        readouts: { position: '全エネルギー E（近似）', velocity: '原子間距離 r（近似）', exact: '初期の全エネルギー E₀（厳密）', error: '差 E − E₀' },
        plotsHeading: '原子間距離と全エネルギーの時間変化',
        tabs: methodTabs('この運動方程式の数値解法', [{ id: 'verlet', label: '速度 Verlet 法' }, { id: 'euler', label: 'Euler法' }]),
        plots: `<div class="plot-grid"><div class="plot-main"><h3>原子間距離 ${tex('r(t)')}</h3><canvas id="separation-chart" role="img"></canvas><p>時間 t。青緑の破線は折り返し点 ${tex(String.raw`r_{\min}`)}、${tex(String.raw`r_{\max}`)}</p></div><div class="plot-phase"><h3>全エネルギー ${tex('E(t)')}</h3><canvas id="energy-chart" role="img"></canvas><p>時間 t。破線は ${tex('E_0')}</p></div></div>`,
      })}`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\varepsilon = \sigma = 1`)} とします。最小点は ${tex(String.raw`r_0 = 2^{1/6} \approx 1.122462`)}（近似）で、${tex('V(r_0) = -1')}、${tex('F(r_0) = 0')} は厳密です。${tex(String.raw`r = \sigma = 1`)} では ${tex(String.raw`(\sigma/r)^6 = 1`)} なので
      ${eq(String.raw`V(1) = 4(1 - 1) = 0, \qquad F(1) = 24\,(2 - 1) = 24`)}
      で、どちらも厳密です。${tex(String.raw`V''(r_0) = 72/2^{1/3} \approx 57.146`)}（近似）です。`,
    `${tex(String.raw`r_c = 2.5`)} では ${tex(String.raw`\sigma/r_c = 0.4`)}、${tex(String.raw`0.4^6 = 0.004096`)}、${tex(String.raw`0.4^{12} = 0.000016777216`)} なので
      ${eq(String.raw`V(r_c) = 4\,(0.000016777216 - 0.004096) = -0.016316891136`)}
      ${eq(String.raw`F(r_c) = \frac{24}{2.5}\,(0.000033554432 - 0.004096) = -0.0389994774528`)}
      で、どちらも有限桁の小数で書ける厳密な値です。切断だけのポテンシャルは ${tex('r_c')} で約 0.0163 跳びます。force-shifted 補正をした井戸の底は
      ${eq(String.raw`V_{\mathrm{sf}}(r_0) = -1 + 0.016316891136 + (r_0 - 2.5)(-0.0389994774528) \approx -0.929960`)}
      （近似）で、補正前の −1 より約 7% 浅くなります。`,
    `2原子の例では ${tex('m = 1')}、${tex('r(0) = r_0')}、相対速度 ${tex('w_0 = 1')}（${tex(String.raw`v_1 = -1/2`)}、${tex(String.raw`v_2 = 1/2`)}）とします。全エネルギーは
      ${eq(String.raw`E_0 = \tfrac{1}{2}\cdot\tfrac{1}{4} + \tfrac{1}{2}\cdot\tfrac{1}{4} + V(r_0) = \tfrac{1}{4} - 1 = -\tfrac{3}{4}`)}
      で厳密です。折り返し点は ${tex(String.raw`x = (\sigma/r)^6`)} として ${tex(String.raw`4(x^2 - x) = -3/4`)}、すなわち ${tex(String.raw`x^2 - x + 3/16 = 0`)} の根 ${tex(String.raw`x = 3/4,\ 1/4`)} から
      ${eq(String.raw`r_{\min} = (4/3)^{1/6} \approx 1.049115, \qquad r_{\max} = 4^{1/6} = 2^{1/3} \approx 1.259921`)}
      です。根号の形が厳密で、小数は近似です。`,
    `既定の条件 ${tex(String.raw`\Delta t = 0.005`)}、1000 ステップで再生すると、速度 Verlet 法では計算の終わりに ${tex(String.raw`E \approx -0.749896`)}、${tex(String.raw`|E - E_0| \approx 1.0\times 10^{-4}`)} で、距離は ${tex(String.raw`r_{\min}`)} と ${tex(String.raw`r_{\max}`)} のあいだを往復し続けます（どちらも近似）。Euler法では同じ時間に ${tex('E')} が約 0.062 まで増えて正になり、2原子は離れていきます。`,
  ],
  related: [
    { href: './two-body.html', title: '中心力場と2体問題' },
    { href: './periodic.html', title: '周期境界条件と最小イメージ法' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
  ],
  footer: 'この画面の計算は、Lennard–Jones ポテンシャルで相互作用する2原子です。',
});

const form = formReader(defaults);
let method: DimerMethod = 'verlet';
let curves: LessonFigure | undefined;

function paintCurves() {
  if (!curves) return;
  const potential = document.getElementById('potential-chart') as HTMLCanvasElement;
  const force = document.getElementById('force-chart') as HTMLCanvasElement;
  drawPlot(potential, {
    label: '距離 r に対するポテンシャル。破線は V(r)、実線は force-shifted 補正、誤差の色の線は切断だけのポテンシャル。',
    lines: [line(curves, 'truncated'), line(curves, 'potential'), line(curves, 'shifted')],
    dots: [{ ...dot(curves, 'minimum', 'r₀'), hollow: true, radius: 5 }],
    xMin: 0.9,
    xMax: 3.2,
    yMin: -1.2,
    yMax: 1,
    zeroLabel: 'V = 0',
  });
  drawPlot(force, {
    label: '距離 r に対する力。破線は F(r)、実線は force-shifted 補正をした力。',
    lines: [line(curves, 'force'), line(curves, 'shifted-force')],
    xMin: 0.9,
    xMax: 3.2,
    yMin: -3,
    yMax: 6,
    zeroLabel: 'F = 0',
  });
}

lessonFigure('md/lennard-jones', { cutoff: 2.5 }).then(figure => {
  curves = figure;
  const v = figure.values;
  for (const [id, value] of [['lj-r0', v.r0], ['lj-v-r0', v.v_r0], ['lj-v-rc', v.v_rc], ['lj-f-rc', v.f_rc]] as const) {
    document.getElementById(id)!.textContent = fixed(value, id === 'lj-r0' ? 6 : id === 'lj-f-rc' ? 13 : 12);
  }
  paintCurves();
}).catch(() => {
  const error = document.getElementById('error')!;
  error.textContent = 'ポテンシャルの値を計算できません。';
  error.hidden = false;
});
window.addEventListener('resize', paintCurves);
onThemeChange(paintCurves);

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'separation-chart', 'energy-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  const lines = [line(frame, 'potential')];
  const turning = frame.series.some(s => s.name === 'level');
  if (turning) lines.push(line(frame, 'level'));
  drawPlot(canvases[0], {
    label: 'ポテンシャル曲線と2原子。横軸は原子間距離 r。',
    lines,
    dots: [
      { ...dot(frame, 'minimum'), hollow: true, radius: 5 },
      { ...dot(frame, 'atom-a', '原子1'), radius: 8 },
      { ...dot(frame, 'atom-b', '原子2'), radius: 8 },
      { ...dot(frame, 'state'), radius: 5 },
    ],
    xMin: 0,
    xMax: 3,
    yMin: -1.2,
    yMax: 1,
    zeroLabel: 'V = 0',
  });
  const times = points.map(p => p.time);
  const v = frame.values;
  drawPlot(canvases[1], {
    key: `${key}|separation`,
    label: '原子間距離と時間のグラフ。実線は数値解、破線は折り返し点。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      ...(turning ? [
        { x: [0, timeEnd], y: [v.r_min, v.r_min], role: 'exact' },
        { x: [0, timeEnd], y: [v.r_max, v.r_max], role: 'exact' },
      ] : []),
      { x: times, y: points.map(p => p.velocity), role: 'numerical' },
    ],
    dots: [{ x: state.time, y: state.velocity, role: 'numerical' }],
  });
  const energies = points.map(p => p.position);
  const spread = energies.reduce((a, b) => Math.max(a, Math.abs(b - state.exact_position)), 0);
  const narrow = spread < 0.01;
  drawPlot(canvases[2], {
    key: narrow ? undefined : `${key}|energy`,
    label: '全エネルギーと時間のグラフ。実線は数値解、破線は初期値。',
    xMin: 0,
    xMax: timeEnd,
    ...(narrow ? { yMin: state.exact_position - 0.01, yMax: state.exact_position + 0.01 } : {}),
    lines: [
      { x: [0, timeEnd], y: [state.exact_position, state.exact_position], role: 'exact' },
      { x: times, y: energies, role: 'numerical' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-lennard-jones.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `原子間距離 r ${fixed(v?.separation)}（近似）`,
      `折り返し点 r_min ${fixed(v?.r_min)}（近似）`,
      `折り返し点 r_max ${fixed(v?.r_max)}（近似）`,
      `全エネルギーの差 E − E₀ ${(state.position_error ?? 0).toExponential(2)}`,
    ].join('\n');
  },
});
bindMethodTabs<DimerMethod>(next => {
  method = next;
  session.reloadMethod();
});
