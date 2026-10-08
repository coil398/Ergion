import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed, linesWith, pointsWith } from './figures/statistics';
import { eq, experimentPanel, formReader, lessonFigure, line, renderLesson, writtenProof } from './lesson';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'md/periodic',
  box_length: 10,
  particles: 6,
  speed: 2,
  seed: 1,
  dt: 0.02,
  steps: 1000,
};

renderLesson({
  id: 'periodic',
  section: { label: '分子動力学' },
  title: '周期境界条件と最小イメージ法',
  description: `一辺 ${tex('L')} の立方体セルを全空間に周期的に並べ、少ない粒子で表面のない物質を表します。セルを出た粒子の座標を折り返す式と、2粒子の鏡像のうち最も近いものとの相対ベクトルを求める最小イメージ法を導きます。エネルギー、長さ、質量の単位を ${tex(String.raw`\varepsilon`)}、${tex(String.raw`\sigma`)}、${tex('m')} にとり、${tex(String.raw`\varepsilon = \sigma = m = k_B = 1`)} とします。`,
  equation: [
    String.raw`x \gets x - L\left\lfloor \frac{x}{L} \right\rfloor`,
    String.raw`\mathbf{r}_{ij} \gets \mathbf{r}_{ij} - L\,\mathrm{round}\!\left(\frac{\mathbf{r}_{ij}}{L}\right)`,
  ],
  equationLabel: 'x を、x 引く L 掛ける x 割る L の床関数、で置き換える。相対ベクトル r i j を、r i j 引く L 掛ける r i j 割る L を最も近い整数に丸めたもの、で置き換える。',
  equationNote: `${tex(String.raw`\lfloor\cdot\rfloor`)} は床関数、${tex(String.raw`\mathrm{round}`)} は最も近い整数への丸めで、ベクトルには成分ごとに使う`,
  studyHeading: '座標の折り返しと最小イメージの手順',
  steps: [
    `記号を定めます。基本セルは一辺 ${tex('L')} の立方体 ${tex('[0, L)^3')}、粒子 ${tex('i')} の位置は ${tex(String.raw`\mathbf{r}_i`)} です。周期境界条件では、整数ベクトル ${tex(String.raw`\mathbf{n} \in \mathbb{Z}^3`)} ごとに鏡像 ${tex(String.raw`\mathbf{r}_i + L\mathbf{n}`)} が置かれ、全空間がセルの写しで埋まります。基本セルを囲む写しは ${tex(String.raw`3^3 - 1 = 26`)} 個です。どのセルの粒子も同じ動きをするので、表面はありません。`,
    `粒子がセルの面を越えたら、${tex('L')} の整数倍だけ戻します。${tex(String.raw`k = \lfloor x/L \rfloor`)} とおくと、床関数の定義から
      ${eq(String.raw`k \le \frac{x}{L} < k + 1`)}
      ${eq(String.raw`0 \le \frac{x}{L} - k < 1`)}
      ${eq(String.raw`0 \le x - kL < L`)}
      なので、${tex(String.raw`x - L\lfloor x/L \rfloor`)} は必ず ${tex('[0, L)')} に入ります。各成分に同じ式を使います（${coreDoc('molecular', 'wrap_position', '座標の折り返しの説明')}）。`,
    `折り返しで速度は変えません。面 ${tex('x = L')} から出た粒子と、面 ${tex('x = 0')} から入ってくる隣のセルの鏡像は同じ速度で動いているので、出た粒子を鏡像に置き換えても運動は変わりません。`,
    `2粒子の相対ベクトルを ${tex(String.raw`\mathbf{d} = \mathbf{r}_j - \mathbf{r}_i`)} とします。粒子 ${tex('j')} の鏡像との相対ベクトルは ${tex(String.raw`\mathbf{d} + L\mathbf{n}`)} で、長さの2乗は成分ごとの和
      ${eq(String.raw`|\mathbf{d} + L\mathbf{n}|^2 = (d_x + L n_x)^2 + (d_y + L n_y)^2 + (d_z + L n_z)^2`)}
      です。各項は別々の整数 ${tex('n_x')}、${tex('n_y')}、${tex('n_z')} だけで決まるので、成分ごとに最小にすれば全体も最小です。`,
    `1成分 ${tex('d')} について、${tex(String.raw`q = \mathrm{round}(d/L)`)} とおくと ${tex(String.raw`|d/L - q| \le 1/2`)} です。両辺に ${tex('L')} を掛けて
      ${eq(String.raw`|d - qL| \le \frac{L}{2}`)}
      です。${tex('n = -q')} のとき ${tex('|d + nL|')} が最小になることを、最後の証明で示します。よって最も近い鏡像との相対ベクトルは
      ${eq(String.raw`\mathbf{r}_{ij} = \mathbf{d} - L\,\mathrm{round}\!\left(\frac{\mathbf{d}}{L}\right)`)}
      で、各成分は ${tex('[-L/2, L/2]')} に入ります（${coreDoc('molecular', 'minimum_image', '最小イメージの説明')}）。距離は ${tex(String.raw`r_{ij} \le \sqrt{3}\,L/2`)} です。`,
    `相互作用をカットオフ距離 ${tex('r_c')} で打ち切るときは ${tex(String.raw`r_c < L/2`)} とします。粒子 ${tex('j')} の異なる2つの鏡像は少なくとも ${tex('L')} 離れているので、両方が粒子 ${tex('i')} から ${tex('r_c')} 以内にあると三角不等式から ${tex(String.raw`L \le 2r_c`)} となり矛盾します。よって力に寄与する鏡像は最小イメージの一つだけです。${tex('N')} 粒子のペアは ${tex(String.raw`N(N - 1)/2`)} 組で、それぞれに最小イメージを使います。`,
  ],
  figureAlt: '中央の立方体セルとそれを囲む鏡像セル。セルの面を出た粒子が、向かい合う面から同じ速度で入り直す図。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="hand-heading">
        <div class="panel-heading"><h2 id="hand-heading">折り返しと最小イメージの値（L = 10）</h2></div>
        <div class="readouts">
          <div><span>x = 12.3 の折り返し</span><output id="pbc-wrap-a">—</output></div>
          <div><span>x = −0.4 の折り返し</span><output id="pbc-wrap-b">—</output></div>
          <div><span>最小イメージ距離 r_ij</span><output id="pbc-distance">—</output></div>
          <div><span>27個の鏡像の最小距離</span><output id="pbc-brute">—</output></div>
        </div>
      </section>
      ${experimentPanel({
        fieldsetLabel: 'セルと粒子',
        fields: [
          { name: 'box_length', label: 'セルの一辺', symbol: 'L', value: 10, min: 0, max: 1000 },
          { name: 'particles', label: '粒子の数', symbol: 'N', value: 6, min: 2, max: 20, step: '1' },
          { name: 'speed', label: '速さの目安', symbol: 'v', value: 2, min: 0 },
          { name: 'seed', label: '擬似乱数の種', value: 1, min: 0, step: '1' },
        ],
        dt: 0.02,
        steps: 1000,
        sceneHeading: '基本セルと鏡像セル（xy 平面への投影）',
        sceneCaption: '中央の太い枠が基本セル、周りの8つが鏡像セルです（3次元では26個）。青の点はセル内の粒子、灰色の点はその鏡像です。粒子は力を受けずに等速で進み、面を出ると反対の面から同じ速度で入り直します。青緑の破線は粒子1から他の各粒子の最も近い鏡像への最小イメージの相対ベクトルです。',
        sceneLabel: '基本セルと鏡像セルの中を動く粒子',
        sceneHeight: 360,
        readouts: { position: '最小イメージ距離 r₁₂', velocity: '粒子2の x（折り返し後）', exact: '27個の鏡像の最小距離', error: '差' },
        plotsHeading: '距離と座標の時間変化',
        legend: '<span><i class="numerical"></i>周期境界の値</span><span><i class="analytical"></i>最小イメージ</span>',
        plots: `<div class="plot-grid"><div class="plot-main"><h3>粒子1と2の距離 ${tex('r_{12}(t)')}</h3><canvas id="distance-chart" role="img"></canvas><p>時間 t。実線は最小イメージ距離、灰色の線は折り返さない座標の距離</p></div><div class="plot-phase"><h3>粒子2の座標 ${tex('x_2(t)')}</h3><canvas id="coordinate-chart" role="img"></canvas><p>時間 t。実線は折り返した座標、灰色の線は折り返さない座標</p></div></div>`,
      })}`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('L = 10')} とします。${tex('x = 12.3')} は ${tex(String.raw`\lfloor 1.23 \rfloor = 1`)} なので ${tex(String.raw`12.3 - 10 = 2.3`)}、${tex('x = -0.4')} は ${tex(String.raw`\lfloor -0.04 \rfloor = -1`)} なので ${tex(String.raw`-0.4 + 10 = 9.6`)} です。床関数は負の数で 0 ではなく −1 になることに注意します。どちらも厳密です。`,
    `${tex(String.raw`\mathbf{r}_i = (1, 9, 5)`)}、${tex(String.raw`\mathbf{r}_j = (9, 1, 5)`)} とします。セルの中での差は
      ${eq(String.raw`\mathbf{d} = (8, -8, 0), \qquad |\mathbf{d}| = \sqrt{128} = 8\sqrt{2} \approx 11.313708`)}
      です。${tex(String.raw`\mathrm{round}(0.8) = 1`)}、${tex(String.raw`\mathrm{round}(-0.8) = -1`)}、${tex(String.raw`\mathrm{round}(0) = 0`)} なので
      ${eq(String.raw`\mathbf{r}_{ij} = (8 - 10,\ -8 + 10,\ 0) = (-2, 2, 0), \qquad r_{ij} = \sqrt{8} = 2\sqrt{2} \approx 2.828427`)}
      です。根号の形が厳密で、小数は近似です。27個の鏡像をすべて調べた最小距離も同じ値で、上の計器に出ます。この2粒子はセルの角をはさんで隣り合っています。`,
    `既定の条件（${tex('L = 10')}、${tex('N = 6')}、種 1）では ${tex(String.raw`6 \cdot 5/2 = 15`)} 組のペアがあり、再生中のどの時刻でも最小イメージ距離は ${tex(String.raw`\sqrt{3}\cdot 10/2 \approx 8.660254`)} を超えません。計器の「差」は最小イメージ距離と27個の鏡像の最小距離の差で、どの時刻でも 0 です。`,
  ],
  related: [
    { href: './lennard-jones.html', title: 'Lennard–Jones ポテンシャル' },
    { href: './neighbor-list.html', title: '近接リスト法とセル分割法' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
  ],
  footer: 'この画面の計算は、周期境界の立方体セルの中を等速で進む粒子です。',
  proof: writtenProof([{
    statement: `${tex('L > 0')}、実数 ${tex('d')}、${tex(String.raw`q = \mathrm{round}(d/L)`)} とします。すべての整数 ${tex('n')} について ${tex(String.raw`|d - qL| \le |d + nL|`)} です。さらに ${tex(String.raw`r_c < L/2`)} なら、${tex(String.raw`|\mathbf{d} + L\mathbf{n}| < r_c`)} を満たす整数ベクトル ${tex(String.raw`\mathbf{n}`)} は高々一つです。`,
    proof: [
      `${tex('e = d - qL')} とおくと、丸めの定義から ${tex(String.raw`|e| \le L/2`)} です。任意の整数 ${tex('n')} に対し ${tex('m = n + q')} も整数で、${tex('d + nL = e + mL')} です。`,
      `${tex('m = 0')} なら ${tex('|e + mL| = |e|')} です。${tex(String.raw`m \ne 0`)} なら ${tex(String.raw`|m| \ge 1`)} なので、三角不等式から
        ${eq(String.raw`|e + mL| \ge |m|L - |e| \ge L - \frac{L}{2} = \frac{L}{2} \ge |e|`)}
        です。よって ${tex(String.raw`|d - qL| = |e| \le |d + nL|`)} です。`,
      `2つの整数ベクトル ${tex(String.raw`\mathbf{n} \ne \mathbf{n}'`)} がともに条件を満たすとすると、三角不等式から
        ${eq(String.raw`L \le L|\mathbf{n} - \mathbf{n}'| = |(\mathbf{d} + L\mathbf{n}) - (\mathbf{d} + L\mathbf{n}')| < 2r_c < L`)}
        となり矛盾します。最初の不等号は、0 でない整数ベクトルの長さが 1 以上であることによります。`,
    ],
  }]),
});

const form = formReader(defaults);

lessonFigure('md/periodic').then(figure => {
  const v = figure.values;
  for (const [id, value] of [['pbc-wrap-a', v.wrap_a], ['pbc-wrap-b', v.wrap_b], ['pbc-distance', v.distance], ['pbc-brute', v.brute]] as const) {
    document.getElementById(id)!.textContent = fixed(value);
  }
}).catch(() => {
  const error = document.getElementById('error')!;
  error.textContent = '折り返しの値を計算できません。';
  error.hidden = false;
});

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'distance-chart', 'coordinate-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const l = Number(config.box_length);
  const key = JSON.stringify(config);
  const timeEnd = config.steps * config.dt;
  const particles = pointsWith(frame, 'p', 5);
  drawPlot(canvases[0], {
    label: '基本セルと8つの鏡像セルの中の粒子。青の点はセル内の粒子、灰色の点は鏡像、破線は最小イメージの相対ベクトル。',
    lines: [...linesWith(frame, 'vertical'), ...linesWith(frame, 'horizontal'), ...linesWith(frame, 'link')],
    dots: [...pointsWith(frame, 'image', 3), ...particles.map((p, i) => i < 2 ? { ...p, label: `${i + 1}` } : p)],
    equalAspect: true,
    xMin: -l,
    xMax: 2 * l,
    yMin: -l,
    yMax: 2 * l,
    pad: 0,
  });
  drawPlot(canvases[1], {
    key: `${key}|distance`,
    label: '粒子1と2の距離と時間のグラフ。実線は最小イメージ距離、灰色の線は折り返さない座標の距離。',
    xMin: 0,
    xMax: timeEnd,
    yMin: 0,
    lines: [line(frame, 'unwrapped-distance'), line(frame, 'minimum-image')],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
  });
  drawPlot(canvases[2], {
    key: `${key}|coordinate`,
    label: '粒子2の x 座標と時間のグラフ。実線は折り返した座標、灰色の線は折り返さない座標。',
    xMin: 0,
    xMax: timeEnd,
    lines: [line(frame, 'x-unwrapped'), line(frame, 'x-wrapped')],
    dots: [{ x: state.time, y: state.velocity, role: 'numerical' }],
  });
}

mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-periodic.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `ペアの数 ${v ? v.pairs : '—'}`,
      `最小イメージ距離の最大値 ${fixed(v?.largest)}`,
      `粒子1と2の最小イメージ距離 r₁₂ ${fixed(state.position)}`,
      `27個の鏡像の最小距離 ${fixed(state.exact_position)}`,
    ].join('\n');
  },
});
