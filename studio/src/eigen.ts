import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fullNumber, plainNumber } from './figures/linalg';
import { eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'eigen',
  section: { label: '線形代数' },
  title: '固有値と固有ベクトル',
  description: `正方行列 ${tex('A')} が向きを変えずに定数倍だけするベクトル ${tex(String.raw`\mathbf{v} \neq \mathbf{0}`)} を固有ベクトル、その倍率 ${tex(String.raw`\lambda`)} を固有値と呼びます。2行2列の行列で特性方程式から厳密な値を求め、ベキ乗法と QR 法の反復がその値に近づく速さを確かめます。`,
  equation: [String.raw`A\mathbf{v} = \lambda\mathbf{v}`, String.raw`\det(A - \lambda I) = 0`],
  studyHeading: '特性方程式から固有値と固有ベクトルへの手順',
  steps: [
    `記号を定めます。${tex('A')} は ${tex('n \\times n')} の実行列、${tex('I')} は単位行列、${tex(String.raw`\lambda`)} は数、${tex(String.raw`\mathbf{v}`)} は零でないベクトルです。${tex(String.raw`A\mathbf{v} = \lambda\mathbf{v}`)} は ${tex(String.raw`(A - \lambda I)\mathbf{v} = \mathbf{0}`)} と同じで、零でない解 ${tex(String.raw`\mathbf{v}`)} があるのは ${tex(String.raw`A - \lambda I`)} が正則でないとき、すなわち
      ${eq(String.raw`\det(A - \lambda I) = 0`)}
      のときです。これを特性方程式と呼びます。`,
    `例として ${tex(String.raw`A = \begin{pmatrix} 1 & 1 \\ 4 & 1 \end{pmatrix}`)} をとります。2行2列の行列式 ${tex(String.raw`\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc`)} を定義どおりに展開します。
      ${eq(String.raw`\det(A - \lambda I) = \det\begin{pmatrix} 1-\lambda & 1 \\ 4 & 1-\lambda \end{pmatrix} = (1-\lambda)(1-\lambda) - 1 \cdot 4`)}
      括弧を外すと
      ${eq(String.raw`= 1 - 2\lambda + \lambda^2 - 4`)}
      同類項をまとめると
      ${eq(String.raw`= \lambda^2 - 2\lambda - 3`)}
      積が ${tex('-3')}、和が ${tex('-2')} の二つの数 ${tex('-3')} と ${tex('1')} で因数分解すると
      ${eq(String.raw`= (\lambda - 3)(\lambda + 1)`)}
      です。これが 0 になるので、固有値は ${tex(String.raw`\lambda_1 = 3`)}、${tex(String.raw`\lambda_2 = -1`)} で、どちらも厳密な値です（${coreDoc('linalg', 'eigenvalues_2x2', '固有値の解の公式の説明')}）。和 ${tex(String.raw`\lambda_1 + \lambda_2 = 2`)} は対角成分の和 ${tex(String.raw`\operatorname{tr} A`)}、積 ${tex(String.raw`\lambda_1\lambda_2 = -3`)} は ${tex(String.raw`\det A`)} に等しくなります。`,
    `固有ベクトルは ${tex(String.raw`(A - \lambda I)\mathbf{v} = \mathbf{0}`)} の解です。${tex(String.raw`\lambda_1 = 3`)} では
      ${eq(String.raw`A - 3I = \begin{pmatrix} 1-3 & 1 \\ 4 & 1-3 \end{pmatrix} = \begin{pmatrix} -2 & 1 \\ 4 & -2 \end{pmatrix}`)}
      ${eq(String.raw`\begin{pmatrix} -2 & 1 \\ 4 & -2 \end{pmatrix}\begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} -2v_1 + v_2 \\ 4v_1 - 2v_2 \end{pmatrix} = \mathbf{0}`)}
      です。第2行は第1行の ${tex('-2')} 倍なので、式は ${tex('-2v_1 + v_2 = 0')}、すなわち ${tex('v_2 = 2v_1')} の一本だけです。${tex('v_1 = 1')} と選ぶと ${tex(String.raw`\mathbf{v}_1 = (1, 2)^T`)} です。${tex(String.raw`\lambda_2 = -1`)} では
      ${eq(String.raw`A + I = \begin{pmatrix} 1+1 & 1 \\ 4 & 1+1 \end{pmatrix} = \begin{pmatrix} 2 & 1 \\ 4 & 2 \end{pmatrix}`)}
      ${eq(String.raw`\begin{pmatrix} 2 & 1 \\ 4 & 2 \end{pmatrix}\begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} 2v_1 + v_2 \\ 4v_1 + 2v_2 \end{pmatrix} = \mathbf{0}`)}
      で、第2行は第1行の2倍なので ${tex('v_2 = -2v_1')} です。${tex('v_1 = 1')} と選ぶと ${tex(String.raw`\mathbf{v}_2 = (1, -2)^T`)} です（${coreDoc('linalg', 'eigenvector_2x2', '固有ベクトルの説明')}）。定数倍したベクトルも固有ベクトルです。`,
    `単位円の上の点 ${tex(String.raw`\mathbf{u} = (\cos\theta, \sin\theta)^T`)} を ${tex('A')} で写すと、像 ${tex(String.raw`A\mathbf{u}`)} は楕円を描きます。固有ベクトルの向きの点だけは、像が同じ直線の上にあり、長さが ${tex(String.raw`|\lambda|`)} 倍になります。${tex(String.raw`\mathbf{v}_1`)} の向きは3倍に伸び、${tex(String.raw`\mathbf{v}_2`)} の向きは長さを保って逆向きになります。この ${tex('A')} は対称でないので、楕円の長軸と短軸の向きは固有ベクトルの向きとは一致しません。`,
    `ベキ乗法は、ベクトルに ${tex('A')} を掛けて長さ 1 に戻すことを繰り返します。
      ${eq(String.raw`\mathbf{x}_{k+1} = \frac{A\mathbf{x}_k}{\|A\mathbf{x}_k\|}, \qquad \lambda^{(k)} = \frac{\mathbf{x}_k^T A\mathbf{x}_k}{\mathbf{x}_k^T\mathbf{x}_k}`)}
      ${tex(String.raw`\lambda^{(k)}`)} を Rayleigh 商と呼びます（${coreDoc('linalg', 'power_iteration', 'ベキ乗法の説明')}）。初期ベクトル ${tex(String.raw`\mathbf{x}_0 \propto (1, 1)^T`)} を固有ベクトルで表すと
      ${eq(String.raw`\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \frac{3}{4}\begin{pmatrix} 1 \\ 2 \end{pmatrix} + \frac{1}{4}\begin{pmatrix} 1 \\ -2 \end{pmatrix}`)}
      です。両辺の係数は ${tex(String.raw`\tfrac{3}{4} + \tfrac{1}{4} = 1`)}、${tex(String.raw`\tfrac{3}{4}\cdot 2 + \tfrac{1}{4}\cdot(-2) = 1`)} で確かめられます。${tex(String.raw`A^k\mathbf{v}_1 = 3^k\mathbf{v}_1`)}、${tex(String.raw`A^k\mathbf{v}_2 = (-1)^k\mathbf{v}_2`)} なので、${tex('A')} を ${tex('k')} 回掛けると
      ${eq(String.raw`A^k\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \frac{3}{4}\,3^k\mathbf{v}_1 + \frac{1}{4}(-1)^k\mathbf{v}_2 = 3^k\left(\frac{3}{4}\mathbf{v}_1 + \frac{1}{4}\Big(-\frac{1}{3}\Big)^k\mathbf{v}_2\right)`)}
      です。${tex(String.raw`\mathbf{v}_2`)} の成分は1回ごとに ${tex(String.raw`|\lambda_2/\lambda_1| = 1/3`)} 倍になり、${tex(String.raw`\mathbf{x}_k`)} の向きは ${tex(String.raw`\mathbf{v}_1`)} に、${tex(String.raw`\lambda^{(k)}`)} は ${tex(String.raw`\lambda_1 = 3`)} に近づきます。`,
    `QR 法は、${tex('A_0 = A')} から始めて、${tex('A_k')} を直交行列 ${tex('Q_k')} と上三角行列 ${tex('R_k')} の積に分け、順を入れ替えて掛けます。
      ${eq(String.raw`A_k = Q_k R_k, \qquad A_{k+1} = R_k Q_k = Q_k^T A_k Q_k`)}
      ${tex('A_{k+1}')} は ${tex('A_k')} と相似なので固有値は変わりません。第1段を Gram–Schmidt 法で計算します。第1列 ${tex('(1, 4)^T')} の長さは ${tex(String.raw`\sqrt{17}`)} で、
      ${eq(String.raw`r_{11} = \sqrt{1^2 + 4^2} = \sqrt{17}, \qquad \mathbf{q}_1 = \frac{1}{\sqrt{17}}\begin{pmatrix} 1 \\ 4 \end{pmatrix}`)}
      第2列 ${tex('(1, 1)^T')} の ${tex(String.raw`\mathbf{q}_1`)} 方向の成分を求めて引きます。
      ${eq(String.raw`r_{12} = \mathbf{q}_1^T\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \frac{1 \cdot 1 + 4 \cdot 1}{\sqrt{17}} = \frac{5}{\sqrt{17}}`)}
      ${eq(String.raw`\begin{pmatrix} 1 \\ 1 \end{pmatrix} - r_{12}\mathbf{q}_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix} - \frac{5}{17}\begin{pmatrix} 1 \\ 4 \end{pmatrix} = \frac{1}{17}\begin{pmatrix} 17 - 5 \\ 17 - 20 \end{pmatrix} = \frac{3}{17}\begin{pmatrix} 4 \\ -1 \end{pmatrix}`)}
      この長さが ${tex('r_{22}')} で、長さ 1 にしたものが ${tex(String.raw`\mathbf{q}_2`)} です。
      ${eq(String.raw`r_{22} = \frac{3}{17}\sqrt{4^2 + 1^2} = \frac{3\sqrt{17}}{17} = \frac{3}{\sqrt{17}}, \qquad \mathbf{q}_2 = \frac{1}{\sqrt{17}}\begin{pmatrix} 4 \\ -1 \end{pmatrix}`)}
      列を並べると
      ${eq(String.raw`Q_0 = \frac{1}{\sqrt{17}}\begin{pmatrix} 1 & 4 \\ 4 & -1 \end{pmatrix}, \qquad R_0 = \begin{pmatrix} r_{11} & r_{12} \\ 0 & r_{22} \end{pmatrix} = \frac{1}{\sqrt{17}}\begin{pmatrix} 17 & 5 \\ 0 & 3 \end{pmatrix}`)}
      です。順を入れ替えて掛けると
      ${eq(String.raw`A_1 = R_0 Q_0 = \frac{1}{17}\begin{pmatrix} 17 \cdot 1 + 5 \cdot 4 & 17 \cdot 4 + 5 \cdot (-1) \\ 0 \cdot 1 + 3 \cdot 4 & 0 \cdot 4 + 3 \cdot (-1) \end{pmatrix} = \frac{1}{17}\begin{pmatrix} 37 & 63 \\ 12 & -3 \end{pmatrix}`)}
      です（${coreDoc('linalg', 'qr_iteration', 'QR 法の説明')}）。対角成分の和は ${tex(String.raw`\tfrac{37 - 3}{17} = 2`)}、行列式は ${tex(String.raw`\tfrac{37 \cdot (-3) - 63 \cdot 12}{17^2} = \tfrac{-111 - 756}{289} = \tfrac{-867}{289} = -3`)} で、${tex('A')} と同じです。反復を続けると、左下の成分は1回ごとにおよそ ${tex('1/3')} 倍になって 0 に近づき、対角成分は ${tex('3')} と ${tex('-1')} に近づきます。`,
  ],
  figureAlt: '単位円が行列 A で楕円に写され、固有ベクトルの向きだけが固有値倍に伸び縮みする図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">単位円の像と固有値の推定値の誤差</h2><div class="legend"><span><i class="numerical"></i>計算した値</span><span><i class="difference"></i>QR 法の左下の成分</span></div></div>
      ${methodTabs('固有値の反復解法', [{ id: 'power', label: 'ベキ乗法' }, { id: 'qr', label: 'QR 法' }])}
      <div class="plot-pair">
        <div><h3>単位円 ${tex(String.raw`\mathbf{u}`)} とその像 ${tex(String.raw`A\mathbf{u}`)}</h3><canvas id="map-chart" role="img"></canvas><p>横軸は第1成分、縦軸は第2成分。橙の矢印は固有ベクトルの像</p></div>
        <div><h3>推定値の誤差 ${tex(String.raw`|\lambda^{(k)} - 3|`)}</h3><canvas id="error-chart" role="img"></canvas><p>反復の回数 ${tex('k')}（縦軸は対数目盛り。破線は比 1/3 の等比数列）</p></div>
      </div>
      <div class="readouts">
        <div><span>推定値 λ⁽¹⁵⁾（近似）</span><output id="estimate">—</output></div>
        <div><span>誤差 |λ⁽¹⁵⁾ − 3|（近似）</span><output id="error">—</output></div>
        <div><span id="second-label">反復ベクトル x₁₅（近似）</span><output id="second">—</output></div>
        <div><span>厳密な固有値 λ₁</span><output id="exact">—</output></div>
      </div>
      <div class="table-scroll"><table class="value-table" id="iterates"><thead><tr id="iterates-head"></tr></thead><tbody></tbody></table></div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `ベキ乗法の最初の反復を手で計算します。${tex(String.raw`\mathbf{x}_0`)} は ${tex('(1, 1)^T')} の向きで、
      ${eq(String.raw`A\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 2 \\ 5 \end{pmatrix}, \qquad \lambda^{(0)} = \frac{(1, 1)\cdot(2, 5)}{1^2 + 1^2} = \frac{7}{2} = 3.5`)}
      です。${tex(String.raw`\mathbf{x}_1`)} は ${tex('(2, 5)^T')} の向きで、
      ${eq(String.raw`A\begin{pmatrix} 2 \\ 5 \end{pmatrix} = \begin{pmatrix} 7 \\ 13 \end{pmatrix}, \qquad \lambda^{(1)} = \frac{(2, 5)\cdot(7, 13)}{2^2 + 5^2} = \frac{79}{29} = 2.72414\ldots`)}
      です。表の ${tex('k = 0, 1')} の行の値と一致します。${tex(String.raw`\lambda^{(0)}`)} は厳密に 3.5、${tex(String.raw`\lambda^{(1)}`)} の表の値は有効数字6桁の近似です。`,
    `QR 法では、手順で求めた ${tex('A_1')} の左上の成分 ${tex(String.raw`\tfrac{37}{17} = 2.17647\ldots`)} が表の ${tex('k = 1')} の値、左下の成分 ${tex(String.raw`\tfrac{12}{17} = 0.705882\ldots`)} が同じ行の左下の値です。分数は厳密な値で、表の値は有効数字6桁の近似です。15回の反復の後の誤差は、どちらの方法でも、初めの誤差におよそ ${tex(String.raw`(1/3)^{15} \approx 7.0 \times 10^{-8}`)} を掛けた大きさです。`,
  ],
  related: [
    { href: './system.html', title: '連立1階' },
    { href: './second-order.html', title: '定数係数の2階同次' },
    { href: './pca.html', title: '主成分分析' },
    { href: './lu.html', title: 'LU 分解' },
  ],
  footer: 'この画面の計算は、2行2列の行列の固有値と、ベキ乗法と QR 法の反復です。',
});

