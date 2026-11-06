import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { dot, eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'hellmann-feynman',
  section: { label: '分子動力学' },
  title: 'Hellmann–Feynman の定理',
  description: `電子の基底状態のエネルギー ${tex('E_0')} を原子核の座標で微分すると、波動関数の微分は打ち消し、ポテンシャルをその座標で微分した期待値だけが残ります。このページは、1個の電子と1個の原子核を直線の上に置いた柔らかい Coulomb 相互作用で、その力を手で計算します。`,
  equation: [
    String.raw`F = -\frac{\partial V}{\partial X} = Z\, r\,(r^2 + a^2)^{-3/2}, \qquad r = x - X`,
  ],
  studyHeading: 'ポテンシャルの偏導関数から力を求める手順',
  steps: [
    `原子単位 ${tex(String.raw`\hbar = m_e = e = 1`)} を使います。電子の座標を ${tex('x')}、原子核の座標を ${tex('X')}、原子核の電荷を ${tex('Z')}、軟化の長さを ${tex('a')} とします。柔らかい Coulomb 相互作用は
      ${eq(String.raw`s = (r^2 + a^2)^{-1/2}, \qquad r = x - X`)}
      です。電子が原子核に及ぼすポテンシャルは ${tex('V = -Z s')} です（${coreDoc('molecular', 'soft_coulomb_d_d_nucleus', '偏導関数の説明')}）。`,
    `${tex('s')} を ${tex('r')} で微分します。${tex(String.raw`s = (r^2 + a^2)^{-1/2}`)} の合成関数の微分は
      ${eq(String.raw`\frac{\partial s}{\partial r} = -\frac{1}{2}(r^2 + a^2)^{-3/2}\cdot 2r = -r\,(r^2 + a^2)^{-3/2}`)}
      です。${tex('r = x - X')} なので ${tex(String.raw`\partial r/\partial X = -1`)} です。連鎖律で
      ${eq(String.raw`\frac{\partial s}{\partial X} = \frac{\partial s}{\partial r}\cdot\frac{\partial r}{\partial X} = \big(-r\,(r^2 + a^2)^{-3/2}\big)\cdot(-1) = r\,(r^2 + a^2)^{-3/2}`)}
      です。`,
    `${tex('V = -Z s')} を ${tex('X')} で微分します。
      ${eq(String.raw`\frac{\partial V}{\partial X} = -Z\,\frac{\partial s}{\partial X} = -Z\, r\,(r^2 + a^2)^{-3/2}`)}
      原子核の座標 ${tex('X')} を増やす向きの力は、ポテンシャルの傾きの逆です。
      ${eq(String.raw`F = -\frac{\partial V}{\partial X} = Z\, r\,(r^2 + a^2)^{-3/2}`)}
      です（${coreDoc('molecular', 'point_hellmann_force', '点状の電子による力の説明')}）。${tex('F < 0')} のときは、原子核を ${tex('X')} の小さい側、電子のある側へ引きます。`,
    `波動関数に広がった電子では、同じ偏導関数の期待値が力になります。最後の証明のとおり、正規化された固有関数 ${tex(String.raw`\psi`)} について
      ${eq(String.raw`\frac{dE}{dX} = \left\langle \psi \middle| \frac{\partial \hat H}{\partial X} \middle| \psi \right\rangle`)}
      です。運動エネルギーは ${tex('X')} を含まないので、${tex(String.raw`\partial \hat H/\partial X = \partial V/\partial X`)} です。`,
  ],
  figureAlt: '電子が原点にあるとき、原子核の座標 X に対する Hellmann–Feynman の力と、X = 1 で F = −√2/4 になる点。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">原子核が受ける力 ${tex('F(X)')}</h2></div>
        <div><h3>電子は ${tex('x = 0')}、${tex('Z = 1')}、${tex('a = 1')}</h3><canvas id="force-chart" role="img"></canvas><p>原子核の座標 X。点は X = 1 の例。</p></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('x = 0')}、${tex('X = 1')}、${tex('Z = 1')}、${tex('a = 1')} とします。差と分母は
      ${eq(String.raw`r = 0 - 1 = -1, \qquad r^2 + a^2 = 1 + 1 = 2`)}
      ${eq(String.raw`(r^2 + a^2)^{3/2} = 2^{3/2} = 2\sqrt{2}`)}
      です。力は
      ${eq(String.raw`F = Z\, r\,(r^2 + a^2)^{-3/2} = 1\cdot(-1)\cdot\frac{1}{2\sqrt{2}} = -\frac{1}{2\sqrt{2}}`)}
      です。分母を有理化します。
      ${eq(String.raw`\frac{1}{2\sqrt{2}} = \frac{\sqrt{2}}{2\sqrt{2}\cdot\sqrt{2}} = \frac{\sqrt{2}}{4}`)}
      したがって ${tex(String.raw`F = -\sqrt{2}/4`)} です。この値は厳密です。画面の力は <output id="hf-force">—</output> で、${tex(String.raw`-\sqrt{2}/4`)} を小数にした近似です。負号は、原点の電子が ${tex('X = 1')} の原子核を左へ引くことを表します。`,
  ],
  related: [
    { href: './born-oppenheimer.html', title: 'Born–Oppenheimer 近似' },
    { href: './kohn-sham.html', title: '密度汎関数理論と Kohn–Sham 方程式' },
    { href: './first-principles.html', title: '第一原理分子動力学' },
  ],
  footer: 'この画面の計算は、1個の電子が1個の原子核に及ぼす力です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`\hat H(\lambda)`)} が実数のパラメータ ${tex(String.raw`\lambda`)} に依存するエルミート演算子で、${tex(String.raw`\hat H(\lambda)\psi = E(\lambda)\psi`)}、${tex(String.raw`\langle\psi|\psi\rangle = 1`)} とします。このとき ${tex(String.raw`dE/d\lambda = \langle\psi|\partial\hat H/\partial\lambda|\psi\rangle`)} です。`,
    proof: [
      `正規化 ${tex(String.raw`\langle\psi|\psi\rangle = 1`)} から ${tex(String.raw`E(\lambda) = \langle\psi|\hat H(\lambda)|\psi\rangle`)} です。積の微分で
        ${eq(String.raw`\frac{dE}{d\lambda} = \left\langle\frac{\partial\psi}{\partial\lambda}\middle|\hat H\middle|\psi\right\rangle + \left\langle\psi\middle|\frac{\partial\hat H}{\partial\lambda}\middle|\psi\right\rangle + \left\langle\psi\middle|\hat H\middle|\frac{\partial\psi}{\partial\lambda}\right\rangle`)}
        です。`,
      `${tex(String.raw`\hat H`)} はエルミートで ${tex(String.raw`\hat H\psi = E\psi`)} なので、第1項と第3項は
        ${eq(String.raw`E\left\langle\frac{\partial\psi}{\partial\lambda}\middle|\psi\right\rangle + E\left\langle\psi\middle|\frac{\partial\psi}{\partial\lambda}\right\rangle = E\,\frac{d}{d\lambda}\langle\psi|\psi\rangle`)}
        です。`,
      `${tex(String.raw`\langle\psi|\psi\rangle = 1`)} は ${tex(String.raw`\lambda`)} によらないので、その導関数は 0 です。残るのは
        ${eq(String.raw`\frac{dE}{d\lambda} = \left\langle\psi\middle|\frac{\partial\hat H}{\partial\lambda}\middle|\psi\right\rangle`)}
        です。`,
    ],
  }]),
});

let shown: LessonFigure | undefined;

function paint() {
  if (!shown) return;
  drawPlot(document.getElementById('force-chart') as HTMLCanvasElement, {
    label: '原子核の座標に対する Hellmann–Feynman の力。点は X = 1 の例。',
    lines: [line(shown, 'force', 'F')],
    dots: [dot(shown, 'example', 'X = 1')],
    xMin: 0.25,
    xMax: 4,
    yMin: -1.2,
    yMax: 0.2,
    zeroLabel: 'F = 0',
  });
}

async function load() {
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('md/hellmann-feynman');
    shown = figure;
    document.getElementById('hf-force')!.textContent = fixed(figure.values.force, 12);
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
