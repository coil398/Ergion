import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed, pointsWith } from './figures/statistics';
import type { PlotLine } from './figures/plot';
import { eq, experimentPanel, formReader, lessonFigure, line, renderLesson } from './lesson';
import type { LessonConfig, LessonFigure, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'md/observables',
  cells: 3,
  density: 0.8,
  temperature: 1.6,
  seed: 1,
  cutoff: 2.5,
  bins: 40,
  equilibration: 400,
  sample_interval: 10,
  block: 200,
  dt: 0.005,
  steps: 3000,
};

renderLesson({
  id: 'observables',
  section: { label: '分子動力学' },
  title: '温度・圧力・動径分布関数',
  description: `NVE の分子動力学の軌道から、瞬時温度、ビリアル圧力、動径分布関数 ${tex('g(r)')} を求め、時間平均とブロック平均による標準誤差を計算します。エネルギー、長さ、質量の単位を ${tex(String.raw`\varepsilon`)}、${tex(String.raw`\sigma`)}、${tex('m')} にとり、${tex(String.raw`\varepsilon = \sigma = m = k_B = 1`)} とします。`,
  equation: [
    String.raw`T = \frac{2K}{(3N - 3)\,k_B}, \qquad P = \frac{N k_B T}{V} + \frac{1}{3V}\sum_{i<j} \mathbf{r}_{ij}\cdot\mathbf{F}_{ij}`,
    String.raw`g(r) = \frac{V}{N^2\,4\pi r^2\,\Delta r}\left\langle \sum_i \sum_{j \ne i} \delta(r - r_{ij}) \right\rangle`,
  ],
  equationNote: `${tex(String.raw`\mathbf{r}_{ij} = \mathbf{r}_i - \mathbf{r}_j`)}（最小イメージ）、${tex(String.raw`\mathbf{F}_{ij}`)} は原子 ${tex('j')} が原子 ${tex('i')} に及ぼす力`,
  studyHeading: '時間平均から温度、圧力、動径分布関数への手順',
  steps: [
    `記号を定めます。${tex('N')} は粒子数、${tex('V = L^3')} は体積、${tex(String.raw`\rho = N/V`)} は数密度、${tex(String.raw`K = \sum_i \tfrac{1}{2}m|\mathbf{v}_i|^2`)} は全運動エネルギー、${tex('k_B')} は Boltzmann 定数です。物理量 ${tex('A')} の時間平均を ${tex(String.raw`\langle A\rangle = \lim_{\tau\to\infty}\frac{1}{\tau}\int_0^\tau A(t)\,dt`)} と書きます。エルゴード仮説では、これが平衡状態の集団平均に等しいとします。計算では有限の時間の標本平均で近似します。`,
    `エネルギー等分配則では、速度の1成分あたり ${tex(String.raw`\langle \tfrac{1}{2}m v_{i\alpha}^2 \rangle = \tfrac{1}{2}k_B T`)} です。全運動量 ${tex(String.raw`\mathbf{P} = \mathbf{0}`)} の3つの拘束で自由度は ${tex('3N - 3')} なので
      ${eq(String.raw`\langle K\rangle = \frac{3N - 3}{2}\,k_B T`)}
      ${eq(String.raw`T = \frac{2K}{(3N - 3)\,k_B}`)}
      です。各時刻の ${tex('K')} から求めた値を瞬時温度と呼びます（${coreDoc('molecular', 'instantaneous_temperature', '瞬時温度の説明')}）。`,
    `圧力はビリアル定理から求めます。${tex(String.raw`G = \sum_i \mathbf{r}_i\cdot m\mathbf{v}_i`)} の時間微分は
      ${eq(String.raw`G' = \sum_i m|\mathbf{v}_i|^2 + \sum_i \mathbf{r}_i\cdot\mathbf{F}_i = 2K + \sum_i \mathbf{r}_i\cdot\mathbf{F}_i`)}
      です。${tex('G')} が有界なら ${tex(String.raw`\langle G'\rangle = 0`)} です。力を容器の壁からの力と粒子間の力に分けます。壁が面積要素 ${tex(String.raw`d\mathbf{S}`)} に及ぼす力は ${tex(String.raw`-P\,d\mathbf{S}`)} なので、発散定理と ${tex(String.raw`\nabla\cdot\mathbf{r} = 3`)} から
      ${eq(String.raw`\Big\langle \sum_i \mathbf{r}_i\cdot\mathbf{F}_i^{\mathrm{wall}} \Big\rangle = -P\oint \mathbf{r}\cdot d\mathbf{S} = -P\int_V \nabla\cdot\mathbf{r}\,dV = -3PV`)}
      です。粒子間の力は ${tex(String.raw`\mathbf{F}_{ji} = -\mathbf{F}_{ij}`)} を使ってペアにまとめます。
      ${eq(String.raw`\sum_i \mathbf{r}_i\cdot\mathbf{F}_i^{\mathrm{pair}} = \sum_{i<j}\left(\mathbf{r}_i\cdot\mathbf{F}_{ij} + \mathbf{r}_j\cdot\mathbf{F}_{ji}\right) = \sum_{i<j} \mathbf{r}_{ij}\cdot\mathbf{F}_{ij} = W`)}`,
    `${tex(String.raw`\langle G'\rangle = 0`)} に代入して ${tex('P')} について解きます。
      ${eq(String.raw`0 = 2\langle K\rangle - 3PV + \langle W\rangle`)}
      ${eq(String.raw`P = \frac{2\langle K\rangle}{3V} + \frac{\langle W\rangle}{3V}`)}
      ${tex('N')} が大きいとき ${tex(String.raw`2\langle K\rangle/3 \approx N k_B T`)} なので、各時刻の値は
      ${eq(String.raw`P = \frac{N k_B T}{V} + \frac{W}{3V}`)}
      です。第1項は理想気体の圧力、第2項は粒子間の力の寄与で、反発なら正、引力なら負です。周期境界では ${tex(String.raw`\mathbf{r}_{ij}`)} を最小イメージにとり、${tex(String.raw`r\,F_{\mathrm{sf}}(r)`)} の和として計算します（${coreDoc('molecular', 'virial_pressure', 'ビリアル圧力の説明')}）。`,
    `動径分布関数は、1つの粒子から距離 ${tex('r')} の殻 ${tex(String.raw`[r, r + \Delta r)`)} にある粒子の平均個数を、一様な分布での期待値 ${tex(String.raw`\rho\,4\pi r^2\Delta r`)} で割ったものです。粒子についての平均を ${tex(String.raw`\frac{1}{N}\sum_i`)} として
      ${eq(String.raw`g(r) = \frac{1}{\rho\,4\pi r^2\Delta r}\cdot\frac{1}{N}\Big\langle \sum_i \sum_{j \ne i} \mathbb{1}\big[r \le r_{ij} < r + \Delta r\big] \Big\rangle = \frac{V}{N^2\,4\pi r^2\,\Delta r}\Big\langle \cdots \Big\rangle`)}
      です。計算では ${tex(String.raw`i < j`)} のペアだけを数えて2倍し、殻の体積を正確に ${tex(String.raw`\frac{4\pi}{3}\left[(r + \Delta r)^3 - r^3\right]`)} とします。距離は最小イメージで測るので ${tex(String.raw`r < L/2`)} に限ります（${coreDoc('molecular', 'pair_distance_histogram', 'ペア距離の度数の説明')}、${coreDoc('molecular', 'radial_distribution', '動径分布関数の説明')}）。`,
    `連続するステップの値は互いに相関するので、各ステップを独立とみなすと標準誤差を小さく見積もりすぎます。${tex('n')} 個の値を長さ ${tex('b')} のブロック ${tex(String.raw`n_b = \lfloor n/b \rfloor`)} 個に分け、ブロック平均 ${tex(String.raw`\bar{A}_m`)} を独立な標本とみなします。
      ${eq(String.raw`\bar{A} = \frac{1}{n_b}\sum_{m=1}^{n_b} \bar{A}_m, \qquad s_b^2 = \frac{1}{n_b - 1}\sum_{m=1}^{n_b}\left(\bar{A}_m - \bar{A}\right)^2, \qquad \mathrm{SE} = \frac{s_b}{\sqrt{n_b}}`)}
      です（${coreDoc('molecular', 'block_average', 'ブロック平均の説明')}）。最初の ${tex('n_{\\mathrm{eq}}')} ステップは面心立方格子から融けて平衡に近づく途中なので、平均にも ${tex('g(r)')} にも使いません。`,
  ],
  figureAlt: '距離 r に対する動径分布関数 g(r) は、第1近接殻と第2近接殻のピークが並び、遠くで 1 に近づく。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="hand-heading">
        <div class="panel-heading"><h2 id="hand-heading">2原子の配置の温度と圧力（L = 10）</h2></div>
        <div class="readouts">
          <div><span>瞬時温度 T（厳密に 2/3）</span><output id="obs-temperature">—</output></div>
          <div><span>ビリアル W（厳密）</span><output id="obs-virial">—</output></div>
          <div><span>理想気体の項 NT/V</span><output id="obs-ideal">—</output></div>
          <div><span>ビリアル圧力 P（近似）</span><output id="obs-pressure">—</output></div>
        </div>
      </section>
      ${experimentPanel({
        fieldsetLabel: '粒子系と平均',
        fields: [
          { name: 'cells', label: '一辺の単位胞の数', symbol: 'n_c', value: 3, min: 1, max: 5, step: '1' },
          { name: 'density', label: '数密度', symbol: String.raw`\rho`, value: 0.8, min: 0.05, max: 1.2 },
          { name: 'temperature', label: '初期温度', symbol: 'T_0', value: 1.6, min: 0, max: 10 },
          { name: 'cutoff', label: 'カットオフ距離', symbol: 'r_c', value: 2.5, min: 0 },
          { name: 'seed', label: '擬似乱数の種', value: 1, min: 0, step: '1' },
          { name: 'bins', label: 'g(r) のビンの数', symbol: 'M', value: 40, min: 1, max: 200, step: '1' },
          { name: 'equilibration', label: '平均に使わないステップ数', symbol: String.raw`n_{\mathrm{eq}}`, value: 400, min: 0, step: '1' },
          { name: 'sample_interval', label: 'g(r) を数える間隔', value: 10, min: 1, max: 1000, step: '1' },
          { name: 'block', label: 'ブロックの長さ', symbol: 'b', value: 200, min: 1, step: '1' },
        ],
        dt: 0.005,
        steps: 3000,
        sceneHeading: 'セルの中の原子（xy 平面への投影）',
        sceneCaption: '青の点は各原子の位置を xy 平面に投影したもの、灰色の枠は基本セルです。面心立方格子から始め、初期温度 1.6 で格子が融けて液体になります。',
        sceneLabel: '周期境界のセルの中で動く原子',
        sceneHeight: 320,
        readouts: { position: '温度の平均 ⟨T⟩（近似）', velocity: '圧力の平均 ⟨P⟩（近似）', exact: '瞬時温度 T(t)', error: '差 ⟨T⟩ − T(t)' },
        plotsHeading: '動径分布関数と温度・圧力の時間変化',
        legend: '<span><i class="numerical"></i>分子動力学の値</span><span><i class="difference"></i>ブロック平均</span>',
        plots: `<div class="lesson-figure"><div><h3>動径分布関数 ${tex('g(r)')}</h3><canvas id="g-chart" role="img"></canvas><p>距離 ${tex(String.raw`r/\sigma`)}。灰色の線は ${tex('g = 1')}</p></div><div class="plot-pair"><div><h3>瞬時温度 ${tex('T(t)')}</h3><canvas id="temperature-chart" role="img"></canvas><p>時間 t。灰色の線は ${tex(String.raw`\bar{T}`)}</p></div><div><h3>瞬時圧力 ${tex('P(t)')}</h3><canvas id="pressure-chart" role="img"></canvas><p>時間 t。灰色の線は ${tex(String.raw`\bar{P}`)}</p></div></div></div>`,
      })}`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('N = 2')}、${tex('L = 10')} のセルに ${tex(String.raw`\mathbf{r}_1 = (0, 0, 0)`)}、${tex(String.raw`\mathbf{r}_2 = (1, 0, 0)`)}、${tex(String.raw`\mathbf{v}_1 = (1, 0, 0)`)}、${tex(String.raw`\mathbf{v}_2 = (-1, 0, 0)`)} を置きます。
      ${eq(String.raw`K = \tfrac{1}{2}(1 + 1) = 1, \qquad T = \frac{2\cdot 1}{3\cdot 2 - 3} = \frac{2}{3}`)}
      で厳密です。`,
    `${tex(String.raw`\varepsilon = \sigma = 1`)} の力 ${tex(String.raw`F(r) = \frac{24}{r}\left[2r^{-12} - r^{-6}\right]`)} に距離を代入します。
      ${eq(String.raw`F(1) = \frac{24}{1}\left[2\cdot 1^{12} - 1^{6}\right] = 24(2 - 1) = 24`)}
      ${tex(String.raw`r_c = 2.5`)} では ${tex(String.raw`1/r_c = 0.4`)} です。べきを順に計算します。
      ${eq(String.raw`0.4^{2} = 0.16, \qquad 0.4^{4} = 0.0256, \qquad 0.4^{6} = 0.0256\cdot 0.16 = 0.004096`)}
      ${eq(String.raw`0.4^{12} = 0.004096^{2} = 0.000016777216`)}
      ${eq(String.raw`2\cdot 0.4^{12} - 0.4^{6} = 0.000033554432 - 0.004096 = -0.004062445568`)}
      ${eq(String.raw`F(2.5) = \frac{24}{2.5}\cdot(-0.004062445568) = 9.6\cdot(-0.004062445568) = -0.0389994774528`)}
      どちらも有限桁の小数で書ける厳密な値です。force-shifted の力とビリアルは
      ${eq(String.raw`F_{\mathrm{sf}}(1) = 24 + 0.0389994774528 = 24.0389994774528, \qquad W = 1\cdot F_{\mathrm{sf}}(1) = 24.0389994774528`)}
      で、どちらも有限桁の小数で書ける厳密な値です。原子1が受ける力は ${tex(String.raw`-24.0389994774528`)}（${tex('x')} の負の向き、反発）です。`,
    `${tex('V = 1000')} なので
      ${eq(String.raw`P = \frac{2\cdot\tfrac{2}{3}}{1000} + \frac{24.0389994774528}{3\cdot 1000} = \frac{1}{750} + 0.0080129998258176 \approx 0.0093463331591509`)}
      です（近似）。第2項が第1項の約6倍で、近距離の反発が圧力を上げています。上の計器はライブラリがこの配置から計算した値です。`,
    `既定の条件（${tex('N = 108')}、${tex(String.raw`\rho = 0.8`)}、${tex('T_0 = 1.6')}、${tex(String.raw`\Delta t = 0.005`)}、3000 ステップ、${tex(String.raw`n_{\mathrm{eq}} = 400`)}、${tex('b = 200')}）では、残りの 2600 ステップが 13 個のブロックになり、
      ${eq(String.raw`\bar{T} \approx 0.858 \pm 0.003, \qquad \bar{P} \approx 1.47 \pm 0.04`)}
      です（± は標準誤差、どれも種 1 の初期速度による近似）。${tex('g(r)')} の最も高いビンは ${tex(String.raw`r \approx 1.06`)} で ${tex(String.raw`g \approx 2.5`)} です。これは第1近接殻で、${tex(String.raw`r_0 = 2^{1/6} \approx 1.12`)} より少し内側です。${tex(String.raw`r \approx 2`)} 付近に第2近接殻のなだらかなピークがあり、遠くで ${tex('g')} は 1 に近づきます。`,
  ],
  related: [
    { href: './sample-stats.html', title: '標本・平均・分散' },
    { href: './limit-theorems.html', title: '大数の法則と中心極限定理' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
    { href: './nvt.html', title: 'NVT アンサンブルと熱浴法' },
  ],
  footer: 'この画面の計算は、周期境界の立方体セルの中の Lennard–Jones 液体の時間平均です。',
});

const form = formReader(defaults);

lessonFigure('md/observables').then(figure => {
  const v = figure.values;
  for (const [id, value, digits] of [['obs-temperature', v.temperature, 6], ['obs-virial', v.virial, 13], ['obs-ideal', v.ideal, 8], ['obs-pressure', v.pressure, 10]] as const) {
    document.getElementById(id)!.textContent = fixed(value, digits);
  }
}).catch(() => {
  const error = document.getElementById('error')!;
  error.textContent = '2原子の配置の値を計算できません。';
  error.hidden = false;
});

function meanLine(frame: LessonFigure, name: string, end: number): PlotLine[] {
  const mean = frame.values[`mean_${name}`];
  if (mean === undefined) return [];
  return [{ x: [frame.values.equilibration_time, end], y: [mean, mean], role: 'reference' }];
}

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'g-chart', 'temperature-chart', 'pressure-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = JSON.stringify(config);
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
  const hasG = frame.series.some(s => s.name === 'g');
  drawPlot(canvases[1], {
    key: `${key}|g`,
    label: '距離 r に対する動径分布関数。実線は分子動力学の配置から数えた値、灰色の線は g = 1。',
    xMin: 0,
    xMax: l / 2,
    yMin: 0,
    yMax: 3,
    lines: [line(frame, 'ideal'), ...(hasG ? [line(frame, 'g')] : [])],
  });
  drawPlot(canvases[2], {
    key: `${key}|temperature`,
    label: '瞬時温度と時間のグラフ。実線は瞬時温度、点はブロック平均、灰色の線はその平均。',
    xMin: 0,
    xMax: timeEnd,
    yMin: 0,
    lines: [line(frame, 'temperature'), ...meanLine(frame, 't', timeEnd)],
    dots: pointsWith(frame, 'block-t-', 4),
  });
  drawPlot(canvases[3], {
    key: `${key}|pressure`,
    label: '瞬時圧力と時間のグラフ。実線は瞬時圧力、点はブロック平均、灰色の線はその平均。',
    xMin: 0,
    xMax: timeEnd,
    lines: [line(frame, 'pressure'), ...meanLine(frame, 'p', timeEnd)],
    dots: pointsWith(frame, 'block-p-', 4),
    zeroLabel: 'P = 0',
  });
}

mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-observables.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  comparison: state => {
    const v = state.frame?.values;
    const blocks = v?.blocks ?? 0;
    return [
      `平均に使ったステップ数 ${v ? v.collected : '—'}`,
      `g(r) を数えた配置の数 ${v ? v.configurations : '—'}`,
      `ブロックの数 ${blocks}`,
      `温度のブロック平均 T̄ ${blocks >= 2 ? fixed(v?.mean_t, 4) : '—'}`,
      `温度の標準誤差 ${blocks >= 2 ? fixed(v?.se_t, 4) : '—'}`,
      `圧力のブロック平均 P̄ ${blocks >= 2 ? fixed(v?.mean_p, 4) : '—'}`,
      `圧力の標準誤差 ${blocks >= 2 ? fixed(v?.se_p, 4) : '—'}`,
      `g(r) の最も高いビンの r ${fixed(v?.peak_r, 3)}`,
    ].join('\n');
  },
});
