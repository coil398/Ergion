import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'first-principles',
  section: { label: '分子動力学' },
  title: '第一原理分子動力学',
  description: `原子核の位置を止めて電子の基底状態を解き、Hellmann–Feynman の力 ${tex(String.raw`-dU_0/dR`)} を加速度にして、原子核を速度 Verlet 法で進めます。力を経験的なポテンシャルからではなく、その配置の電子状態から計算する分子動力学を第一原理分子動力学と呼びます。`,
  equation: [
    String.raw`a = \frac{1}{\mu}\left(-\frac{dU_0}{dR}\right)`,
    String.raw`v_{n+1/2} = v_n + \tfrac{1}{2}\Delta t\, a_n, \qquad x_{n+1} = x_n + \Delta t\, v_{n+1/2}, \qquad v_{n+1} = v_{n+1/2} + \tfrac{1}{2}\Delta t\, a_{n+1}`,
  ],
  studyHeading: '電子状態の力で原子核を1ステップ進める手順',
  steps: [
    `二つの陽子と1個の電子の1次元モデルでは、核間距離 ${tex('R')} の断熱ポテンシャルは ${tex(String.raw`U_0(R) = E_0(R) + V_{nn}(R)`)} です。${tex(String.raw`E_0`)} は電子の基底状態のエネルギー、${tex(String.raw`V_{nn}`)} は原子核の反発です。原子核の運動の換算質量を ${tex(String.raw`\mu`)} とすると、加速度は
      ${eq(String.raw`a = \frac{1}{\mu}\left(-\frac{dU_0}{dR}\right)`)}
      です。正の ${tex('a')} は ${tex('R')} を増やす向きです。`,
    `Hellmann–Feynman の定理により、${tex(String.raw`dE_0/dR`)} は電子のポテンシャルを ${tex('R')} で微分した期待値です。二つの陽子が ${tex(String.raw`X = \mp R/2`)} にあるとき
      ${eq(String.raw`\frac{\partial V_{\mathrm{ext}}}{\partial R} = \frac{1}{2}\frac{\partial s}{\partial X_1} - \frac{1}{2}\frac{\partial s}{\partial X_2}`)}
      です。${tex(String.raw`s = (r^2 + a^2)^{-1/2}`)} は柔らかい Coulomb 相互作用です。核反発 ${tex(String.raw`V_{nn} = (R^2 + a^2)^{-1/2}`)} の導関数は
      ${eq(String.raw`\frac{dV_{nn}}{dR} = -R\,(R^2 + a^2)^{-3/2}`)}
      なので、${tex('R')} を増やす向きの力は
      ${eq(String.raw`-\frac{dU_0}{dR} = -\left\langle\frac{\partial V_{\mathrm{ext}}}{\partial R}\right\rangle - \frac{dV_{nn}}{dR}`)}
      です（${coreDoc('molecular', 'pair_hellmann_force', '核間距離を増やす力の説明')}）。`,
    `力を求めたあと、原子核の座標は速度 Verlet 法で進めます。今の加速度を ${tex('a_n')}、新しい位置での加速度を ${tex('a_{n+1}')} とすると
      ${eq(String.raw`v_{n+1/2} = v_n + \tfrac{1}{2}\Delta t\, a_n`)}
      ${eq(String.raw`x_{n+1} = x_n + \Delta t\, v_{n+1/2}`)}
      ${eq(String.raw`v_{n+1} = v_{n+1/2} + \tfrac{1}{2}\Delta t\, a_{n+1}`)}
      です（${coreDoc('molecular', 'born_oppenheimer_verlet_step', '1ステップの説明')}）。加速度が一定なら、この1ステップは ${tex(String.raw`x(t) = x_0 + v_0 t + \tfrac12 a t^2`)} と一致します。`,
    `同じ力を、断熱ポテンシャルの中心差分
      ${eq(String.raw`-\frac{dU_0}{dR} \approx -\frac{U_0(R + \delta) - U_0(R - \delta)}{2\delta}`)}
      と比べます（${coreDoc('molecular', 'adiabatic_force', '中心差分の説明')}）。期待値から求めた力とこの差分は、同じ格子の上では差が小さくなります。画面の二つの力とその差は、${tex('L = 20')}、${tex('N = 41')}、${tex('a = 1')}、${tex('R = 2')}、${tex(String.raw`\delta = 10^{-4}`)} の近似です。`,
  ],
  figureAlt: '加速度が −1 で一定のとき、速度 Verlet 法の位置が x = 2 − t²/2 の放物線に乗ること。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">加速度が一定のときの位置 ${tex('x(t)')}</h2></div>
        <div><h3>${tex('a = -1')}、${tex(String.raw`\Delta t = 1/2`)}、${tex('x_0 = 2')}、${tex('v_0 = 0')}</h3><canvas id="verlet-chart" role="img"></canvas><p>時刻 t。実線は速度 Verlet 法、破線は x = 2 − t²/2。</p></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `加速度が ${tex('a = -1')} で一定、${tex(String.raw`\Delta t = 1/2`)}、${tex('x_0 = 2')}、${tex('v_0 = 0')} とします。半ステップの速度は
      ${eq(String.raw`v_{1/2} = 0 + \tfrac{1}{2}\cdot\tfrac{1}{2}\cdot(-1) = -\tfrac{1}{4}`)}
      です。位置は
      ${eq(String.raw`x_1 = 2 + \tfrac{1}{2}\cdot\left(-\tfrac{1}{4}\right) = 2 - \tfrac{1}{8} = \tfrac{15}{8}`)}
      です。速度は
      ${eq(String.raw`v_1 = -\tfrac{1}{4} + \tfrac{1}{2}\cdot\tfrac{1}{2}\cdot(-1) = -\tfrac{1}{4} - \tfrac{1}{4} = -\tfrac{1}{2}`)}
      です。${tex('15/8 = 1.875')} と ${tex('-1/2')} は厳密です。画面の位置は <output id="fp-x">—</output>、速度は <output id="fp-v">—</output>、半ステップの速度は <output id="fp-half">—</output> です。同じ時刻の厳密解 ${tex(String.raw`x(1/2) = 2 - \tfrac12(1/2)^2 = 2 - 1/8`)} と一致します。`,
    `${tex('R = 2')}、${tex('a = 1')}、区間の長さ ${tex('L = 20')}、格子点 ${tex('N = 41')} で、Hellmann–Feynman の力は <output id="fp-hf">—</output>、中心差分の力は <output id="fp-ad">—</output> です。差の絶対値は <output id="fp-diff">—</output> です。どれもこの格子の近似です。`,
  ],
  related: [
    { href: './hellmann-feynman.html', title: 'Hellmann–Feynman の定理' },
    { href: './born-oppenheimer.html', title: 'Born–Oppenheimer 近似' },
    { href: './kohn-sham.html', title: '密度汎関数理論と Kohn–Sham 方程式' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
  ],
  footer: 'この画面の計算は、一定の加速度の速度 Verlet 法と、核間距離 R = 2 の力の比較です。',
});

let shown: LessonFigure | undefined;

function paint() {
  if (!shown) return;
  drawPlot(document.getElementById('verlet-chart') as HTMLCanvasElement, {
    label: '時刻に対する位置。実線は速度 Verlet 法、破線は厳密解。',
    lines: [line(shown, 'verlet', 'Verlet'), line(shown, 'exact', '厳密解')],
    xMin: 0,
    xMax: 1,
    yMin: 1.4,
    yMax: 2.1,
  });
}

async function load() {
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('md/first-principles');
    shown = figure;
    const v = figure.values;
    document.getElementById('fp-x')!.textContent = fixed(v.x1, 6);
    document.getElementById('fp-v')!.textContent = fixed(v.v1, 6);
    document.getElementById('fp-half')!.textContent = fixed(v.half, 6);
    document.getElementById('fp-hf')!.textContent = fixed(v.hellmann, 6);
    document.getElementById('fp-ad')!.textContent = fixed(v.adiabatic, 6);
    document.getElementById('fp-diff')!.textContent = fixed(v.difference, 6);
    paint();
    setStatus('finished');
  } catch (error) {
    console.error(error);
    setStatus('error');
  }
}

load();
window.addEventListener('resize', paint);
onThemeChange(paint);
