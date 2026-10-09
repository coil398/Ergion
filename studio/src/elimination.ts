import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fullNumber, texAugmented } from './figures/linalg';
import { dot, eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'elimination',
  section: { label: '線形代数' },
  title: '連立1次方程式と消去法',
  description: `正則な ${tex('n \\times n')} 行列 ${tex('A')} と定数ベクトル ${tex(String.raw`\mathbf{b}`)} から、連立1次方程式 ${tex(String.raw`A\mathbf{x} = \mathbf{b}`)} の解を拡大係数行列の行基本変形で求めます。前進消去で上三角の形にし、後退代入で下の未知数から順に決めます。`,
  equation: [String.raw`A\mathbf{x} = \mathbf{b}`, String.raw`[A \mid \mathbf{b}] \;\longrightarrow\; [U \mid \mathbf{c}]`],
  studyHeading: '前進消去と後退代入の手順',
  steps: [
    `記号を定めます。${tex('A = (a_{ij})')} は ${tex('n \\times n')} の正則な係数行列、${tex(String.raw`\mathbf{x} = (x_1, \ldots, x_n)^T`)} は未知数のベクトル、${tex(String.raw`\mathbf{b} = (b_1, \ldots, b_n)^T`)} は定数ベクトルです。${tex(String.raw`A`)} が正則なので解はただ一つです。右に ${tex(String.raw`\mathbf{b}`)} を付けた行列 ${tex(String.raw`[A \mid \mathbf{b}]`)} を拡大係数行列と呼び、その第 ${tex('i')} 行を ${tex('R_i')} と書きます。二つの行を入れ替える、ある行に 0 でない数を掛ける、ある行に別の行の定数倍を加える、の三つを行基本変形と呼びます。どれも逆の変形で元に戻せるので、連立方程式の解を変えません。`,
    `例として、次の3元の連立方程式を解きます。
      ${eq(String.raw`\begin{aligned} 2x_1 + x_2 - x_3 &= 8 \\ -3x_1 - x_2 + 2x_3 &= -11 \\ -2x_1 + x_2 + 2x_3 &= -3 \end{aligned}`)}
      拡大係数行列は
      ${eq(String.raw`[A \mid \mathbf{b}] = \left(\begin{array}{rrr|r} 2 & 1 & -1 & 8 \\ -3 & -1 & 2 & -11 \\ -2 & 1 & 2 & -3 \end{array}\right)`)}
      です。`,
    `前進消去の第1段では、軸（ピボット）${tex('a_{11} = 2')} を使って第1列の下の成分を 0 にします。乗数は ${tex(String.raw`m_{i1} = a_{i1}/a_{11}`)} です。
      ${eq(String.raw`m_{21} = \frac{-3}{2} = -\frac{3}{2}, \qquad m_{31} = \frac{-2}{2} = -1`)}
      各行から、乗数を掛けた第1行を引きます。${tex(String.raw`-m_{21} = \tfrac{3}{2}`)} なので、第2行には第1行の ${tex(String.raw`\tfrac{3}{2}`)} 倍を加えます。
      ${eq(String.raw`R_2 - m_{21} R_1 = (-3,\ -1,\ 2 \mid -11) + \tfrac{3}{2}(2,\ 1,\ -1 \mid 8)`)}
      ${eq(String.raw`= (-3,\ -1,\ 2 \mid -11) + (3,\ \tfrac{3}{2},\ -\tfrac{3}{2} \mid 12)`)}
      ${eq(String.raw`= (-3 + 3,\ -1 + \tfrac{3}{2},\ 2 - \tfrac{3}{2} \mid -11 + 12) = (0,\ \tfrac{1}{2},\ \tfrac{1}{2} \mid 1)`)}
      ${tex(String.raw`-m_{31} = 1`)} なので、第3行には第1行をそのまま加えます。
      ${eq(String.raw`R_3 - m_{31} R_1 = (-2,\ 1,\ 2 \mid -3) + (2,\ 1,\ -1 \mid 8)`)}
      ${eq(String.raw`= (-2 + 2,\ 1 + 1,\ 2 - 1 \mid -3 + 8) = (0,\ 2,\ 1 \mid 5)`)}
      第1段のあとの拡大係数行列は
      ${eq(String.raw`\left(\begin{array}{rrr|r} 2 & 1 & -1 & 8 \\ 0 & \tfrac{1}{2} & \tfrac{1}{2} & 1 \\ 0 & 2 & 1 & 5 \end{array}\right)`)}
      です。`,
    `第2段の軸は ${tex(String.raw`\tfrac{1}{2}`)} です。乗数と行基本変形は
      ${eq(String.raw`m_{32} = \frac{2}{1/2} = 4`)}
      ${eq(String.raw`R_3 - m_{32} R_2 = (0,\ 2,\ 1 \mid 5) - 4\,(0,\ \tfrac{1}{2},\ \tfrac{1}{2} \mid 1)`)}
      ${eq(String.raw`= (0,\ 2,\ 1 \mid 5) - (0,\ 2,\ 2 \mid 4)`)}
      ${eq(String.raw`= (0 - 0,\ 2 - 2,\ 1 - 2 \mid 5 - 4) = (0,\ 0,\ -1 \mid 1)`)}
      で、左が上三角行列 ${tex('U')} の形になります。
      ${eq(String.raw`[U \mid \mathbf{c}] = \left(\begin{array}{rrr|r} 2 & 1 & -1 & 8 \\ 0 & \tfrac{1}{2} & \tfrac{1}{2} & 1 \\ 0 & 0 & -1 & 1 \end{array}\right)`)}`,
    `後退代入では、下の行から未知数を一つずつ決めます。一般の形は
      ${eq(String.raw`x_i = \frac{1}{u_{ii}}\left(c_i - \sum_{j=i+1}^{n} u_{ij} x_j\right) \qquad (i = n, n-1, \ldots, 1)`)}
      です。第3行、第2行、第1行の順に代入します。第3行は ${tex('-x_3 = 1')}、第2行は ${tex(String.raw`\tfrac{1}{2}x_2 + \tfrac{1}{2}x_3 = 1`)}、第1行は ${tex('2x_1 + x_2 - x_3 = 8')} です。
      ${eq(String.raw`x_3 = \frac{1}{-1} = -1`)}
      ${eq(String.raw`x_2 = \frac{1 - \tfrac{1}{2}x_3}{1/2} = \frac{1 - \tfrac{1}{2}\cdot(-1)}{1/2} = \frac{3/2}{1/2} = 3`)}
      ${eq(String.raw`x_1 = \frac{8 - x_2 + x_3}{2} = \frac{8 - 3 + (-1)}{2} = \frac{4}{2} = 2`)}
      解は ${tex(String.raw`\mathbf{x} = (2,\ 3,\ -1)^T`)} で、これは厳密な値です（${coreDoc('linalg', 'gauss_eliminate', '消去法の説明')}、${coreDoc('linalg', 'back_substitution', '後退代入の説明')}）。`,
    `軸が他の成分にくらべて極端に小さいと、乗数が大きくなり、計算の誤差が増えます。${tex(String.raw`\varepsilon`)} を小さな正の数として
      ${eq(String.raw`\left(\begin{array}{rr|r} \varepsilon & 1 & 1 \\ 1 & 1 & 2 \end{array}\right)`)}
      を消去します。乗数は ${tex(String.raw`m_{21} = 1/\varepsilon`)} で、
      ${eq(String.raw`R_2 - \frac{1}{\varepsilon}R_1 = \left(1 - \frac{1}{\varepsilon}\cdot\varepsilon,\ 1 - \frac{1}{\varepsilon}\cdot 1 \;\middle|\; 2 - \frac{1}{\varepsilon}\cdot 1\right) = \left(0,\ 1 - \frac{1}{\varepsilon} \;\middle|\; 2 - \frac{1}{\varepsilon}\right)`)}
      となります。後退代入で厳密解を求めると、分子と分母に ${tex(String.raw`\varepsilon`)} を掛けて
      ${eq(String.raw`x_2 = \frac{2 - 1/\varepsilon}{1 - 1/\varepsilon} = \frac{2\varepsilon - 1}{\varepsilon - 1} = \frac{1 - 2\varepsilon}{1 - \varepsilon}`)}
      第1行 ${tex(String.raw`\varepsilon x_1 + x_2 = 1`)} から
      ${eq(String.raw`x_1 = \frac{1 - x_2}{\varepsilon} = \frac{1}{\varepsilon}\cdot\frac{(1 - \varepsilon) - (1 - 2\varepsilon)}{1 - \varepsilon} = \frac{1}{\varepsilon}\cdot\frac{\varepsilon}{1 - \varepsilon} = \frac{1}{1 - \varepsilon}`)}
      で、${tex(String.raw`\varepsilon = 10^{-17}`)} ではどちらも 1 との差が ${tex('10^{-17}')} 程度です。有効数字が約16桁の計算では、${tex('1 - 10^{17}')} と ${tex('2 - 10^{17}')} はどちらも ${tex('-10^{17}')} になり、${tex('x_2 = 1')}、${tex(String.raw`x_1 = (1 - 1)/\varepsilon = 0`)} という誤った値が出ます。`,
    `部分ピボット選択では、第 ${tex('k')} 段の前に、第 ${tex('k')} 列の対角から下で絶対値が最大の成分を持つ行を第 ${tex('k')} 行と入れ替えます。上の例では第1行と第2行を入れ替え、
      ${eq(String.raw`\left(\begin{array}{rr|r} 1 & 1 & 2 \\ \varepsilon & 1 & 1 \end{array}\right)`)}
      です。乗数と行基本変形は
      ${eq(String.raw`m_{21} = \frac{\varepsilon}{1} = \varepsilon`)}
      ${eq(String.raw`R_2 - \varepsilon R_1 = (\varepsilon - \varepsilon\cdot 1,\ 1 - \varepsilon\cdot 1 \mid 1 - \varepsilon\cdot 2) = (0,\ 1 - \varepsilon \mid 1 - 2\varepsilon)`)}
      となります。乗数の絶対値は 1 以下で、${tex(String.raw`x_2 = \frac{1 - 2\varepsilon}{1 - \varepsilon}`)}、${tex('x_1 = 2 - x_2')} はどちらも 1 に近い正しい近似値です。3元の例では、第1段で第1列の絶対値が最大の ${tex('-3')} を持つ第2行が上に来ます。この行の入れ替えを記録したものが LU 分解の置換行列 ${tex('P')} です。`,
    `近似解 ${tex(String.raw`\mathbf{x}`)} の良さは、残差ノルム
      ${eq(String.raw`\|A\mathbf{x} - \mathbf{b}\| = \sqrt{\sum_{i=1}^{n}\Big(\sum_{j=1}^{n} a_{ij}x_j - b_i\Big)^2}`)}
      で測ります（${coreDoc('linalg', 'residual_norm', '残差ノルムの説明')}）。厳密解では 0 です。`,
  ],
  figureAlt: '3枚の平面が一点で交わる配置と、前進消去で下三角の成分が 0 になっていく拡大係数行列の図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">各式の直線と連立方程式の解</h2><div class="legend"><span><i class="numerical"></i>計算した解</span><span><i class="analytical"></i>厳密解</span></div></div>
      ${methodTabs('消去の軸の選び方', [{ id: 'no-pivot', label: 'ピボット選択なし' }, { id: 'partial-pivot', label: '部分ピボット選択' }])}
      <div class="plot-pair">
        <div><h3>3元の例の各平面の切り口（${tex('x_3 = -1')}）</h3><canvas id="trace-chart" role="img"></canvas><p>横軸 ${tex('x_1')}、縦軸 ${tex('x_2')}</p></div>
        <div><h3>${tex(String.raw`\varepsilon = 10^{-17}`)} の2元の例の2直線</h3><canvas id="eps-chart" role="img"></canvas><p>横軸 ${tex('x_1')}、縦軸 ${tex('x_2')}</p></div>
      </div>
      <div class="readouts">
        <div><span>3元の例の解 x（近似）</span><output id="x3">—</output></div>
        <div><span>3元の例の残差 ‖Ax − b‖（近似）</span><output id="residual3">—</output></div>
        <div><span>ε の例の解 x（近似）</span><output id="eps-x">—</output></div>
        <div><span>ε の例の残差 ‖Ax − b‖（近似）</span><output id="eps-residual">—</output></div>
      </div>
      <p>選んだ方法で前進消去を終えた拡大係数行列（近似）。上は3元の例、下は ε の例です。</p>
      <div class="solution-equation" id="upper3">—</div>
      <div class="solution-equation" id="eps-upper">—</div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `3元の例の解 ${tex(String.raw`\mathbf{x} = (2, 3, -1)^T`)} を元の3式に代入します。
      ${eq(String.raw`2\cdot 2 + 3 - (-1) = 8, \qquad -3\cdot 2 - 3 + 2\cdot(-1) = -11, \qquad -2\cdot 2 + 3 + 2\cdot(-1) = -3`)}
      三つとも右辺に等しいので、残差は厳密に 0 です。ピボット選択なしでは、画面の解は (2, 3, −1)、残差は 0 です。部分ピボット選択では、画面の解は (2, 3, −1) に近い近似値で、残差は ${tex(String.raw`10^{-15}`)} 程度です。`,
    `${tex(String.raw`\varepsilon`)} の例で、ピボット選択なしの近似解 ${tex('(x_1, x_2) = (0, 1)')} を代入すると
      ${eq(String.raw`\varepsilon \cdot 0 + 1 = 1, \qquad 0 + 1 = 1 \neq 2`)}
      です。第1式は満たしますが第2式は 1 だけずれ、残差は ${tex(String.raw`\sqrt{0^2 + 1^2} = 1`)} です。部分ピボット選択の近似解 ${tex('(1, 1)')} では、残差は ${tex(String.raw`|\varepsilon \cdot 1 + 1 - 1| = 10^{-17}`)} 程度で、画面では 0 と表示されます。`,
  ],
  related: [
    { href: './lu.html', title: 'LU 分解' },
    { href: './least-squares.html', title: '最小二乗法' },
    { href: './system.html', title: '連立1階' },
  ],
  footer: 'この画面の計算は、3元と2元の連立1次方程式の Gauss の消去法です。',
});

