import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'em/lorentz',
  charge: 1,
  mass: 1,
  field: 1,
  vperp: 1,
  vpar: 0.2,
  dt: 0.1,
  steps: 126,
};

renderLesson({
  id: 'lorentz',
  section: { label: '電磁気学' },
  title: '磁場中の荷電粒子',
  description: `一様な磁場の中の荷電粒子は、Lorentz 力を受けて磁力線に巻き付くらせんを描きます。運動方程式からサイクロトロン角振動数 ${tex(String.raw`\omega_c = qB/m`)} と Larmor 半径 ${tex(String.raw`r_L = v_\perp/|\omega_c|`)} の厳密解を導き、Boris 法と古典的RK4の数値解と比べます。`,
  equation: [
    String.raw`m\,\mathbf{v}' = q\left(\mathbf{E} + \mathbf{v} \times \mathbf{B}\right)`,
    String.raw`\omega_c = \frac{qB}{m},\qquad r_L = \frac{v_\perp}{|\omega_c|}`,
  ],
  studyHeading: 'らせん運動の厳密解と Boris 法の回転',
  steps: [
    `記号を定めます。${tex('q')} は粒子の電荷、${tex('m > 0')} は質量、${tex(String.raw`\mathbf{r} = (x, y, z)`)} は位置、${tex(String.raw`\mathbf{v} = \mathbf{r}'`)} は速度、${tex(String.raw`\mathbf{E}`)} は電場、${tex(String.raw`\mathbf{B}`)} は磁束密度です。このページでは ${tex(String.raw`\mathbf{E} = \mathbf{0}`)}、${tex(String.raw`\mathbf{B} = B\hat{\mathbf{z}}`)}（一様で一定）とします。外積は
      ${eq(String.raw`\mathbf{v} \times \mathbf{B} = (v_x, v_y, v_z) \times (0, 0, B) = (v_y B,\ -v_x B,\ 0)`)}
      なので、${tex(String.raw`\omega_c = qB/m`)} と置くと運動方程式は
      ${eq(String.raw`v_x' = \omega_c v_y,\qquad v_y' = -\omega_c v_x,\qquad v_z' = 0`)}
      です（${coreDoc('electromagnetism', 'lorentz_acceleration', 'Lorentz 力の加速度の説明')}）。`,
    `速さが一定であることを示します。運動方程式と ${tex(String.raw`\mathbf{v}`)} の内積をとると、外積 ${tex(String.raw`\mathbf{v} \times \mathbf{B}`)} は ${tex(String.raw`\mathbf{v}`)} に垂直なので
      ${eq(String.raw`\frac{d}{dt}\left(\frac{m}{2}|\mathbf{v}|^2\right) = m\,\mathbf{v}\cdot\mathbf{v}' = q\,\mathbf{v}\cdot(\mathbf{v} \times \mathbf{B}) = 0`)}
      です。磁場の力は仕事をせず、速さ ${tex(String.raw`|\mathbf{v}|`)} は厳密に一定です。磁場に垂直な速さ ${tex(String.raw`v_\perp = \sqrt{v_x^2 + v_y^2}`)} と平行な速さ ${tex(String.raw`v_\parallel = v_z`)} も、それぞれ一定です。`,
    `速度の解を求めます。${tex(String.raw`w = v_x + i v_y`)} と置くと
      ${eq(String.raw`w' = v_x' + i v_y' = \omega_c v_y - i\omega_c v_x = -i\omega_c\left(v_x + i v_y\right) = -i\omega_c w`)}
      なので ${tex(String.raw`w(t) = w_0 e^{-i\omega_c t}`)} です。実部と虚部に分けると
      ${eq(String.raw`v_x = v_{x0}\cos\omega_c t + v_{y0}\sin\omega_c t,\qquad v_y = -v_{x0}\sin\omega_c t + v_{y0}\cos\omega_c t,\qquad v_z = v_{z0}`)}
      です。`,
    `位置を求めます。初期位置を ${tex(String.raw`\mathbf{r}_0 = (-v_\perp/\omega_c,\ 0,\ 0)`)}、初速度を ${tex(String.raw`\mathbf{v}_0 = (0,\ v_\perp,\ v_\parallel)`)} とします。速度を 0 から ${tex('t')} まで積分すると
      ${eq(String.raw`x = -\frac{v_\perp}{\omega_c} + \frac{v_\perp}{\omega_c}\left(1 - \cos\omega_c t\right) = -\frac{v_\perp}{\omega_c}\cos\omega_c t`)}
      ${eq(String.raw`y = \frac{v_\perp}{\omega_c}\sin\omega_c t,\qquad z = v_\parallel t`)}
      です。2乗して足すと
      ${eq(String.raw`x^2 + y^2 = \frac{v_\perp^2}{\omega_c^2} = r_L^2`)}
      で、${tex('xy')} 平面への射影は原点を中心とする半径 ${tex('r_L')} の円です（${coreDoc('electromagnetism', 'helix_state', 'らせんの厳密解の説明')}）。${tex(String.raw`\omega_c > 0`)} では ${tex('z')} 軸の正の向きから見て時計回りです。1周の時間と、その間に ${tex('z')} 方向に進む距離（ピッチ）は
      ${eq(String.raw`T = \frac{2\pi}{|\omega_c|},\qquad p = v_\parallel T`)}
      です。`,
    `Boris 法を導きます。速度を半整数の時刻 ${tex(String.raw`t_{n \pm 1/2}`)}、位置を整数の時刻に置き、${tex(String.raw`\mathbf{v}\times\mathbf{B}`)} の速度を前後の平均にします。${tex(String.raw`\mathbf{E} = \mathbf{0}`)} では
      ${eq(String.raw`\frac{\mathbf{v}_{n+1/2} - \mathbf{v}_{n-1/2}}{\Delta t} = \frac{q}{m}\,\frac{\mathbf{v}_{n+1/2} + \mathbf{v}_{n-1/2}}{2} \times \mathbf{B},\qquad \mathbf{r}_{n+1} = \mathbf{r}_n + \Delta t\,\mathbf{v}_{n+1/2}`)}
      です。この陰的な式は、${tex(String.raw`\mathbf{t} = \frac{q\Delta t}{2m}\mathbf{B}`)}、${tex(String.raw`\mathbf{s} = \frac{2\mathbf{t}}{1 + |\mathbf{t}|^2}`)} を使った2回の外積で解けます。
      ${eq(String.raw`\mathbf{v}' = \mathbf{v}_{n-1/2} + \mathbf{v}_{n-1/2} \times \mathbf{t},\qquad \mathbf{v}_{n+1/2} = \mathbf{v}_{n-1/2} + \mathbf{v}' \times \mathbf{s}`)}
      （${coreDoc('electromagnetism', 'boris_step', 'Boris 法の1ステップの説明')}）。`,
    `${tex(String.raw`\mathbf{B} = B\hat{\mathbf{z}}`)} で成分を書きます。${tex(String.raw`\tau = \omega_c\Delta t/2`)} とすると ${tex(String.raw`\mathbf{t} = (0, 0, \tau)`)}、${tex(String.raw`s = 2\tau/(1 + \tau^2)`)} で
      ${eq(String.raw`\mathbf{v}' = \left(v_x + \tau v_y,\ v_y - \tau v_x,\ v_z\right)`)}
      ${eq(String.raw`v_x^{+} = v_x + s\left(v_y - \tau v_x\right) = (1 - s\tau)\,v_x + s\,v_y`)}
      ${eq(String.raw`v_y^{+} = v_y - s\left(v_x + \tau v_y\right) = -s\,v_x + (1 - s\tau)\,v_y`)}
      です。${tex(String.raw`\theta = 2\arctan\tau`)} と置くと、正接の半角の公式から
      ${eq(String.raw`1 - s\tau = \frac{1 - \tau^2}{1 + \tau^2} = \cos\theta,\qquad s = \frac{2\tau}{1 + \tau^2} = \sin\theta`)}
      です。Boris 法の1ステップは、厳密解の速度の式で ${tex(String.raw`\omega_c\Delta t`)} を ${tex(String.raw`\theta`)} に置きかえた回転です。回転なので速さ ${tex(String.raw`|\mathbf{v}|`)} は厳密に保たれ、1ステップの回転角 ${tex(String.raw`\theta = 2\arctan(\omega_c\Delta t/2)`)} は ${tex(String.raw`\omega_c\Delta t`)} より少し小さい近似です（${coreDoc('electromagnetism', 'boris_rotation_angle', '回転角の説明')}）。最初の速度 ${tex(String.raw`\mathbf{v}_{-1/2}`)} は厳密解の ${tex(String.raw`t = -\Delta t/2`)} の値です。`,
    `古典的RK4 は ${tex(String.raw`(\mathbf{r}, \mathbf{v})' = (\mathbf{v},\ \tfrac{q}{m}\mathbf{v}\times\mathbf{B})`)} を1ステップで4回評価して進めます。${tex(String.raw`w' = -i\omega_c w`)} に当てはめると、1ステップの倍率は ${tex(String.raw`x = \omega_c\Delta t`)} として
      ${eq(String.raw`G = 1 - ix - \frac{x^2}{2} + \frac{i x^3}{6} + \frac{x^4}{24}`)}
      ${eq(String.raw`|G|^2 = \left(1 - \frac{x^2}{2} + \frac{x^4}{24}\right)^2 + \left(x - \frac{x^3}{6}\right)^2 = 1 - \frac{x^6}{72} + \frac{x^8}{576}`)}
      です。${tex(String.raw`|G| \approx 1 - x^6/144 < 1`)} なので、RK4 では ${tex(String.raw`v_\perp`)} が1ステップごとにわずかに減ります。位置の誤差は ${tex(String.raw`\Delta t^4`)} に比例して小さくなります。`,
  ],
  figureAlt: '一様な磁場の中で、荷電粒子が磁力線に巻き付くらせんを描きながら z 方向に進む様子。',
  figure: experimentPanel({
    fieldsetLabel: '粒子と磁場',
    fields: [
      { name: 'charge', label: '電荷', symbol: 'q', value: 1 },
      { name: 'mass', label: '質量', symbol: 'm', value: 1, min: 0 },
      { name: 'field', label: '磁束密度', symbol: 'B', value: 1 },
      { name: 'vperp', label: '磁場に垂直な速さ', symbol: String.raw`v_\perp`, value: 1, min: 0 },
      { name: 'vpar', label: '磁場に平行な速さ', symbol: String.raw`v_\parallel`, value: 0.2 },
    ],
    dt: 0.1,
    steps: 126,
    sceneHeading: `${tex('xy')} 平面への射影`,
    sceneCaption: `実線は数値解の軌跡、青緑の破線は厳密解の円、破線の輪は同じ時刻の厳密解の位置です。矢印 ${tex(String.raw`\mathbf{v}`)} は速度、矢印 ${tex(String.raw`\mathbf{F}`)} は Lorentz 力の向きで、力はいつも速度に垂直で円の中心を向きます。磁場は紙面の裏から表へ向かいます。`,
    sceneLabel: '一様な磁場の中の荷電粒子の xy 平面への射影',
    sceneHeight: 320,
    readouts: { position: 'x 座標（数値解）', velocity: '速さ |v|（数値解）', exact: '厳密解の x', error: '差 x − x_exact' },
    plotsHeading: '磁場の向きに沿った運動と速さ',
    tabs: methodTabs('この方程式の数値解法', [{ id: 'boris', label: 'Boris 法' }, { id: 'rk4', label: '古典的RK4' }]),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>${tex('xz')} 平面への射影</h3><canvas id="side-chart" role="img"></canvas><p>位置 z</p></div><div class="plot-phase"><h3>速さの変化 ${tex(String.raw`|\mathbf{v}| - |\mathbf{v}_0|`)}</h3><canvas id="speed-chart" role="img"></canvas><p>時間 t</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('q = 1')}、${tex('m = 1')}、${tex('B = 1')}、${tex(String.raw`v_\perp = 1`)}、${tex(String.raw`v_\parallel = 0.2`)} とします。
      ${eq(String.raw`\omega_c = \frac{1 \cdot 1}{1} = 1,\qquad r_L = \frac{1}{1} = 1,\qquad |\mathbf{v}| = \sqrt{1^2 + 0.2^2} = \sqrt{1.04} \approx 1.01980`)}
      ${eq(String.raw`T = 2\pi \approx 6.28319,\qquad p = 0.2 \times 2\pi = 0.4\pi \approx 1.25664`)}
      です。根号と ${tex(String.raw`\pi`)} の形が厳密な値で、小数は近似です。`,
    `${tex(String.raw`\Delta t = 0.1`)}、126 ステップ（${tex('t = 12.6')}、約2周）で進めます。${tex('z = v_\\parallel t = 0.2 \\times 12.6 = 2.52')} は、どちらの方法でも厳密に一致します。Boris 法の1ステップの回転角は
      ${eq(String.raw`\theta = 2\arctan 0.05 \approx 0.0999167`)}
      で、厳密な ${tex('0.1')} より約 ${tex(String.raw`8.33 \times 10^{-5}`)} 小さく、126 ステップでは位相が約 ${tex(String.raw`126 \times 8.33 \times 10^{-5} \approx 0.0105`)} 遅れます。半径 1 の円なので、位置の差は約 0.0105（近似）です。速さは計器で 1.01980 のまま変わりません。`,
    `古典的RK4 では位置の差は約 ${tex(String.raw`1.0 \times 10^{-5}`)} と小さくなりますが、速さは
      ${eq(String.raw`126 \times \frac{0.1^6}{144} \approx 8.75 \times 10^{-7}`)}
      の割合で ${tex(String.raw`v_\perp`)} が減り、${tex(String.raw`|\mathbf{v}| - |\mathbf{v}_0| \approx -8.6 \times 10^{-7}`)}（近似）です。`,
  ],
  related: [
    { href: './rk4.html', title: '古典的RK4' },
    { href: './magnetostatics.html', title: '定常電流と静磁場' },
    { href: './system.html', title: '連立1階' },
  ],
  footer: 'この画面の計算は、一様で一定の磁場の中を運動する一つの荷電粒子です。',
});

