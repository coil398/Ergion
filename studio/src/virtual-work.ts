import { coreDoc } from './chrome';
import { codeDisclosure, mountCodeDisclosure, setCodeMethod } from './code-panel';
import { clearFigure, drawPlot } from './figures';
import { dot, eq, experimentPanel, formReader, lessonFigure, line, renderLesson } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, LessonFigure, Snapshot, StepMethod } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';
import { onThemeChange } from './theme';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'analytical/virtual-work',
  mass: 2,
  gravity: 9.8,
  angle: 30,
  dt: 0.01,
  steps: 200,
};

renderLesson({
  id: 'virtual-work',
  section: { label: '解析力学' },
  title: "仮想仕事の原理と d'Alembert の原理",
  description: `拘束力は、拘束を破らない微小な変位（仮想変位）に対して仕事をしません。このことから、拘束力を知らなくても釣り合いの条件と運動方程式が得られます。なめらかな斜面の上の質点で、支える力 ${tex(String.raw`F = mg\tan\alpha`)} と加速度 ${tex(String.raw`s'' = g\sin\alpha`)} を導きます。`,
  equation: [String.raw`\sum_i \mathbf{F}_i\cdot\delta\mathbf{r}_i = 0`, String.raw`\sum_i \left(\mathbf{F}_i - m_i\mathbf{r}_i''\right)\cdot\delta\mathbf{r}_i = 0`],
  studyHeading: '仮想仕事から釣り合いと運動方程式への手順',
  steps: [
    `記号を定めます。${tex('N')} 個の質点の質量を ${tex('m_i')}、位置を ${tex(String.raw`\mathbf{r}_i`)} とします。質点 ${tex('i')} が受ける力を、与えられた力 ${tex(String.raw`\mathbf{F}_i`)}（重力や手で押す力）と、拘束を保つための拘束力 ${tex(String.raw`\mathbf{R}_i`)}（斜面の垂直抗力や糸の張力）に分けます。時刻を止めたまま拘束を破らないように各質点を微小に動かす変位 ${tex(String.raw`\delta\mathbf{r}_i`)} を仮想変位と呼びます。なめらかな面や伸びない糸のような理想的な拘束では
      ${eq(String.raw`\sum_i \mathbf{R}_i\cdot\delta\mathbf{r}_i = 0`)}
      です。拘束力は面に垂直で、仮想変位は面に沿うからです。`,
    `静止した系では各質点で力が釣り合い、${tex(String.raw`\mathbf{F}_i + \mathbf{R}_i = \mathbf{0}`)} です。仮想変位との内積をとって足すと
      ${eq(String.raw`\sum_i (\mathbf{F}_i + \mathbf{R}_i)\cdot\delta\mathbf{r}_i = 0`)}
      ${eq(String.raw`\sum_i \mathbf{F}_i\cdot\delta\mathbf{r}_i + \sum_i \mathbf{R}_i\cdot\delta\mathbf{r}_i = 0`)}
      で、第2項は 0 なので
      ${eq(String.raw`\delta W = \sum_i \mathbf{F}_i\cdot\delta\mathbf{r}_i = 0`)}
      です。これが仮想仕事の原理で、未知の拘束力 ${tex(String.raw`\mathbf{R}_i`)} が式から消えています（${coreDoc('analytical', 'virtual_work', '仮想仕事の説明')}）。`,
    `傾き ${tex(String.raw`\alpha`)} のなめらかな斜面の上の質量 ${tex('m')} の質点を、水平な力 ${tex('F')} で支えます。斜面を下る向きの単位ベクトルを ${tex(String.raw`\mathbf{t} = (\cos\alpha, -\sin\alpha)`)} とすると、仮想変位は ${tex(String.raw`\delta\mathbf{r} = \delta s\,\mathbf{t}`)} です。重力は ${tex('(0, -mg)')}、支える力は ${tex('(-F, 0)')} なので
      ${eq(String.raw`\delta W = \big[0\cdot\cos\alpha + (-mg)(-\sin\alpha)\big]\delta s + \big[(-F)\cos\alpha + 0\cdot(-\sin\alpha)\big]\delta s`)}
      ${eq(String.raw`= (mg\sin\alpha - F\cos\alpha)\,\delta s`)}
      です。任意の ${tex(String.raw`\delta s`)} で ${tex(String.raw`\delta W = 0`)} となるのは
      ${eq(String.raw`mg\sin\alpha - F\cos\alpha = 0`)}
      ${eq(String.raw`F = mg\tan\alpha`)}
      のときです（${coreDoc('analytical', 'incline_holding_force', '支える力の説明')}）。`,
    `垂直抗力は斜面の法線 ${tex(String.raw`\mathbf{n} = (\sin\alpha, \cos\alpha)`)} の向きで、仮想変位との内積は
      ${eq(String.raw`\mathbf{N}\cdot\delta\mathbf{r} = N(\sin\alpha\cos\alpha - \cos\alpha\sin\alpha)\,\delta s = 0`)}
      です。運動していても、法線方向には動かないので ${tex(String.raw`N - mg\cos\alpha = 0`)}、すなわち ${tex(String.raw`N = mg\cos\alpha`)} です（${coreDoc('analytical', 'incline_normal_force', '垂直抗力の説明')}）。`,
    `運動している系では Newton の運動方程式 ${tex(String.raw`m_i\mathbf{r}_i'' = \mathbf{F}_i + \mathbf{R}_i`)} を
      ${eq(String.raw`\mathbf{F}_i + \mathbf{R}_i - m_i\mathbf{r}_i'' = \mathbf{0}`)}
      と書き、${tex(String.raw`-m_i\mathbf{r}_i''`)} を慣性力とみて釣り合いの式にします。手順2と同じく仮想変位との内積をとって足すと、拘束力の項が消えて
      ${eq(String.raw`\sum_i \left(\mathbf{F}_i - m_i\mathbf{r}_i''\right)\cdot\delta\mathbf{r}_i = 0`)}
      です。これが d'Alembert の原理です。`,
    `支える力を外した斜面で、静止から滑る質点の位置を、斜面に沿った距離 ${tex('s')} で ${tex(String.raw`\mathbf{r} = \mathbf{r}_0 + s\,\mathbf{t}`)} と表します。${tex(String.raw`\mathbf{r}'' = s''\,\mathbf{t}`)}、${tex(String.raw`\mathbf{t}\cdot\mathbf{t} = 1`)} を d'Alembert の原理に代入すると
      ${eq(String.raw`\big[(0, -mg) - m s''\,\mathbf{t}\big]\cdot\mathbf{t}\,\delta s = 0`)}
      ${eq(String.raw`(mg\sin\alpha - m s'')\,\delta s = 0`)}
      ${eq(String.raw`s'' = g\sin\alpha`)}
      です（${coreDoc('analytical', 'incline_acceleration', '斜面の加速度の説明')}）。加速度は一定なので、${tex('s(0) = 0')}、${tex(String.raw`s'(0) = 0`)} の厳密解は2回積分して
      ${eq(String.raw`s'(t) = g\sin\alpha\; t,\qquad s(t) = \frac{1}{2} g\sin\alpha\; t^2`)}
      です。`,
    `この方程式を ${tex(String.raw`s' = v`)}、${tex(String.raw`v' = a`)}（${tex(String.raw`a = g\sin\alpha`)}）として数値で進めます。Euler 法では ${tex(String.raw`v_n = n a\Delta t`)}、${tex(String.raw`s_{n+1} = s_n + v_n\Delta t`)} なので
      ${eq(String.raw`s_n = a\Delta t^2\sum_{k=0}^{n-1} k = a\Delta t^2\,\frac{n(n-1)}{2} = \frac{1}{2} a t_n^2 - \frac{1}{2} a\Delta t\, t_n`)}
      で、差 ${tex(String.raw`-\frac{1}{2} a\Delta t\,t_n`)} が残ります。中点法と古典的RK4 は2次式を厳密に積分するので、差は 0 になります。`,
  ],
  figureAlt: '斜面上の質点に働く重力、垂直抗力、慣性力と、斜面に沿った仮想変位の矢印。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">支える力と仮想仕事</h2><div class="legend"><span><i class="numerical"></i>釣り合いの力</span><span><i class="analytical"></i>${tex(String.raw`\delta W/\delta s`)}（厳密）</span></div></div>
        <canvas id="work-chart" role="img"></canvas><p>水平に支える力 ${tex('F')}。${tex('m = 2')}、${tex('g = 9.8')}、${tex(String.raw`\alpha = 30^\circ`)} の例です。</p>
        <div class="readouts">
          <div><span>釣り合いの力 ${tex(String.raw`F = mg\tan\alpha`)}（近似）</span><output id="holding-force">—</output></div>
          <div><span>垂直抗力 ${tex('N')}（近似）</span><output id="normal-force">—</output></div>
          <div><span>${tex(String.raw`\mathbf{N}\cdot\mathbf{t}`)}（近似）</span><output id="constraint-work">—</output></div>
          <div><span>釣り合いでの ${tex(String.raw`\delta W/\delta s`)}（近似）</span><output id="balance-work">—</output></div>
        </div>
      </section>
      ${experimentPanel({
        fieldsetLabel: '斜面と質点',
        fields: [
          { name: 'mass', label: '質量', symbol: 'm', value: 2, min: 0 },
          { name: 'gravity', label: '重力加速度', symbol: 'g', value: 9.8, min: 0 },
          { name: 'angle', label: '傾き（度）', symbol: String.raw`\alpha`, value: 30, min: 0, max: 89 },
        ],
        dt: 0.01,
        steps: 200,
        sceneHeading: '斜面を滑る質点',
        sceneCaption: '点は数値解の位置、青緑の破線の輪は同じ時刻の厳密解の位置です。矢印は重力 mg、垂直抗力 N、慣性力 −ms″t、斜面に沿った仮想変位 δr です。',
        sceneLabel: 'なめらかな斜面を滑り下りる質点と、働く力の矢印',
        sceneHeight: 300,
        readouts: { position: '斜面に沿った距離 s', velocity: '速さ s′', exact: '厳密解の距離', error: '距離の差 s − s_exact' },
        plotsHeading: '斜面に沿った距離の時間変化',
        tabs: methodTabs('この方程式の数値解法'),
        plots: `<div class="plot-pair"><div><h3>距離の時間変化 ${tex('s(t)')}</h3><canvas id="time-chart" role="img"></canvas><p>時間 t</p></div><div><h3>距離の差 ${tex(String.raw`s - s_{\mathrm{exact}}`)}</h3><canvas id="error-chart" role="img"></canvas><p>時間 t</p></div></div>`,
        code: codeDisclosure('incline'),
      })}`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('m = 2')}、${tex('g = 9.8')}、${tex(String.raw`\alpha = 30^\circ`)} とします。${tex(String.raw`\sin 30^\circ = 1/2`)}、${tex(String.raw`\cos 30^\circ = \sqrt3/2`)}、${tex(String.raw`\tan 30^\circ = 1/\sqrt3`)} なので、支える力と垂直抗力は
      ${eq(String.raw`F = 2\cdot 9.8\cdot\frac{1}{\sqrt3} = \frac{19.6}{\sqrt3} \approx 11.31607,\qquad N = 2\cdot 9.8\cdot\frac{\sqrt3}{2} = 9.8\sqrt3 \approx 16.97410`)}
      です。根号の形が厳密な値で、小数は近似です。ライブラリの値は <output id="example-force">—</output> です。`,
    `支える力を外すと、加速度と時刻 ${tex('t = 2')} の距離は
      ${eq(String.raw`s'' = 9.8\cdot\frac{1}{2} = 4.9,\qquad s(2) = \frac{1}{2}\cdot 4.9\cdot 2^2 = 9.8`)}
      で、どちらも厳密です。既定の ${tex(String.raw`\Delta t = 0.01`)}、200 ステップで中点法か古典的RK4 を選び、終わりまで再生すると、計器の距離は ${tex('9.80000')} になります。`,
    `Euler 法では、手順7の式に ${tex('n = 200')} を入れて
      ${eq(String.raw`s_{200} = 4.9\cdot 0.01^2\cdot\frac{200\cdot 199}{2} = 4.9\cdot 1.99 = 9.751`)}
      です。差は ${tex(String.raw`-\frac{1}{2}\cdot 4.9\cdot 0.01\cdot 2 = -0.049`)} で、計器の差の値と一致します。`,
  ],
  related: [
    { href: './constraints.html', title: '拘束条件と一般化座標' },
    { href: './euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式' },
    { href: './constant-force.html', title: '運動方程式と一定の力' },
  ],
  footer: 'この画面の計算は、なめらかな斜面の上の一つの質点の釣り合いと運動です。',
});

const workChart = document.querySelector<HTMLCanvasElement>('#work-chart')!;
let work: LessonFigure | undefined;

function setText(id: string, value: string) {
  document.getElementById(id)!.textContent = value;
}

function paintWork() {
  if (!work) {
    clearFigure(workChart);
    return;
  }
  drawPlot(workChart, {
    label: '仮想仕事 δW/δs と、水平に支える力 F のグラフ。破線は厳密な直線、点は δW = 0 となる釣り合いの力。',
    lines: [line(work, 'work')],
    dots: [dot(work, 'balance', 'F = mg tan α')],
    zeroLabel: 'δW = 0',
  });
}

async function loadWork() {
  try {
    work = await lessonFigure('analytical/virtual-work', { mass: 2, gravity: 9.8, angle: 30 });
    const v = work.values;
    setText('holding-force', v.holding_force.toFixed(5));
    setText('normal-force', v.normal_force.toFixed(5));
    setText('constraint-work', v.constraint_work.toExponential(1));
    setText('balance-work', v.balance_work.toExponential(1));
    setText('example-force', `F ≈ ${v.holding_force.toFixed(5)}、N ≈ ${v.normal_force.toFixed(5)}`);
    paintWork();
  } catch (error) {
    console.error(error);
  }
}

const form = formReader(defaults);
let method: StepMethod = 'euler';

function paintFigures(state: Snapshot | undefined, points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'time-chart', 'error-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  const labels: Record<string, string> = { gravity: 'mg', normal: 'N', inertia: '−ms″t', displacement: 'δr' };
  drawPlot(canvases[0], {
    key: `${key}|scene`,
    label: '斜面を滑る質点。点は数値解、輪は厳密解の位置、矢印は重力、垂直抗力、慣性力、仮想変位。',
    equalAspect: true,
    lines: [line(frame, 'incline')],
    vectors: frame.arrows.map(a => ({ ...a, label: labels[a.name] })),
    dots: [{ ...dot(frame, 'exact', undefined, true), radius: 8 }, { ...dot(frame, 'block'), radius: 6 }],
  });
  const times = points.map(p => p.time);
  drawPlot(canvases[1], {
    key: `${key}|position`,
    label: '斜面に沿った距離と時間のグラフ。実線は数値解、破線は厳密解。',
    xMin: 0,
    xMax: timeEnd,
    lines: [
      { x: times, y: points.map(p => p.position), role: 'numerical' },
      { x: times, y: points.map(p => p.exact_position), role: 'exact' },
    ],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
  });
  drawPlot(canvases[2], {
    label: '数値解と厳密解の距離の差と時間のグラフ。',
    xMin: 0,
    xMax: timeEnd,
    lines: [{ x: times, y: points.map(p => p.position_error ?? Number.NaN), role: 'difference' }],
    zeroLabel: '差 0',
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-virtual-work.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return `拘束力の仮想仕事 N·δr ${v?.constraint_work.toExponential(1) ?? '—'}\n慣性力を含む仮想仕事 (mg + N − ms″t)·δr ${v?.dalembert_work.toExponential(1) ?? '—'}\n加速度 g sin α ${v?.acceleration.toFixed(5) ?? '—'}`;
  },
});
mountCodeDisclosure();
bindMethodTabs(next => {
  method = next;
  setCodeMethod(next);
  session.reloadMethod();
});
window.addEventListener('resize', paintWork);
onThemeChange(paintWork);
void loadWork();