let method = 'no-pivot';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const trace = document.getElementById('trace-chart') as HTMLCanvasElement;
  const eps = document.getElementById('eps-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(trace);
    clearFigure(eps);
    return;
  }
  const figure = current;
  drawPlot(trace, {
    label: '3元の例の各平面を x3 = −1 で切った3本の直線。3本は計算した解で交わる。',
    lines: [line(figure, 'trace-1', '(1)'), line(figure, 'trace-2', '(2)'), line(figure, 'trace-3', '(3)')],
    dots: [dot(figure, 'solution-exact', undefined, true), dot(figure, 'solution')],
    xMin: 0.5,
    xMax: 3.5,
    yMin: 0,
    yMax: 6,
  });
  drawPlot(eps, {
    label: 'ε x1 + x2 = 1 と x1 + x2 = 2 の2直線、厳密解と計算した解。',
    lines: [line(figure, 'eps-line-1', '(1)'), line(figure, 'eps-line-2', '(2)')],
    dots: [dot(figure, 'eps-exact', undefined, true), dot(figure, 'eps-computed', 'x')],
    xMin: -0.5,
    xMax: 2.5,
    yMin: -0.5,
    yMax: 2.5,
    equalAspect: true,
  });
}

function fill() {
  if (!current) return;
  const { arrays, values } = current;
  show('x3', `(${arrays.x3.map(fullNumber).join(', ')})`);
  show('residual3', fullNumber(values.residual3));
  show('eps-x', `(${arrays.eps_x.map(fullNumber).join(', ')})`);
  show('eps-residual', fullNumber(values.eps_residual));
  document.getElementById('upper3')!.innerHTML = tex(String.raw`[U \mid \mathbf{c}] = ${texAugmented(arrays.upper3, 3, 3)}`, true);
  document.getElementById('eps-upper')!.innerHTML = tex(texAugmented(arrays.eps_upper, 2, 2), true);
}

async function load() {
  try {
    current = await lessonFigure('linalg/elimination', { method });
    fill();
    paint();
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

bindMethodTabs<string>(next => {
  method = next;
  void load();
});
window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
