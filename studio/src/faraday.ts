import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'em/faraday',
  field: 1,
  area: 1,
  omega: 1,
  inductance: 1,
  resistance: 1,
  diff_step: 0.1,
  dt: 0.1,
  steps: 100,
};

renderLesson({
  id: 'faraday',
  section: { label: '電磁気学' },
  title: 'Faraday の電磁誘導の法則',
  description: `導線のループを貫く磁束 ${tex(String.raw`\Phi(t)`)} が変わると、ループに起電力 ${tex(String.raw`\mathcal{E} = -d\Phi/dt`)} が生じます。振動する磁束の起電力を厳密解と中心差分で求め、その起電力で駆動される RL 回路の電流を数値積分して厳密解と比べます。`,
  equation: [
    String.raw`\oint_C \mathbf{E}\cdot d\mathbf{l} = -\frac{d\Phi}{dt},\qquad \Phi = \int_S \mathbf{B}\cdot d\mathbf{S}`,
    String.raw`L\,\frac{dI}{dt} + R\,I = \mathcal{E}(t)`,
  ],
  equationLabel: 'Faraday の法則。閉曲線 C に沿った電場の線積分は、マイナス磁束の時間微分。RL 回路の方程式は、L 掛ける I の時間微分たす R 掛ける I が起電力。',
  studyHeading: '磁束の時間変化から起電力と電流を求める手順',
  steps: [
    `記号を定めます。${tex('C')} は導線のループ、${tex('S')} は ${tex('C')} を縁とする面積 ${tex('A')} の平面、${tex(String.raw`\hat{\mathbf{n}}`)} はその単位法線です。磁束密度は一様で ${tex(String.raw`\mathbf{B}(t) = B_0\cos(\omega t)\,\hat{\mathbf{n}}`)}（${tex('B_0')} は振幅、${tex(String.raw`\omega > 0`)} は角振動数）とします。ループを貫く磁束は
      ${eq(String.raw`\Phi(t) = \int_S \mathbf{B}\cdot d\mathbf{S} = B_0\cos(\omega t)\,\hat{\mathbf{n}}\cdot\hat{\mathbf{n}}\,A = B_0 A\cos\omega t`)}
      です（${coreDoc('electromagnetism', 'cosine_flux', '磁束の説明')}）。`,
    `ループの起電力 ${tex(String.raw`\mathcal{E} = \oint_C \mathbf{E}\cdot d\mathbf{l}`)} は、Faraday の法則により
      ${eq(String.raw`\mathcal{E}(t) = -\frac{d\Phi}{dt} = -B_0 A\,\frac{d}{dt}\cos\omega t = B_0 A\,\omega\sin\omega t`)}
      です（${coreDoc('electromagnetism', 'faraday_emf', '起電力の説明')}）。振幅を ${tex(String.raw`\mathcal{E}_0 = B_0 A\omega`)} と書きます。Stokes の定理 ${tex(String.raw`\oint_C \mathbf{E}\cdot d\mathbf{l} = \int_S (\nabla\times\mathbf{E})\cdot d\mathbf{S}`)} を使うと、どんな面 ${tex('S')} でも成り立つことから微分形
      ${eq(String.raw`\nabla\times\mathbf{E} = -\frac{\partial\mathbf{B}}{\partial t}`)}
      を得ます。`,
    `符号の意味を確かめます。${tex('C')} の正の向きは、${tex(String.raw`\hat{\mathbf{n}}`)} に右手の親指を向けたときの指の向きです。磁束が増えている（${tex(String.raw`d\Phi/dt > 0`)}）とき ${tex(String.raw`\mathcal{E} < 0`)} で、電流は負の向きに流れます。この電流がループの内側につくる磁場は ${tex(String.raw`-\hat{\mathbf{n}}`)} 向きで、磁束の増加を打ち消します。これが Lenz の法則です。`,
    `磁束の値だけから起電力を近似する中心差分は
      ${eq(String.raw`\mathcal{E}_h(t) = -\frac{\Phi(t + h) - \Phi(t - h)}{2h}`)}
      です（${tex('h > 0')} は差分の幅）。和積の公式 ${tex(String.raw`\cos(a + b) - \cos(a - b) = -2\sin a\sin b`)} を使うと
      ${eq(String.raw`\mathcal{E}_h(t) = -\frac{B_0 A}{2h}\left(-2\sin\omega t\,\sin\omega h\right) = B_0 A\,\frac{\sin\omega h}{h}\sin\omega t = \frac{\sin\omega h}{\omega h}\,\mathcal{E}(t)`)}
      です（${coreDoc('electromagnetism', 'central_difference_emf', '中心差分の説明')}）。厳密解との比 ${tex(String.raw`\sin(\omega h)/(\omega h) \approx 1 - (\omega h)^2/6`)} は時刻によらず、差分は近似です。`,
    `ループの自己インダクタンスを ${tex('L > 0')}、抵抗を ${tex('R > 0')}、電流を ${tex('I(t)')}（正の向きは ${tex('C')} の正の向き）とします。電流の変化は自己誘導の起電力 ${tex(String.raw`-L\,dI/dt`)} を生むので、Kirchhoff の法則は
      ${eq(String.raw`\mathcal{E}(t) - L\frac{dI}{dt} = R\,I`)}
      ${eq(String.raw`L\frac{dI}{dt} + R\,I = \mathcal{E}_0\sin\omega t,\qquad I(0) = 0`)}
      です。`,
    `定常解を ${tex(String.raw`I_s = a\sin\omega t + b\cos\omega t`)} と置いて代入します。
      ${eq(String.raw`L\omega\left(a\cos\omega t - b\sin\omega t\right) + R\left(a\sin\omega t + b\cos\omega t\right) = \mathcal{E}_0\sin\omega t`)}
      ${tex(String.raw`\sin\omega t`)} と ${tex(String.raw`\cos\omega t`)} の係数を比べると
      ${eq(String.raw`R a - \omega L b = \mathcal{E}_0,\qquad \omega L a + R b = 0`)}
      です。第2式から ${tex(String.raw`b = -\omega L a/R`)}、第1式に代入して ${tex(String.raw`Z^2 = R^2 + \omega^2 L^2`)} と置くと
      ${eq(String.raw`a = \frac{\mathcal{E}_0 R}{Z^2},\qquad b = -\frac{\mathcal{E}_0\,\omega L}{Z^2}`)}
      です。定常電流の振幅は ${tex(String.raw`\sqrt{a^2 + b^2} = \mathcal{E}_0/Z`)}、起電力からの位相の遅れは ${tex(String.raw`\arctan(\omega L/R)`)} です（${coreDoc('electromagnetism', 'rl_steady_amplitude', '定常電流の振幅の説明')}）。`,
    `同次方程式 ${tex('L I\' + R I = 0')} の解は ${tex(String.raw`K e^{-Rt/L}`)} です。初期条件 ${tex('I(0) = b + K = 0')} から ${tex(String.raw`K = \mathcal{E}_0\omega L/Z^2`)} なので、厳密解は
      ${eq(String.raw`I(t) = \frac{\mathcal{E}_0}{Z^2}\left(R\sin\omega t - \omega L\cos\omega t\right) + \frac{\mathcal{E}_0\,\omega L}{Z^2}\,e^{-Rt/L}`)}
      です（${coreDoc('electromagnetism', 'rl_current', 'RL 回路の電流の説明')}）。第2項は時定数 ${tex('L/R')} で減る過渡解です。数値解は ${tex(String.raw`I' = (\mathcal{E}(t) - R I)/L`)} を選んだ方法で1ステップずつ進めた近似です。Euler 法は ${tex(String.raw`\Delta t < 2L/R`)} のときに限り、過渡解を減らします。`,
  ],
  figureAlt: '振動する磁場が貫く円形のループと、磁束の変化を打ち消す向きに流れる誘導電流の矢印。',
  figure: experimentPanel({
    fieldsetLabel: '磁束と回路',
    fields: [
      { name: 'field', label: '磁束密度の振幅', symbol: 'B_0', value: 1 },
      { name: 'area', label: 'ループの面積', symbol: 'A', value: 1, min: 0 },
      { name: 'omega', label: '角振動数', symbol: String.raw`\omega`, value: 1, min: 0 },
      { name: 'diff_step', label: '中心差分の幅', symbol: 'h', value: 0.1, min: 0 },
      { name: 'inductance', label: '自己インダクタンス', symbol: 'L', value: 1, min: 0 },
      { name: 'resistance', label: '抵抗', symbol: 'R', value: 1, min: 0 },
    ],
    dt: 0.1,
    steps: 100,
    sceneHeading: 'ループを貫く磁場と誘導電流',
    sceneCaption: `実線の円はループ ${tex('C')}（電流を数値解で求める導線）を法線 ${tex(String.raw`\hat{\mathbf{n}}`)} の向きから見た形です。塗りつぶした点は磁場が紙面の表向き（${tex('B > 0')}）、白抜きの点は裏向き（${tex('B < 0')}）を表します。円の上の矢印は電流 ${tex('I')} の数値解の向きと大きさで、反時計回りが正の向きです。`,
    sceneLabel: '振動する磁場が貫くループと誘導電流の向き',
    sceneHeight: 320,
    readouts: { position: '電流 I（数値解）', velocity: '起電力の中心差分 ℰ_h（近似）', exact: '厳密解の電流 I', error: '差 I − I_exact' },
    plotsHeading: '磁束、起電力、電流の時間変化',
    tabs: methodTabs('この方程式の数値解法'),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>磁束 ${tex(String.raw`\Phi(t)`)} と起電力 ${tex(String.raw`\mathcal{E}(t)`)}</h3><canvas id="emf-chart" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>電流 ${tex('I(t)')}</h3><canvas id="current-chart" role="img"></canvas><p>時間 t</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('B_0 = 1')}、${tex('A = 1')}、${tex(String.raw`\omega = 1`)}、${tex('L = 1')}、${tex('R = 1')} とします。
      ${eq(String.raw`\mathcal{E}_0 = 1 \cdot 1 \cdot 1 = 1,\qquad Z^2 = 1^2 + 1^2 = 2,\qquad \frac{\mathcal{E}_0}{Z} = \frac{1}{\sqrt{2}} \approx 0.70711,\qquad \arctan\frac{1}{1} = \frac{\pi}{4}`)}
      で、時定数は ${tex('L/R = 1')} です。電流の厳密解は
      ${eq(String.raw`I(t) = \tfrac{1}{2}\left(\sin t - \cos t\right) + \tfrac{1}{2}e^{-t}`)}
      で、たとえば ${tex(String.raw`I(\pi) = \tfrac{1}{2}(0 + 1) + \tfrac{1}{2}e^{-\pi} \approx 0.52161`)} です。`,
    `既定の条件（${tex(String.raw`\Delta t = 0.1`)}、100 ステップ、終わりの時刻 ${tex('t = 10')}）では、厳密解は
      ${eq(String.raw`I(10) = \tfrac{1}{2}\left(\sin 10 - \cos 10\right) + \tfrac{1}{2}e^{-10} \approx \tfrac{1}{2}\left(-0.54402 - (-0.83907)\right) + 0.00002 \approx 0.14755`)}
      です（近似）。数値解は Euler 法で約 0.16894、中点法で約 0.14687、古典的RK4で約 0.14755 です。`,
    `差分の幅 ${tex('h = 0.1')} の中心差分と厳密解の比は
      ${eq(String.raw`\frac{\sin 0.1}{0.1} \approx 0.998334`)}
      で、${tex('t = 10')} の起電力は厳密解 ${tex(String.raw`\sin 10 \approx -0.54402`)} に対して中心差分は約 ${tex('-0.54311')} です。`,
  ],
  related: [
    { href: './forced.html', title: '強制振動と共鳴' },
    { href: './magnetostatics.html', title: '定常電流と静磁場' },
    { href: './maxwell.html', title: 'Maxwell 方程式と電磁波' },
    { href: './numerical-differentiation.html', title: '数値微分' },
  ],
  footer: 'この画面の計算は、一様に振動する磁場が貫く一つのループと、それに直列につないだ抵抗とインダクタンスです。',
});

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'emf-chart', 'current-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  const radius = frame.values.radius;
  drawPlot(canvases[0], {
    key: `${key}|loop`,
    label: 'ループと磁場の向き、誘導電流の矢印。',
    equalAspect: true,
    xMin: -1.6 * radius,
    xMax: 1.6 * radius,
    yMin: -1.6 * radius,
    yMax: 1.6 * radius,
    lines: [line(frame, 'loop')],
    vectors: frame.arrows.map(a => ({ ...a })),
    dots: frame.points.map(p => ({ ...dot(frame, p.name, undefined, p.role === 'muted'), role: 'vector', radius: 4 })),
  });
  drawPlot(canvases[1], {
    key: `${key}|emf`,
    label: '磁束と起電力の時間変化。灰色は磁束、破線は起電力の厳密解、実線は中心差分。',
    xMin: 0,
    xMax: timeEnd,
    yMin: -1.15 * Math.max(frame.values.flux_peak, frame.values.emf_peak),
    yMax: 1.15 * Math.max(frame.values.flux_peak, frame.values.emf_peak),
    lines: [line(frame, 'flux', 'Φ'), line(frame, 'emf-exact'), line(frame, 'emf-difference', 'ℰ')],
    dots: [{ x: state.time, y: state.velocity, role: 'numerical' }],
    zeroLabel: '0',
  });
  drawPlot(canvases[2], {
    key: `${key}|current`,
    label: '電流と時間のグラフ。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      { x: points.map(p => p.time), y: points.map(p => p.exact_position), role: 'exact' },
      { x: points.map(p => p.time), y: points.map(p => p.position), role: 'numerical' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    zeroLabel: 'I = 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-faraday.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    return [
      `厳密な起電力 ℰ = ${state.exact_velocity.toFixed(5)}`,
      `中心差分と厳密解の比 sin(ωh)/(ωh) = ${v.emf_ratio.toFixed(6)}`,
      `磁束 Φ = ${v.flux_now.toFixed(5)}`,
      `定常電流の振幅 ℰ₀/Z = ${v.steady_amplitude.toFixed(5)}`,
    ].join('\n');
  },
});
bindMethodTabs(next => {
  method = next;
  session.reloadMethod();
});