const form = formReader(defaults);
let method = 'boris';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'side-chart', 'speed-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const labels: Record<string, string> = { velocity: 'v', force: 'F' };
  const extent = 1.3 * frame.values.radius;
  drawPlot(canvases[0], {
    key: `${key}|xy`,
    label: 'xy 平面への射影。実線は数値解の軌跡、破線は厳密解の円、矢印は速度と Lorentz 力。',
    equalAspect: true,
    xMin: -extent,
    xMax: extent,
    yMin: -extent,
    yMax: extent,
    lines: [line(frame, 'xy-exact'), line(frame, 'xy-trail')],
    vectors: frame.arrows.map(a => ({ ...a, label: labels[a.name] })),
    dots: [dot(frame, 'center'), dot(frame, 'exact-xy', undefined, true), { ...dot(frame, 'particle-xy', 'q'), radius: 5 }],
  });
  drawPlot(canvases[1], {
    key: `${key}|xz`,
    label: 'xz 平面への射影。横軸は z、縦軸は x。実線は数値解、破線は厳密解。',
    yMin: -extent,
    yMax: extent,
    lines: [line(frame, 'xz-exact'), line(frame, 'xz-trail')],
    dots: [dot(frame, 'exact-xz', undefined, true), { ...dot(frame, 'particle-xz'), radius: 4 }],
    zeroLabel: 'x = 0',
  });
  const change = points.map(p => p.velocity_error ?? 0);
  const spread = change.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
  drawPlot(canvases[2], {
    key: spread < 9e-7 ? undefined : `${key}|speed`,
    label: '速さの変化と時間のグラフ。実線は数値解、厳密解は 0 の線。',
    xMin: 0,
    xMax: config.steps * config.dt,
    ...(spread < 9e-7 ? { yMin: -9.6e-7, yMax: 9.6e-7 } : {}),
    lines: [{ x: points.map(p => p.time), y: change, role: 'numerical' }],
    dots: [{ x: state.time, y: state.velocity_error ?? 0, role: 'numerical' }],
    zeroLabel: '厳密解 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-lorentz.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    if (!v) return '—';
    return [
      `速さの変化 |v| − |v₀| = ${v.speed_change.toExponential(2)}`,
      `位置の差 |r − r_exact| = ${v.position_error.toExponential(2)}`,
      `z = ${v.z.toFixed(5)}`,
      `厳密解 z = ${v.exact_z.toFixed(5)}`,
    ].join('\n');
  },
});
bindMethodTabs<string>(next => {
  method = next;
  session.reloadMethod();
});
