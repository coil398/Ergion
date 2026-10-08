import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot, drawSpringMass } from './figures';
import { eq, experimentPanel, formReader, lessonFigure, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, LessonFigure, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'mechanics/damped',
  mass: 1,
  spring_constant: 4,
  damping: 0.4,
  initial_position: 1,
  initial_velocity: 0,
  dt: 0.01,
  steps: 1500,
};

renderLesson({
  id: 'damped',
  section: { label: '力学', href: './' },
  title: '減衰振動',
  description: `ばねの復元力 ${tex('-kx')} に加えて、速度に比例する抵抗力 ${tex(`-\\gamma x'`)} を受ける質点の運動です。特性方程式の根から三つの減衰の場合を導き、力学的エネルギーが ${tex(String.raw`dE/dt = -\gamma v^2`)} で減ることを確かめます。`,
  equation: [String.raw`m x'' + \gamma x' + k x = 0`, String.raw`x(t) = e^{-\beta t}\left[x_0\cos\omega_d t + \frac{v_0 + \beta x_0}{\omega_d}\sin\omega_d t\right]`],
  equationLabel: '減衰振動の運動方程式。m x の2階微分、足す γ x の1階微分、足す k x は 0。',
  equationNote: `${tex(String.raw`\beta = \gamma/(2m)`)}、${tex(String.raw`\omega_d = \sqrt{k/m - \beta^2}`)}`,
  studyHeading: '特性方程式から厳密解への手順',
  steps: [
    `記号を定めます。${tex('m > 0')} は質量、${tex('k > 0')} はばね定数、${tex(String.raw`\gamma \ge 0`)} は減衰係数、${tex('x(t)')} は時刻 ${tex('t')} における原点からの変位、${tex(`v = x'`)} は速度です。初期条件は ${tex('x(0) = x_0')}、${tex(`x'(0) = v_0`)} とします。質点には、ばねの力 ${tex('-kx')} と、速度に比例する粘性抵抗力 ${tex(`-\\gamma x'`)} が働きます。`,
    `Newton の運動方程式 ${tex(`m x'' = F`)} に二つの力の和を代入し、左辺に移項します。
      ${eq(String.raw`m x'' = -k x - \gamma x'`)}
      ${eq(String.raw`m x'' + \gamma x' + k x = 0`)}
      両辺を ${tex('m')} で割ります。
      ${eq(String.raw`x'' + \frac{\gamma}{m} x' + \frac{k}{m} x = 0`)}
      ${tex(String.raw`\beta = \frac{\gamma}{2m}`)}、${tex(String.raw`\omega_0 = \sqrt{k/m}`)} と置くと
      ${eq(String.raw`x'' + 2\beta x' + \omega_0^2 x = 0`)}
      です。${tex(String.raw`\omega_0`)} は抵抗がないときの固有角振動数、${tex(String.raw`\zeta = \frac{\beta}{\omega_0} = \frac{\gamma}{2\sqrt{mk}}`)} は減衰比です。`,
    `${tex('x = e^{rt}')} と置いて代入します。${tex(`x' = r e^{rt}`)}、${tex(`x'' = r^2 e^{rt}`)} なので
      ${eq(String.raw`r^2 e^{rt} + 2\beta r e^{rt} + \omega_0^2 e^{rt} = 0`)}
      ${tex(String.raw`e^{rt} \neq 0`)} で割ると、特性方程式は
      ${eq(String.raw`r^2 + 2\beta r + \omega_0^2 = 0`)}
      です。解の公式から
      ${eq(String.raw`r = \frac{-2\beta \pm \sqrt{4\beta^2 - 4\omega_0^2}}{2} = -\beta \pm \sqrt{\beta^2 - \omega_0^2}`)}
      です。根号の中の符号で、解の形が三つに分かれます。`,
    `不足減衰 ${tex(String.raw`\zeta < 1`)}（${tex(String.raw`\beta < \omega_0`)}）では根号の中が負です。${tex(String.raw`\omega_d = \sqrt{\omega_0^2 - \beta^2}`)} と置くと
      ${eq(String.raw`r = -\beta \pm i\omega_d`)}
      です。Euler の公式から ${tex(String.raw`e^{(-\beta \pm i\omega_d)t} = e^{-\beta t}(\cos\omega_d t \pm i\sin\omega_d t)`)} なので、実数の一般解は任意定数 ${tex('A')}、${tex('B')} を用いて
      ${eq(String.raw`x(t) = e^{-\beta t}\left(A\cos\omega_d t + B\sin\omega_d t\right)`)}
      です。臨界減衰 ${tex(String.raw`\zeta = 1`)} では重根 ${tex(String.raw`r = -\beta`)} で、一般解は
      ${eq(String.raw`x(t) = (A + Bt)\,e^{-\beta t}`)}
      です。過減衰 ${tex(String.raw`\zeta > 1`)} では ${tex(String.raw`s = \sqrt{\beta^2 - \omega_0^2}`)}、${tex(String.raw`r_\pm = -\beta \pm s`)} が二つの実根で、
      ${eq(String.raw`x(t) = C_+ e^{r_+ t} + C_- e^{r_- t}`)}
      です。${tex(String.raw`s < \beta`)} なので両方の根は負で、質点は振動せずに原点へ近づきます。`,
    `不足減衰の定数を初期条件から決めます。${tex('t = 0')} では ${tex(String.raw`e^0 = 1`)}、${tex(String.raw`\cos 0 = 1`)}、${tex(String.raw`\sin 0 = 0`)} なので
      ${eq(String.raw`x(0) = A = x_0`)}
      です。積の微分で速度を求めます。
      ${eq(String.raw`x'(t) = -\beta e^{-\beta t}\left(A\cos\omega_d t + B\sin\omega_d t\right) + e^{-\beta t}\left(-A\omega_d\sin\omega_d t + B\omega_d\cos\omega_d t\right)`)}
      ${eq(String.raw`x'(t) = e^{-\beta t}\left[(B\omega_d - \beta A)\cos\omega_d t - (A\omega_d + \beta B)\sin\omega_d t\right]`)}
      ${tex('t = 0')} を代入します。
      ${eq(String.raw`x'(0) = B\omega_d - \beta A = v_0`)}
      ${eq(String.raw`B = \frac{v_0 + \beta x_0}{\omega_d}`)}
      したがって厳密解は
      ${eq(String.raw`x(t) = e^{-\beta t}\left[x_0\cos\omega_d t + \frac{v_0 + \beta x_0}{\omega_d}\sin\omega_d t\right]`)}
      です（${coreDoc('mechanics', 'damped_state', '三つの場合の厳密解の説明')}）。`,
    `振れ幅の包絡線を求めます。${tex(String.raw`C = \sqrt{A^2 + B^2}`)}、${tex(String.raw`\cos\varphi = A/C`)}、${tex(String.raw`\sin\varphi = B/C`)} と置くと、加法定理から
      ${eq(String.raw`A\cos\omega_d t + B\sin\omega_d t = C\cos(\omega_d t - \varphi)`)}
      です。${tex(String.raw`|\cos(\omega_d t - \varphi)| \le 1`)} なので
      ${eq(String.raw`-C e^{-\beta t} \le x(t) \le C e^{-\beta t}`)}
      です（${coreDoc('mechanics', 'damped_envelope', '包絡線の説明')}）。下の位置のグラフの細い破線が ${tex(String.raw`\pm C e^{-\beta t}`)} です。`,
    `力学的エネルギーを ${tex(String.raw`E = \frac{1}{2} m v^2 + \frac{1}{2} k x^2`)} と定めます。最後の証明で示すとおり、運動方程式の解では
      ${eq(String.raw`\frac{dE}{dt} = -\gamma v^2 \le 0`)}
      で、抵抗力がした負の仕事の分だけ ${tex('E')} が減ります。数値解は、${tex(`x' = v`)}、${tex(String.raw`v' = -(\gamma v + k x)/m`)} を選んだ方法で1ステップずつ進めた近似です。既定の条件では、Euler 法の振れ幅は厳密解よりゆっくり縮み、数値解のエネルギーは厳密な値より大きくなります。`,
  ],
  figureAlt: '減衰振動の位置の時間変化が包絡線のあいだで縮み、位相図で原点へ巻き込む図。',
  figure: experimentPanel({
    fieldsetLabel: 'ばね、抵抗、質点',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'spring_constant', label: 'ばね定数', symbol: 'k', value: 4, min: 0 },
      { name: 'damping', label: '減衰係数', symbol: String.raw`\gamma`, value: 0.4, min: 0 },
      { name: 'initial_position', label: '初期位置', symbol: 'x_0', value: 1 },
      { name: 'initial_velocity', label: '初期速度', symbol: 'v_0', value: 0 },
    ],
    dt: 0.01,
    steps: 1500,
    sceneHeading: '抵抗を受けてばねにつながれた質点',
    sceneCaption: '質点は数値解の位置にあります。青緑の破線の輪は同じ時刻の厳密解の位置、橙の矢印は速度の向きです。',
    sceneLabel: '抵抗を受けながら往復する、ばねにつながれた質点',
    readouts: { position: '位置 x', velocity: '速度 v', exact: '厳密解の位置', error: '位置の差 x − x_exact' },
    plotsHeading: '位置の時間変化と位相図',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t（細い破線は包絡線 ${tex(String.raw`\pm C e^{-\beta t}`)}）</p></div><div class="plot-phase"><h3>位置と速度の位相図</h3><canvas id="phase-chart" role="img"></canvas><p>位置 x（縦軸は速度 v）</p></div></div>`,
    code: codeDisclosure('euler'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 1')}、${tex('k = 4')}、${tex(String.raw`\gamma = 0.4`)}、${tex('x_0 = 1')}、${tex('v_0 = 0')} とします。定数は
      ${eq(String.raw`\beta = \frac{0.4}{2\cdot 1} = 0.2,\qquad \omega_0 = \sqrt{4/1} = 2,\qquad \zeta = \frac{0.2}{2} = 0.1`)}
      で、${tex(String.raw`\zeta < 1`)} なので不足減衰です。減衰固有角振動数は
      ${eq(String.raw`\omega_d = \sqrt{4 - 0.2^2} = \sqrt{3.96} \approx 1.98997`)}
      です。${tex(String.raw`\sqrt{3.96}`)} が厳密な値で、${tex('1.98997')} は小数5桁の近似です。`,
    `係数は ${tex('A = 1')}、${tex(String.raw`B = \frac{0 + 0.2\cdot 1}{\sqrt{3.96}} = \frac{0.2}{\sqrt{3.96}}`)} なので、厳密解は
      ${eq(String.raw`x(t) = e^{-0.2t}\left[\cos\sqrt{3.96}\,t + \frac{0.2}{\sqrt{3.96}}\sin\sqrt{3.96}\,t\right]`)}
      です。包絡線の振幅は ${tex(String.raw`C = \sqrt{1 + 0.04/3.96} = \sqrt{4/3.96} = 2/\sqrt{3.96} \approx 1.00504`)} です。`,
    `半周期 ${tex(String.raw`t = \pi/\omega_d`)} では ${tex(String.raw`\cos\pi = -1`)}、${tex(String.raw`\sin\pi = 0`)} なので
      ${eq(String.raw`x\!\left(\frac{\pi}{\omega_d}\right) = -e^{-0.2\pi/\sqrt{3.96}}`)}
      が厳密な値です。指数は ${tex(String.raw`0.2\pi/\sqrt{3.96} \approx 0.315742`)} で、
      ${eq(String.raw`x\!\left(\frac{\pi}{\omega_d}\right) \approx -0.72925`)}
      は小数5桁の近似です。速度の式の ${tex(String.raw`\cos`)} の係数は ${tex(String.raw`B\omega_d - \beta A = 0.2 - 0.2 = 0`)}、${tex(String.raw`\sin\pi = 0`)} なので、この時刻の速度は厳密に 0 です。`,
    `エネルギーは、${tex('t = 0')} で ${tex(String.raw`E = \frac{1}{2}\cdot 4\cdot 1^2 = 2`)}（厳密）、半周期で
      ${eq(String.raw`E = \frac{1}{2}\cdot 4\cdot e^{-0.4\pi/\sqrt{3.96}} = 2e^{-0.4\pi/\sqrt{3.96}} \approx 1.06360`)}
      です。半周期のあいだに抵抗が散逸させたエネルギーは ${tex(String.raw`2 - 2e^{-0.4\pi/\sqrt{3.96}} \approx 0.93640`)}（近似）です。時間刻みを ${tex(String.raw`\Delta t = \pi/(100\sqrt{3.96})`)} とし 100 ステップ進めると、画面の厳密解の位置と計器の下のエネルギーにこの値が出ます。`,
  ],
  related: [
    { href: './harmonic.html', title: '単振動', description: '抵抗のない場合 γ = 0 の振動です。' },
    { href: './second-order.html', title: '定数係数の2階同次', description: '同じ特性方程式の根から一般解を作ります。' },
    { href: './forced.html', title: '強制振動と共鳴', description: 'この振動に周期的な外力を加えた運動です。' },
  ],
  footer: 'この画面の計算は、抵抗を受けてばねにつながれた一つの質点の減衰振動です。',
  proof: writtenProof([{
    statement: `${tex(`m x'' + \\gamma x' + k x = 0`)} の解では、${tex(String.raw`E = \frac{1}{2} m (x')^2 + \frac{1}{2} k x^2`)} の時間変化率は ${tex(String.raw`\frac{dE}{dt} = -\gamma (x')^2`)} です。とくに ${tex(String.raw`\gamma \ge 0`)} のとき ${tex('E')} は増えません。`,
    proof: [
      `${tex('x')} は2回微分できるので、${tex('E')} は微分できます。合成関数の微分により
        ${eq(String.raw`\frac{dE}{dt} = \frac{1}{2} m \cdot 2 x' x'' + \frac{1}{2} k \cdot 2 x x' = x'\,(m x'' + k x)`)}
        です。`,
      `運動方程式を移項すると ${tex(`m x'' + k x = -\\gamma x'`)} です。これを代入して
        ${eq(String.raw`\frac{dE}{dt} = x'\,(-\gamma x') = -\gamma (x')^2`)}
        を得ます。`,
      `${tex(String.raw`\gamma \ge 0`)} かつ ${tex(String.raw`(x')^2 \ge 0`)} なので、すべての時刻で ${tex(String.raw`\frac{dE}{dt} \le 0`)} です。平均値の定理により、${tex(String.raw`t_1 < t_2`)} ならある ${tex(String.raw`\tau \in (t_1, t_2)`)} で ${tex(String.raw`E(t_2) - E(t_1) = E'(\tau)(t_2 - t_1) \le 0`)} です。したがって ${tex('E')} は増えません。`,
      `両辺を ${tex('0')} から ${tex('t')} まで積分すると ${tex(String.raw`E(0) - E(t) = \int_0^t \gamma\, v(\tau)^2\, d\tau`)} です。左辺が散逸したエネルギーで、抵抗力 ${tex(`-\\gamma v`)} の仕事率 ${tex(String.raw`(-\gamma v)\cdot v`)} を積分した値の符号を変えたものに等しくなります。`,
    ],
  }]),
});

const form = formReader(defaults);
let method: StepMethod = 'euler';
let envelope: { key: string; figure?: LessonFigure } = { key: '' };
let last: [Snapshot | undefined, Snapshot[], LessonConfig] | undefined;

function envelopeFor(config: LessonConfig): LessonFigure | undefined {
  const params = {
    mass: config.mass,
    damping: config.damping,
    spring_constant: config.spring_constant,
    initial_position: config.initial_position,
    initial_velocity: config.initial_velocity,
    time_end: config.steps * config.dt,
  };
  const key = JSON.stringify(params);
  if (envelope.key !== key) {
    envelope = { key };
    lessonFigure('mechanics/damped-envelope', params).then(figure => {
      if (envelope.key !== key) return;
      envelope.figure = figure;
      if (last) paintFigures(...last);
    }).catch(() => undefined);
  }
  return envelope.figure;
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  last = [state, points, config];
  const canvases = ['scene', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  if (!state) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  const bound = envelopeFor(config);
  drawSpringMass(canvases[0], {
    key,
    position: state.position,
    exactPosition: state.exact_position,
    velocity: state.velocity,
    timeEnd,
    samples: points.map(p => ({ time: p.time, position: p.position, exactPosition: p.exact_position })),
  });
  drawPlot(canvases[1], {
    key: `${key}|position`,
    label: '位置と時間のグラフ。実線は数値解、破線は厳密解、細い破線は包絡線。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      ...(bound ? [line(bound, 'upper'), line(bound, 'lower')] : []),
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'x = 0',
  });
  drawPlot(canvases[2], {
    key: `${key}|phase`,
    label: '位置と速度の位相図。実線は数値解、破線は厳密解。',
    lines: [
      { x: points.map(p => p.position), y: points.map(p => p.velocity), role: 'numerical' },
      { x: points.map(p => p.exact_position), y: points.map(p => p.exact_velocity), role: 'exact' },
    ],
    dots: [{ x: state.position, y: state.velocity, role: 'numerical' }],
    zeroLabel: 'v = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-damped.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const values = state.frame?.values;
    return `数値解のエネルギー ${values?.energy.toFixed(6) ?? '—'}\n厳密なエネルギー ${values?.exact_energy.toFixed(6) ?? '—'}\n散逸したエネルギー（厳密） ${values?.dissipated.toFixed(6) ?? '—'}`;
  },
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