let method = 'power';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const map = document.getElementById('map-chart') as HTMLCanvasElement;
  const errors = document.getElementById('error-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(map);
    clearFigure(errors);
    return;
  }
  const figure = current;
  const labels: Record<string, string> = { v1: 'v₁', Av1: 'Av₁', v2: 'v₂', Av2: 'Av₂' };
  drawPlot(map, {
    label: '単位円とその像の楕円。固有ベクトル v1 は 3 倍、v2 は −1 倍に写る。',
    lines: [line(figure, 'circle'), line(figure, 'ellipse')],
    vectors: figure.arrows.map(arrow => ({ ...arrow, label: labels[arrow.name] })),
    dots: figure.points.filter(point => point.name.startsWith('iterate-')).map(point => ({ x: point.x, y: point.y, role: point.role, radius: 3 })),
    equalAspect: true,
    xMin: -2.4,
    xMax: 2.4,
    yMin: -3.2,
    yMax: 3.2,
  });
  const lines = [line(figure, 'error'), line(figure, 'rate')];
  if (figure.series.some(item => item.name === 'subdiagonal')) lines.push(line(figure, 'subdiagonal'));
  drawPlot(errors, {
    label: '反復の回数に対する固有値の推定値の誤差。対数目盛り。',
    lines,
    logY: true,
    xMin: 0,
    xMax: figure.arrays.k[figure.arrays.k.length - 1],
  });
}

