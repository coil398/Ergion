import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'mechanics/two-body',
  mass1: 2,
  mass2: 1,
  gravity: 1,
  periapsis: 1,
  eccentricity: 0.5,
  dt: 0.005,
  steps: 4104,
};

renderLesson({
  id: 'two-body',
  section: { label: '力学', href: './' },
  title: '中心力場と2体問題',
  description: `逆2乗の引力で引き合う二つの質点の運動です。重心の運動と相対運動に分け、相対運動の軌道が円錐曲線 ${tex(String.raw`r = p/(1 + e\cos\theta)`)} になること、動径が掃く面積の速さが一定であることを導きます。`,
  equation: [String.raw`\mu\,\mathbf{r}'' = -\frac{G m_1 m_2}{r^2}\,\hat{\mathbf{r}}`, String.raw`r(\theta) = \frac{p}{1 + e\cos\theta}`],
  equationNote: `${tex(String.raw`\mu = m_1 m_2/(m_1 + m_2)`)}、${tex(String.raw`\mathbf{r} = \mathbf{r}_1 - \mathbf{r}_2`)}、${tex(String.raw`p = h^2/(GM)`)}`,
  studyHeading: '重心と相対座標から軌道の式への手順',
  steps: [
    `記号を定めます。${tex('m_1 > 0')}、${tex('m_2 > 0')} は二つの質点の質量、${tex(String.raw`\mathbf{r}_1(t)`)}、${tex(String.raw`\mathbf{r}_2(t)`)} は平面上の位置、${tex('G > 0')} は重力定数です。相対位置を ${tex(String.raw`\mathbf{r} = \mathbf{r}_1 - \mathbf{r}_2 = (x, y)`)}、距離を ${tex(String.raw`r = |\mathbf{r}|`)}、動径方向の単位ベクトルを ${tex(String.raw`\hat{\mathbf{r}} = \mathbf{r}/r`)} とします。質点2が質点1に及ぼす力は ${tex(String.raw`-G m_1 m_2 \hat{\mathbf{r}}/r^2`)}、その反作用が質点1から質点2への力です。
      ${eq(String.raw`m_1 \mathbf{r}_1'' = -\frac{G m_1 m_2}{r^2}\,\hat{\mathbf{r}}`)}
      ${eq(String.raw`m_2 \mathbf{r}_2'' = +\frac{G m_1 m_2}{r^2}\,\hat{\mathbf{r}}`)}`,
    `全質量を ${tex('M = m_1 + m_2')}、重心を ${tex(String.raw`\mathbf{R} = (m_1\mathbf{r}_1 + m_2\mathbf{r}_2)/M`)} とします。二つの式を足すと右辺が打ち消し合います。
      ${eq(String.raw`m_1 \mathbf{r}_1'' + m_2 \mathbf{r}_2'' = \mathbf{0}`)}
      ${eq(String.raw`M\,\mathbf{R}'' = \mathbf{0}`)}
      ${eq(String.raw`\mathbf{R}(t) = \mathbf{R}(0) + \mathbf{R}'(0)\,t`)}
      重心は等速直線運動をします。これは厳密解です。画面では重心が原点に静止している座標系をとり、${tex(String.raw`\mathbf{R} = \mathbf{0}`)} とします。`,
    `一つめの式を ${tex('m_1')} で、二つめの式を ${tex('m_2')} で割って差をとります。
      ${eq(String.raw`\mathbf{r}'' = \mathbf{r}_1'' - \mathbf{r}_2'' = -\frac{G m_2}{r^2}\hat{\mathbf{r}} - \frac{G m_1}{r^2}\hat{\mathbf{r}} = -\frac{G M}{r^2}\,\hat{\mathbf{r}}`)}
      両辺に換算質量 ${tex(String.raw`\mu = \frac{m_1 m_2}{M}`)} を掛けると
      ${eq(String.raw`\mu\,\mathbf{r}'' = -\frac{G m_1 m_2}{r^2}\,\hat{\mathbf{r}}`)}
      です（${coreDoc('mechanics', 'reduced_mass', '換算質量の説明')}）。2体の問題は、質量 ${tex(String.raw`\mu`)} の一つの質点が固定した中心から力を受ける問題になります。各質点の位置は、${tex(String.raw`\mathbf{R} = \mathbf{0}`)} と ${tex(String.raw`\mathbf{r}`)} の定義を連立して
      ${eq(String.raw`\mathbf{r}_1 = \frac{m_2}{M}\,\mathbf{r},\qquad \mathbf{r}_2 = -\frac{m_1}{M}\,\mathbf{r}`)}
      です。`,
    `単位質量あたりの角運動量を ${tex(String.raw`h = x y' - y x'`)} とします。積の微分で
      ${eq(String.raw`h' = x' y' + x y'' - y' x' - y x'' = x y'' - y x''`)}
      です。運動方程式 ${tex(String.raw`x'' = -GMx/r^3`)}、${tex(String.raw`y'' = -GMy/r^3`)} を代入すると
      ${eq(String.raw`h' = -\frac{GM}{r^3}(x y - y x) = 0`)}
      なので、${tex('h')} は一定です。極座標 ${tex(String.raw`x = r\cos\theta`)}、${tex(String.raw`y = r\sin\theta`)} では
      ${eq(String.raw`x' = r'\cos\theta - r\theta'\sin\theta,\qquad y' = r'\sin\theta + r\theta'\cos\theta`)}
      ${eq(String.raw`h = r\cos\theta\,(r'\sin\theta + r\theta'\cos\theta) - r\sin\theta\,(r'\cos\theta - r\theta'\sin\theta) = r^2\theta'`)}
      です。`,
    `加速度を極座標で分解します。${tex(String.raw`\hat{\boldsymbol{\theta}} = (-\sin\theta, \cos\theta)`)} を角度方向の単位ベクトルとすると、${tex(String.raw`\hat{\mathbf{r}} = (\cos\theta, \sin\theta)`)} を時間で微分して
      ${eq(String.raw`\hat{\mathbf{r}}' = \theta'\,\hat{\boldsymbol{\theta}},\qquad \hat{\boldsymbol{\theta}}' = -\theta'\,\hat{\mathbf{r}}`)}
      です。${tex(String.raw`\mathbf{r} = r\,\hat{\mathbf{r}}`)} を2回微分します。
      ${eq(String.raw`\mathbf{r}' = r'\,\hat{\mathbf{r}} + r\theta'\,\hat{\boldsymbol{\theta}}`)}
      ${eq(String.raw`\mathbf{r}'' = r''\,\hat{\mathbf{r}} + r'\theta'\,\hat{\boldsymbol{\theta}}`)}
      ${eq(String.raw`{} + r'\theta'\,\hat{\boldsymbol{\theta}} + r\theta''\,\hat{\boldsymbol{\theta}} - r\theta'^2\,\hat{\mathbf{r}}`)}
      ${eq(String.raw`= (r'' - r\theta'^2)\,\hat{\mathbf{r}} + (2r'\theta' + r\theta'')\,\hat{\boldsymbol{\theta}}`)}
      ${tex(String.raw`\mathbf{r}'' = -GM\,\hat{\mathbf{r}}/r^2`)} と ${tex(String.raw`\hat{\mathbf{r}}`)} の成分を比べると、動径方向の運動方程式は
      ${eq(String.raw`r'' - r\theta'^2 = -\frac{GM}{r^2}`)}
      です。${tex('u = 1/r')} を ${tex(String.raw`\theta`)} の関数とみて、${tex(String.raw`\theta' = h u^2`)} を使って時間微分を書きかえます。
      ${eq(String.raw`r' = -\frac{1}{u^2}\frac{du}{d\theta}\,\theta' = -h\frac{du}{d\theta}`)}
      ${eq(String.raw`r'' = -h\frac{d^2u}{d\theta^2}\,\theta' = -h^2 u^2\frac{d^2u}{d\theta^2}`)}
      ${eq(String.raw`r\theta'^2 = \frac{1}{u}\,h^2 u^4 = h^2 u^3`)}
      動径方向の運動方程式に代入します。右辺は ${tex(String.raw`-GM/r^2 = -GMu^2`)} です。
      ${eq(String.raw`-h^2 u^2\frac{d^2u}{d\theta^2} - h^2 u^3 = -GM u^2`)}
      両辺を ${tex(String.raw`-h^2u^2`)} で割ると、軌道方程式
      ${eq(String.raw`\frac{d^2u}{d\theta^2} + u = \frac{GM}{h^2}`)}
      を得ます。`,
    `これは定数の右辺をもつ単振動の方程式です。定数 ${tex(String.raw`u = GM/h^2`)} は特殊解で、同次方程式 ${tex(String.raw`u'' + u = 0`)} の一般解は ${tex(String.raw`C\cos(\theta - \theta_0)`)}（${tex(String.raw`C \ge 0`)}、${tex(String.raw`\theta_0`)} は定数）です。和をとると
      ${eq(String.raw`u(\theta) = \frac{GM}{h^2} + C\cos(\theta - \theta_0)`)}
      です。${tex('u')} が最大、すなわち ${tex('r')} が最小になる近点を ${tex(String.raw`\theta = 0`)} にとると ${tex(String.raw`\theta_0 = 0`)} です。${tex(String.raw`e = C h^2/(GM) \ge 0`)} と置いて ${tex(String.raw`GM/h^2`)} をくくり出すと
      ${eq(String.raw`u(\theta) = \frac{GM}{h^2}\left(1 + e\cos\theta\right)`)}
      です。${tex('r = 1/u')} に戻すと、半直弦 ${tex(String.raw`p = h^2/(GM)`)} の円錐曲線
      ${eq(String.raw`r(\theta) = \frac{p}{1 + e\cos\theta}`)}
      です（${coreDoc('mechanics', 'conic_radius', '円錐曲線の説明')}）。${tex('e')} は離心率で、${tex('0 \\le e < 1')} は楕円、${tex('e = 1')} は放物線、${tex('e > 1')} は双曲線です。`,
    `楕円の大きさを求めます。近点距離と遠点距離は ${tex(String.raw`\theta = 0`)}、${tex(String.raw`\theta = \pi`)} として
      ${eq(String.raw`r_p = \frac{p}{1 + e},\qquad r_a = \frac{p}{1 - e}`)}
      です。長半径 ${tex('a')} は二つの距離の平均です。
      ${eq(String.raw`a = \frac{r_p + r_a}{2} = \frac{p}{2}\cdot\frac{(1 - e) + (1 + e)}{(1 + e)(1 - e)}`)}
      ${eq(String.raw`= \frac{p}{1 - e^2}`)}
      短半径 ${tex('b')} は、焦点から近点と遠点までの距離の幾何平均です。
      ${eq(String.raw`b = \sqrt{r_p r_a} = \frac{p}{\sqrt{1 - e^2}} = a\sqrt{1 - e^2}`)}
      近点では速度が動径に垂直なので ${tex('h = r_p v_p')} です。${tex(String.raw`p = h^2/(GM)`)} と ${tex(String.raw`p = r_p(1 + e)`)} から
      ${eq(String.raw`h^2 = GMp = GM r_p(1 + e)`)}
      ${eq(String.raw`v_p^2 = \frac{h^2}{r_p^2} = \frac{GM(1 + e)}{r_p}`)}
      なので、近点の速さは
      ${eq(String.raw`v_p = \sqrt{\frac{GM(1 + e)}{r_p}}`)}
      です（${coreDoc('mechanics', 'kepler_periapsis_speed', '近点の速さの説明')}）。最後の証明の面積速度 ${tex('h/2')} で楕円の面積 ${tex(String.raw`\pi a b`)} を割ると、周期は
      ${eq(String.raw`T = \frac{2\pi a b}{h} = \frac{2\pi a^2\sqrt{1 - e^2}}{\sqrt{GM a(1 - e^2)}} = 2\pi\sqrt{\frac{a^3}{GM}}`)}
      です。`,
    `時刻と位置の対応を求めます。楕円を離心近点角 ${tex('E')} で ${tex(String.raw`x = a(\cos E - e)`)}、${tex(String.raw`y = b\sin E`)} と表すと、中心力の中心（焦点）が原点で、${tex('E = 0')} が近点です。時間で微分すると ${tex(String.raw`x' = -a\sin E\,E'`)}、${tex(String.raw`y' = b\cos E\,E'`)} です。これを ${tex(String.raw`h = x y' - y x'`)} に代入します。
      ${eq(String.raw`h = a(\cos E - e)\cdot b\cos E\,E' + b\sin E\cdot a\sin E\,E'`)}
      ${eq(String.raw`= ab\,(\cos^2 E + \sin^2 E - e\cos E)\,E'`)}
      ${eq(String.raw`= ab\,(1 - e\cos E)\,E'`)}
      時刻 0 に近点 ${tex('E = 0')} から出るとして、0 から ${tex('t')} まで積分します。
      ${eq(String.raw`ab\,(E - e\sin E) = h t`)}
      ${tex(String.raw`n = h/(ab) = 2\pi/T`)} と置くと Kepler の方程式
      ${eq(String.raw`E - e\sin E = n t`)}
      です。この根は Newton 法の反復で、残差が ${tex(String.raw`10^{-15}`)} 未満になるまで求めます（${coreDoc('mechanics', 'kepler_state', 'Kepler の方程式による位置の説明')}）。画面の厳密解の位置は、この根から求めた値です。数値解は、${tex(String.raw`\mathbf{r}' = \mathbf{v}`)}、${tex(String.raw`\mathbf{v}' = -GM\,\mathbf{r}/r^3`)} を選んだ方法で1ステップずつ進めた近似で、${tex('h')} が一定に保たれるかどうかで方法の違いが分かります。`,
  ],
  figureAlt: '質量 2 と 1 の2質点が共通の重心のまわりを楕円で公転し、同じ時間に掃く扇形の面積が等しい図。',
  figure: experimentPanel({
    fieldsetLabel: '2質点と軌道',
    fields: [
      { name: 'mass1', label: '質点1の質量', symbol: 'm_1', value: 2, min: 0 },
      { name: 'mass2', label: '質点2の質量', symbol: 'm_2', value: 1, min: 0 },
      { name: 'gravity', label: '重力定数', symbol: 'G', value: 1, min: 0 },
      { name: 'periapsis', label: '近点距離', symbol: 'r_p', value: 1, min: 0 },
      { name: 'eccentricity', label: '離心率', symbol: 'e', value: 0.5, min: 0, max: 0.94 },
    ],
    dt: 0.005,
    steps: 4104,
    sceneHeading: '重心のまわりを回る2質点',
    sceneCaption: '塗った扇形は、質点1の動径が直前の40ステップに掃いた領域です。実線は数値解の軌跡、青緑の破線は厳密解の楕円、破線の輪は同じ時刻の質点1の厳密解の位置、中央の点は重心です。',
    sceneLabel: '共通の重心のまわりを公転する2質点',
    sceneHeight: 320,
    readouts: { position: '相対位置 x', velocity: '角運動量 h（数値解）', exact: '厳密解の相対位置 x', error: '相対位置の差 x − x_exact' },
    plotsHeading: '角運動量と相対位置の時間変化',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>角運動量の時間変化 ${tex('h(t)')}</h3><canvas id="momentum-chart" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>相対位置の時間変化 ${tex('x(t)')}</h3><canvas id="position-chart" role="img"></canvas><p>時間 t</p></div></div>`,
    code: codeDisclosure('two-body'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('G = 1')}、${tex('m_1 = 2')}、${tex('m_2 = 1')} とします。全質量と換算質量は
      ${eq(String.raw`M = 2 + 1 = 3,\qquad GM = 3,\qquad \mu = \frac{2\cdot 1}{3} = \frac{2}{3}`)}
      で、どれも厳密な値です。各質点の位置は ${tex(String.raw`\mathbf{r}_1 = \mathbf{r}/3`)}、${tex(String.raw`\mathbf{r}_2 = -2\mathbf{r}/3`)} で、重い質点1は重心の近くを小さく回ります。`,
    `近点距離 ${tex('r_p = 1')}、離心率 ${tex('e = 0.5')} とします。近点の速さ、角運動量、半直弦は
      ${eq(String.raw`v_p = \sqrt{\frac{3\cdot(1 + 0.5)}{1}} = \sqrt{4.5},\qquad h = 1\cdot\sqrt{4.5} = \sqrt{4.5},\qquad p = \frac{4.5}{3} = 1.5`)}
      です。${tex(String.raw`\sqrt{4.5} \approx 2.12132`)} は小数5桁の近似です。確かに ${tex(String.raw`p = r_p(1 + e) = 1\cdot 1.5`)} です。`,
    `遠点距離、長半径、短半径、周期は
      ${eq(String.raw`r_a = \frac{1.5}{1 - 0.5} = 3,\qquad a = \frac{1 + 3}{2} = 2,\qquad b = 2\sqrt{1 - 0.25} = \sqrt{3}`)}
      ${eq(String.raw`T = 2\pi\sqrt{\frac{2^3}{3}} = 2\pi\sqrt{8/3} \approx 10.26040`)}
      です。根号の形が厳密な値で、小数は近似です。既定の条件 ${tex(String.raw`\Delta t = 0.005`)}、4104 ステップの終端は ${tex(String.raw`t = 4104 \cdot 0.005 = 20.52`)}（厳密）で、${tex(String.raw`2T \approx 20.5208`)} とほぼ等しく、約2周期です。`,
    `相対運動のエネルギーは ${tex(String.raw`E = \mu\left(\frac{v_p^2}{2} - \frac{GM}{r_p}\right) = \frac{2}{3}\left(\frac{4.5}{2} - 3\right) = -\frac{1}{2}`)} で、厳密です。古典的RK4 の数値解では、計器の角運動量 ${tex('h')} は計算の終わりまで ${tex('2.12132')}（近似）のままです。Euler 法では1周ごとに ${tex('h')} とエネルギーが増え、軌跡は楕円の外へ広がります。`,
  ],
  related: [
    { href: './noether.html', title: '対称性と保存則' },
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
    { href: './lennard-jones.html', title: 'Lennard–Jones ポテンシャル' },
    { href: './newton.html', title: 'ニュートン法' },
  ],
  footer: 'この画面の計算は、逆2乗の引力で引き合う2質点の平面運動です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`\mathbf{r}'' = -GM\,\mathbf{r}/r^3`)} の解で ${tex(String.raw`h = x y' - y x' > 0`)} とします。動径 ${tex(String.raw`\mathbf{r}`)} が時刻 0 から ${tex('t')} までに掃く面積を ${tex('A(t)')} とすると、${tex(String.raw`\frac{dA}{dt} = \frac{h}{2}`)} は一定です（面積速度一定の法則）。`,
    proof: [
      `手順4と同じ計算で、${tex(String.raw`h' = x y'' - y x'' = -\frac{GM}{r^3}(xy - yx) = 0`)} なので、${tex('h')} は時刻によらない定数です。`,
      `${tex(String.raw`\mathbf{r} \neq \mathbf{0}`)} なので、連続な偏角 ${tex(String.raw`\theta(t)`)} をとって ${tex(String.raw`x = r\cos\theta`)}、${tex(String.raw`y = r\sin\theta`)} と書けます。手順4の計算から ${tex(String.raw`h = r^2\theta'`)}、すなわち ${tex(String.raw`\theta' = h/r^2 > 0`)} です。${tex(String.raw`\theta`)} は狭義単調増加なので、その逆関数を用いて距離を偏角の関数 ${tex(String.raw`r = \rho(\theta)`)} として表せます。`,
      `極座標の面積の公式により、動径が偏角 ${tex(String.raw`\theta(0)`)} から ${tex(String.raw`\theta(t)`)} まで回るあいだに掃く面積は
        ${eq(String.raw`A(t) = \frac{1}{2}\int_{\theta(0)}^{\theta(t)} \rho(\varphi)^2\, d\varphi`)}
        です。`,
      `微分積分学の基本定理と合成関数の微分により
        ${eq(String.raw`\frac{dA}{dt} = \frac{1}{2}\rho(\theta(t))^2\,\theta'(t) = \frac{1}{2} r^2\theta' = \frac{h}{2}`)}
        です。右辺は定数なので、${tex(String.raw`t_1 < t_2`)} に対して ${tex(String.raw`A(t_2) - A(t_1) = \frac{h}{2}(t_2 - t_1)`)} です。同じ長さの時間に動径が掃く面積は等しくなります。`,
    ],
  }]),
});

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'momentum-chart', 'position-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawPlot(canvases[0], {
    key: `${key}|orbit`,
    label: '重心のまわりの2質点の軌道。実線は数値解の軌跡、破線は厳密解の楕円、塗った領域は動径が掃いた扇形。',
    equalAspect: true,
    polygons: frame.polygons.map(p => ({ x: p.x, y: p.y })),
    lines: [line(frame, 'orbit1'), line(frame, 'orbit2'), line(frame, 'trail1'), line(frame, 'trail2')],
    dots: [
      dot(frame, 'center', undefined),
      dot(frame, 'exact1', undefined, true),
      { ...dot(frame, 'body1', 'm₁'), radius: 6 },
      { ...dot(frame, 'body2', 'm₂'), radius: 5 },
    ],
  });
  const momentum = points.map(p => p.velocity);
  const exactMomentum = points.map(p => p.exact_velocity);
  const all = [...momentum, ...exactMomentum];
  const lo = all.reduce((a, b) => Math.min(a, b), Infinity);
  const hi = all.reduce((a, b) => Math.max(a, b), -Infinity);
  const narrow = hi - lo < 1e-2 * Math.abs(state.exact_velocity);
  drawPlot(canvases[1], {
    key: narrow ? undefined : `${key}|momentum`,
    label: '角運動量と時間のグラフ。実線は数値解、破線は厳密解の一定値。',
    xMin: 0,
    xMax: timeEnd,
    ...(narrow ? { yMin: state.exact_velocity * 0.99, yMax: state.exact_velocity * 1.01 } : {}),
    lines: [
      { x: points.map(p => p.time), y: exactMomentum, role: 'exact' },
      { x: points.map(p => p.time), y: momentum, role: 'numerical' },
    ],
    dots: [{ x: state.time, y: state.velocity, role: 'numerical' }],
  });
  drawPlot(canvases[2], {
    key: `${key}|position`,
    label: '相対位置の x 成分と時間のグラフ。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'x = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-two-body.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => `厳密な角運動量 h ${state.exact_velocity.toFixed(6)}\n数値解のエネルギー ${state.frame?.values.energy.toFixed(6) ?? '—'}\n相対距離 r ${state.frame?.values.separation.toFixed(6) ?? '—'}`,
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
