import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot, drawSpringMass } from './figures';
import { dot, eq, experimentPanel, formReader, lessonFigure, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, LessonFigure, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'mechanics/forced',
  mass: 1,
  spring_constant: 4,
  damping: 0.5,
  force: 1,
  drive_frequency: 2,
  initial_position: 0,
  initial_velocity: 0,
  dt: 0.01,
  steps: 2000,
};

const exactValue = 'style="color:var(--color-analytical)"';

renderLesson({
  id: 'forced',
  section: { label: '力学', href: './' },
  title: '強制振動と共鳴',
  description: `減衰振動をする質点に、周期的な外力 ${tex(String.raw`F_0\cos\omega t`)} が働きます。複素振幅の方法で定常解の振幅 ${tex(String.raw`A(\omega)`)} と位相の遅れ ${tex(String.raw`\delta`)} を導き、外力の角振動数に対する共鳴曲線を描きます。`,
  equation: [String.raw`m x'' + \gamma x' + k x = F_0\cos\omega t`, String.raw`x_p(t) = A(\omega)\cos(\omega t - \delta)`],
  equationLabel: '強制振動の運動方程式。m x の2階微分、足す γ x の1階微分、足す k x は F0 cos ω t。',
  equationNote: `${tex(String.raw`A(\omega) = F_0/\sqrt{(k - m\omega^2)^2 + (\gamma\omega)^2}`)}、${tex(String.raw`\tan\delta = \gamma\omega/(k - m\omega^2)`)}`,
  studyHeading: '複素振幅から定常解への手順',
  steps: [
    `記号を定めます。${tex('m > 0')} は質量、${tex('k > 0')} はばね定数、${tex(String.raw`\gamma \ge 0`)} は減衰係数、${tex('F_0')} は外力の振幅、${tex(String.raw`\omega > 0`)} は外力の角振動数です。抵抗がないときの固有角振動数を ${tex(String.raw`\omega_0 = \sqrt{k/m}`)} とし、外力の ${tex(String.raw`\omega`)} とは区別します。初期条件は ${tex('x(0) = x_0')}、${tex(`x'(0) = v_0`)} です。`,
    `質点には、ばねの力 ${tex('-kx')}、抵抗力 ${tex(`-\\gamma x'`)}、外力 ${tex(String.raw`F_0\cos\omega t`)} が働きます。Newton の運動方程式に代入して移項します。
      ${eq(String.raw`m x'' = -k x - \gamma x' + F_0\cos\omega t`)}
      ${eq(String.raw`m x'' + \gamma x' + k x = F_0\cos\omega t`)}
      左辺は ${tex('x')} について線形です。二つの解の差は右辺が 0 の方程式、すなわち減衰振動の方程式を満たすので、一般解は一つの特殊解 ${tex('x_p')} と減衰振動の一般解 ${tex('x_h')} の和
      ${eq(String.raw`x(t) = x_p(t) + x_h(t)`)}
      です。`,
    `特殊解を複素数で求めます。${tex(String.raw`\cos\omega t = \operatorname{Re} e^{i\omega t}`)} なので、複素数の関数 ${tex('z(t)')} についての方程式
      ${eq(String.raw`m z'' + \gamma z' + k z = F_0 e^{i\omega t}`)}
      を考えます。係数 ${tex('m')}、${tex(String.raw`\gamma`)}、${tex('k')} は実数なので、両辺の実部をとると ${tex(String.raw`x = \operatorname{Re} z`)} がもとの方程式を満たします。${tex(String.raw`z = \tilde{A} e^{i\omega t}`)}（${tex(String.raw`\tilde{A}`)} は複素数の定数）と置くと
      ${eq(String.raw`z' = i\omega\tilde{A} e^{i\omega t},\qquad z'' = -\omega^2\tilde{A} e^{i\omega t}`)}
      です。代入します。
      ${eq(String.raw`\left(-m\omega^2 + i\gamma\omega + k\right)\tilde{A} e^{i\omega t} = F_0 e^{i\omega t}`)}
      ${tex(String.raw`e^{i\omega t} \neq 0`)} で割ると
      ${eq(String.raw`\tilde{A} = \frac{F_0}{(k - m\omega^2) + i\gamma\omega}`)}
      です。`,
    `分母を極形式で書きます。
      ${eq(String.raw`(k - m\omega^2) + i\gamma\omega = R\,e^{i\delta}`)}
      ${eq(String.raw`R = \sqrt{(k - m\omega^2)^2 + (\gamma\omega)^2},\qquad \cos\delta = \frac{k - m\omega^2}{R},\qquad \sin\delta = \frac{\gamma\omega}{R}`)}
      ${tex(String.raw`\gamma\omega \ge 0`)} なので ${tex(String.raw`\sin\delta \ge 0`)} で、${tex(String.raw`\delta`)} は ${tex(String.raw`[0, \pi]`)} にとれます。すると
      ${eq(String.raw`\tilde{A} = \frac{F_0}{R}\,e^{-i\delta}`)}
      ${eq(String.raw`z(t) = \frac{F_0}{R}\,e^{i(\omega t - \delta)}`)}
      ${eq(String.raw`x_p(t) = \operatorname{Re} z(t) = \frac{F_0}{R}\cos(\omega t - \delta)`)}
      です。振幅と位相の遅れは
      ${eq(String.raw`A(\omega) = \frac{F_0}{\sqrt{(k - m\omega^2)^2 + (\gamma\omega)^2}}`)}
      ${eq(String.raw`\tan\delta = \frac{\sin\delta}{\cos\delta} = \frac{\gamma\omega}{k - m\omega^2}`)}
      です（${coreDoc('mechanics', 'forced_amplitude', '定常振幅の説明')}、${coreDoc('mechanics', 'forced_phase', '位相の遅れの説明')}）。${tex(String.raw`\omega = \omega_0`)} では ${tex(String.raw`k - m\omega^2 = 0`)} なので ${tex(String.raw`\cos\delta = 0`)}、${tex(String.raw`\delta = \pi/2`)} です。`,
    `共鳴曲線の山の位置を求めます。${tex('A')} が最大になるのは ${tex('R^2')} が最小になるときです。${tex(String.raw`u = \omega^2`)} と置いて微分します。
      ${eq(String.raw`R^2 = (k - m u)^2 + \gamma^2 u`)}
      ${eq(String.raw`\frac{d R^2}{du} = -2m(k - m u) + \gamma^2 = 0`)}
      ${eq(String.raw`u = \frac{k}{m} - \frac{\gamma^2}{2m^2}`)}
      右辺が正のとき、山は ${tex(String.raw`\omega_r = \sqrt{\omega_0^2 - \gamma^2/(2m^2)}`)} にあります。${tex(String.raw`\beta = \gamma/(2m)`)}、${tex(String.raw`\omega_d = \sqrt{\omega_0^2 - \beta^2}`)} とすると、${tex(String.raw`k - m\omega_r^2 = \gamma^2/(2m)`)} を代入して
      ${eq(String.raw`R^2 = \frac{\gamma^4}{4m^2} + \gamma^2\left(\omega_0^2 - \frac{\gamma^2}{2m^2}\right) = \gamma^2\left(\omega_0^2 - \beta^2\right) = \gamma^2\omega_d^2`)}
      ${eq(String.raw`A_{\max} = \frac{F_0}{\gamma\,\omega_d}`)}
      です。${tex(String.raw`\gamma`)} が小さいほど山は高く、${tex(String.raw`\omega_r`)} は ${tex(String.raw`\omega_0`)} に近づきます。`,
    `初期値問題の厳密解は、${tex(String.raw`x_h(0) = x_0 - x_p(0)`)}、${tex(String.raw`x_h'(0) = v_0 - x_p'(0)`)} となる減衰振動の解 ${tex('x_h')} を加えたものです（${coreDoc('mechanics', 'forced_state', '初期値問題の厳密解の説明')}）。${tex('x_h')} は ${tex(String.raw`e^{-\beta t}`)} で小さくなるので、時間が十分たつと ${tex(String.raw`x \approx x_p`)} です。数値解は、${tex(`x' = v`)}、${tex(String.raw`v' = (F_0\cos\omega t - \gamma v - k x)/m`)} を選んだ方法で1ステップずつ進めた近似です。`,
  ],
  figureAlt: '共鳴曲線。減衰係数が小さいほど、定常振幅の山が ω = 2 の近くで高く鋭い。',
  figure: experimentPanel({
    fieldsetLabel: 'ばね、抵抗、外力',
    fields: [
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'spring_constant', label: 'ばね定数', symbol: 'k', value: 4, min: 0 },
      { name: 'damping', label: '減衰係数', symbol: String.raw`\gamma`, value: 0.5, min: 0 },
      { name: 'force', label: '外力の振幅', symbol: 'F_0', value: 1 },
      { name: 'drive_frequency', label: '外力の角振動数', symbol: String.raw`\omega`, value: 2, min: 0 },
      { name: 'initial_position', label: '初期位置', symbol: 'x_0', value: 0 },
      { name: 'initial_velocity', label: '初期速度', symbol: 'v_0', value: 0 },
    ],
    dt: 0.01,
    steps: 2000,
    sceneHeading: '外力を受けてばねにつながれた質点',
    sceneCaption: '質点は数値解の位置にあります。黒の矢印は外力 F(t) の向きと大きさ、青緑の破線の輪は同じ時刻の厳密解の位置、橙の矢印は速度の向きです。',
    sceneLabel: '周期的な外力を受けて往復する、ばねにつながれた質点',
    readouts: { position: '位置 x', velocity: '速度 v', exact: '厳密解の位置', error: '位置の差 x − x_exact' },
    plotsHeading: '位置の時間変化と共鳴曲線',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 ${tex('x(t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t（細い破線は定常解 ${tex('x_p(t)')}）</p></div><div class="plot-phase"><h3>定常振幅の共鳴曲線 ${tex(String.raw`A(\omega)`)}</h3><canvas id="resonance-chart" role="img"></canvas><p>外力の角振動数 ω（点は現在の ω）</p></div></div>
            <div class="readouts"><div><span>外力の角振動数 ω</span><output id="drive-frequency">—</output></div><div><span>固有角振動数 ω₀（厳密）</span><output id="natural-frequency" ${exactValue}>—</output></div><div><span>定常振幅 A（厳密）</span><output id="amplitude" ${exactValue}>—</output></div><div><span>位相の遅れ δ（厳密）</span><output id="phase" ${exactValue}>—</output></div></div>`,
    code: codeDisclosure('euler'),
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 1')}、${tex('k = 4')}、${tex(String.raw`\gamma = 0.5`)}、${tex('F_0 = 1')}、${tex(String.raw`\omega = 2`)} とします。固有角振動数は ${tex(String.raw`\omega_0 = \sqrt{4/1} = 2`)} で、外力の角振動数と等しくなっています。分母の実部と虚部は
      ${eq(String.raw`k - m\omega^2 = 4 - 1\cdot 2^2 = 0,\qquad \gamma\omega = 0.5\cdot 2 = 1`)}
      です。`,
    `振幅と位相の遅れは
      ${eq(String.raw`A = \frac{1}{\sqrt{0^2 + 1^2}} = 1,\qquad \cos\delta = \frac{0}{1} = 0,\quad \sin\delta = \frac{1}{1} = 1,\quad \delta = \frac{\pi}{2}`)}
      で、どちらも厳密な値です。${tex(String.raw`\pi/2 \approx 1.57080`)} は小数5桁の近似です。定常解は
      ${eq(String.raw`x_p(t) = \cos\!\left(2t - \frac{\pi}{2}\right) = \sin 2t`)}
      で、外力 ${tex(String.raw`\cos 2t`)} より位相が4分の1周期遅れます。画面の既定の条件で、共鳴曲線の下の計器に ${tex('A')} と ${tex(String.raw`\delta`)} の値が出ます。`,
    `${tex('x_0 = 0')}、${tex('v_0 = 0')} から始めます。${tex(String.raw`x_p(0) = 0`)}、${tex(String.raw`x_p'(0) = 2\cos 0 = 2`)} なので、${tex(String.raw`x_h(0) = 0`)}、${tex(String.raw`x_h'(0) = -2`)} です。${tex(String.raw`\beta = 0.5/2 = 0.25`)}、${tex(String.raw`\omega_d = \sqrt{4 - 0.25^2} = \sqrt{3.9375}`)} の減衰振動の解は
      ${eq(String.raw`x_h(t) = e^{-0.25t}\,\frac{-2 + 0.25\cdot 0}{\sqrt{3.9375}}\sin\sqrt{3.9375}\,t`)}
      なので、厳密解は
      ${eq(String.raw`x(t) = \sin 2t - \frac{2}{\sqrt{3.9375}}\,e^{-0.25t}\sin\sqrt{3.9375}\,t`)}
      です。${tex(String.raw`2/\sqrt{3.9375} \approx 1.00791`)}（近似）で、${tex('t = 20')} では過渡の項の大きさは ${tex(String.raw`1.00791\,e^{-5} \approx 0.00679`)} 以下です。`,
    `この減衰係数での共鳴曲線の山は ${tex(String.raw`\omega_r = \sqrt{4 - 0.25/2} = \sqrt{3.875} \approx 1.96850`)} にあり、高さは ${tex(String.raw`A_{\max} = \frac{1}{0.5\sqrt{3.9375}} = \frac{2}{\sqrt{3.9375}} \approx 1.00791`)} です。根号の形が厳密な値、小数は近似です。`,
  ],
  related: [
    { href: './damped.html', title: '減衰振動', description: '外力のない場合の運動で、過渡の項はこの方程式の解です。' },
    { href: './undetermined.html', title: '未定係数法', description: '右辺が余弦のときの特殊解を、係数を置いて求めます。' },
    { href: './variation.html', title: '定数変化法', description: '一般の外力に対する特殊解を求める方法です。' },
    { href: './laplace.html', title: 'Laplace 変換', description: '初期値問題を代数の方程式にして解きます。' },
  ],
  footer: 'この画面の計算は、周期的な外力を受けてばねにつながれた一つの質点の強制振動です。',
});

const form = formReader(defaults);
let method: StepMethod = 'euler';
let statics: { key: string; steady?: LessonFigure; resonance?: LessonFigure } = { key: '' };
let last: [Snapshot | undefined, Snapshot[], LessonConfig] | undefined;

function setOutput(id: string, value: number | undefined) {
  document.getElementById(id)!.textContent = value === undefined ? '—' : value.toFixed(5);
}

function staticFigures(config: LessonConfig) {
  const params = {
    mass: config.mass,
    damping: config.damping,
    spring_constant: config.spring_constant,
    force: config.force,
    drive_frequency: config.drive_frequency,
  };
  const key = JSON.stringify(params) + `|${config.steps * config.dt}`;
  if (statics.key !== key) {
    statics = { key };
    Promise.all([
      lessonFigure('mechanics/forced-steady', { ...params, time_end: config.steps * config.dt }),
      lessonFigure('mechanics/forced-resonance', params),
    ]).then(([steady, resonance]) => {
      if (statics.key !== key) return;
      statics.steady = steady;
      statics.resonance = resonance;
      if (last) paintFigures(...last);
    }).catch(error => {
      const element = document.getElementById('error')!;
      element.textContent = `定常解と共鳴曲線を計算できません。${String(error)}`;
      element.hidden = false;
    });
  }
  return statics;
}

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  last = [state, points, config];
  const canvases = ['scene', 'time-chart', 'resonance-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const { steady, resonance } = staticFigures(config);
  setOutput('drive-frequency', Number(config.drive_frequency));
  setOutput('natural-frequency', resonance?.values.natural_frequency);
  setOutput('amplitude', resonance?.values.amplitude);
  setOutput('phase', resonance?.values.phase);
  if (resonance) {
    const curve = line(resonance, 'amplitude');
    const top = curve.y.reduce((a, b) => Math.max(a, b), 0);
    const natural = resonance.values.natural_frequency;
    drawPlot(canvases[2], {
      label: '外力の角振動数と定常振幅の共鳴曲線。破線は厳密な振幅、点は現在の外力の角振動数。',
      xMin: 0,
      yMin: 0,
      lines: [{ x: [natural, natural], y: [0, top], role: 'muted' }, curve],
      dots: [dot(resonance, 'drive', `A = ${resonance.values.amplitude.toFixed(3)}`)],
      zeroLabel: 'A = 0',
    });
  } else {
    clearFigure(canvases[2]);
  }
  if (!state) {
    clearFigure(canvases[0]);
    clearFigure(canvases[1]);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawSpringMass(canvases[0], {
    key,
    position: state.position,
    exactPosition: state.exact_position,
    velocity: state.velocity,
    timeEnd,
    samples: points.map(p => ({ time: p.time, position: p.position, exactPosition: p.exact_position })),
    drive: state.frame?.values.drive,
  });
  drawPlot(canvases[1], {
    key: `${key}|position`,
    label: '位置と時間のグラフ。実線は数値解、破線は厳密解、細い破線は定常解。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      ...(steady ? [line(steady, 'steady')] : []),
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
  downloadName: 'ergion-forced.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const values = state.frame?.values;
    return `定常解の位置 x_p（厳密） ${values?.steady.toFixed(6) ?? '—'}\n外力 F(t) ${values?.drive.toFixed(6) ?? '—'}\n数値解のエネルギー ${values?.energy.toFixed(6) ?? '—'}`;
  },
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