function fill() {
  if (!current) return;
  const { arrays, values } = current;
  show('estimate', fullNumber(values.estimate));
  show('error', plainNumber(values.error, 4));
  show('exact', fullNumber(values.lambda1));
  const last = arrays.k.length - 1;
  const head = document.getElementById('iterates-head')!;
  const body = document.querySelector<HTMLTableSectionElement>('#iterates tbody')!;
  if (method === 'power') {
    document.getElementById('second-label')!.textContent = '反復ベクトル x₁₅（近似）';
    show('second', `(${plainNumber(arrays.x1[last])}, ${plainNumber(arrays.x2[last])})`);
    head.innerHTML = `<th>${tex('k')}</th><th>${tex(String.raw`\mathbf{x}_k`)} の第1成分</th><th>第2成分</th><th>${tex(String.raw`\lambda^{(k)}`)}</th><th>${tex(String.raw`|\lambda^{(k)} - 3|`)}</th>`;
    body.innerHTML = arrays.k.map((k, i) => `<tr><td>${k}</td><td>${plainNumber(arrays.x1[i])}</td><td>${plainNumber(arrays.x2[i])}</td><td>${plainNumber(arrays.estimate[i])}</td><td>${plainNumber(arrays.error[i], 4)}</td></tr>`).join('');
  } else {
    document.getElementById('second-label')!.textContent = '右下の成分 (A₁₅)₂₂（近似）';
    show('second', fullNumber(values.estimate2));
    head.innerHTML = `<th>${tex('k')}</th><th>${tex('(A_k)_{11}')}</th><th>${tex('(A_k)_{22}')}</th><th>${tex('(A_k)_{21}')}</th><th>${tex(String.raw`|(A_k)_{11} - 3|`)}</th>`;
    body.innerHTML = arrays.k.map((k, i) => `<tr><td>${k}</td><td>${plainNumber(arrays.estimate[i])}</td><td>${plainNumber(arrays.estimate2[i])}</td><td>${plainNumber(arrays.a21[i])}</td><td>${plainNumber(arrays.error[i], 4)}</td></tr>`).join('');
  }
}

async function load() {
  try {
    current = await lessonFigure('linalg/eigen', { method });
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
