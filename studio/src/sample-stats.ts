import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { coreTypeDoc, fixed, linesWith, pointsWith } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'sample-stats',
  section: { label: '統計学' },
  title: '標本・平均・分散',
  description: `同じ分布から独立に取り出した ${tex('n')} 個の数値の標本について、中心の位置を表す標本平均 ${tex(String.raw`\bar{x}`)} と、散らばりを表す不偏分散 ${tex('s^2')} を求めます。二パスの公式と Welford の逐次更新が同じ値を与えることを確かめます。`,
  equation: [String.raw`\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i`, String.raw`s^2 = \frac{1}{n - 1}\sum_{i=1}^{n} (x_i - \bar{x})^2`],
  equationLabel: '標本平均 x バーは x i の和を n で割ったもの。不偏分散 s の2乗は、偏差の2乗の和を n − 1 で割ったもの。',
  equationNote: `標本標準偏差 ${tex(String.raw`s = \sqrt{s^2}`)}`,
  studyHeading: '標本平均と不偏分散を求める手順',
  steps: [
    `記号を定めます。${tex('X_1, \\ldots, X_n')} は、平均 ${tex(String.raw`\mu`)}、分散 ${tex(String.raw`\sigma^2`)} の同じ分布に独立に従う確率変数（i.i.d.）で、${tex('x_1, \\ldots, x_n')} はその実現値、${tex('n \\ge 2')} は標本の大きさです。${tex(String.raw`\mu`)} と ${tex(String.raw`\sigma^2`)} は母集団の値で、ふつう分かりません。標本から作る ${tex(String.raw`\bar{x}`)} と ${tex('s^2')} は、それぞれの推定値です。`,
    `二パスの公式は、標本を2回読みます（${coreDoc('statistics', 'variance_two_pass', '二パスの公式の説明')}）。1回目に和をとって平均を求め、2回目に平均からの偏差 ${tex(String.raw`d_i = x_i - \bar{x}`)} の2乗を足します。
      ${eq(String.raw`\bar{x} = \frac{x_1 + x_2 + \cdots + x_n}{n}`)}
      ${eq(String.raw`S = \sum_{i=1}^{n} d_i^2 = \sum_{i=1}^{n} (x_i - \bar{x})^2`)}
      ${eq(String.raw`s^2 = \frac{S}{n - 1}`)}
      偏差の和は ${tex(String.raw`\sum_i d_i = \sum_i x_i - n\bar{x} = n\bar{x} - n\bar{x} = 0`)} なので、自由に動ける偏差は ${tex('n - 1')} 個です。${tex('n - 1')} で割ると ${tex(String.raw`\mathbb{E}[s^2] = \sigma^2`)} となります（ページの最後の証明）。`,
    `Welford の逐次更新は、標本を一度だけ前から読み、読み終えた ${tex('k')} 個の平均 ${tex(String.raw`\bar{x}_k`)} と偏差平方和 ${tex(String.raw`M_k = \sum_{i=1}^{k} (x_i - \bar{x}_k)^2`)} を更新します（${coreTypeDoc('statistics', 'Welford', 'Welford の逐次更新の説明')}）。${tex(String.raw`\bar{x}_0 = 0`)}、${tex('M_0 = 0')} から始めて
      ${eq(String.raw`\delta_k = x_k - \bar{x}_{k-1}`)}
      ${eq(String.raw`\bar{x}_k = \bar{x}_{k-1} + \frac{\delta_k}{k}`)}
      ${eq(String.raw`M_k = M_{k-1} + \delta_k\,(x_k - \bar{x}_k)`)}
      とし、最後に ${tex(String.raw`s^2 = M_n/(n - 1)`)} とします。標本をすべて保存しておく必要がありません。`,
    `${tex('M_k')} の更新式を確かめます。${tex(String.raw`M_k = \sum_{i=1}^{k} x_i^2 - k\bar{x}_k^2`)} なので
      ${eq(String.raw`M_k - M_{k-1} = x_k^2 - k\bar{x}_k^2 + (k - 1)\bar{x}_{k-1}^2`)}
      です。${tex(String.raw`x_k = \bar{x}_{k-1} + \delta_k`)}、${tex(String.raw`\bar{x}_k = \bar{x}_{k-1} + \delta_k/k`)} を代入して展開します。
      ${eq(String.raw`x_k^2 = \bar{x}_{k-1}^2 + 2\bar{x}_{k-1}\delta_k + \delta_k^2`)}
      ${eq(String.raw`k\bar{x}_k^2 = k\bar{x}_{k-1}^2 + 2\bar{x}_{k-1}\delta_k + \frac{\delta_k^2}{k}`)}
      ${eq(String.raw`M_k - M_{k-1} = \delta_k^2 - \frac{\delta_k^2}{k} = \delta_k^2\,\frac{k - 1}{k}`)}
      一方、${tex(String.raw`x_k - \bar{x}_k = \delta_k - \delta_k/k = \delta_k (k - 1)/k`)} なので、${tex(String.raw`\delta_k (x_k - \bar{x}_k)`)} は右辺と同じです。二つの方法は、代数的に同じ ${tex('s^2')} を与えます。`,
  ],
  figureAlt: '数直線の上に並ぶ8個の標本の点と、標本平均の縦線、平均から標準偏差の幅の帯。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">標本の点と標本平均、標準偏差の幅</h2><div class="legend"><span><i class="numerical"></i>標本の点と標本平均</span></div></div>
      ${methodTabs('分散の求め方', [{ id: 'two-pass', label: '二パスの公式' }, { id: 'welford', label: 'Welford の逐次更新' }])}
      <canvas id="dots-chart" role="img"></canvas><p>横軸は標本の値 ${tex('x')}。同じ値の点は縦に積み、縦軸はその値の個数です。帯は ${tex(String.raw`\bar{x} - s`)} から ${tex(String.raw`\bar{x} + s`)} です。</p>
      <div class="readouts">
        <div><span>標本平均 x̄（厳密）</span><output id="mean">—</output></div>
        <div><span>不偏分散 s²（近似）</span><output id="variance">—</output></div>
        <div><span>標本標準偏差 s（近似）</span><output id="sd">—</output></div>
        <div><span>二つの方法の s² の差（近似）</span><output id="method-gap">—</output></div>
      </div>
      <h3 id="table-heading">—</h3>
      <div class="table-scroll"><table class="value-table" id="stats-table"></table></div>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `8個の標本を ${tex('2, 4, 4, 4, 5, 5, 7, 9')} とします（${tex('n = 8')}）。標本平均は
      ${eq(String.raw`\bar{x} = \frac{2 + 4 + 4 + 4 + 5 + 5 + 7 + 9}{8} = \frac{40}{8} = 5`)}
      で、厳密に 5 です。`,
    `偏差 ${tex(String.raw`x_i - 5`)} は ${tex('-3, -1, -1, -1, 0, 0, 2, 4')} で、和は ${tex('0')} です。2乗の和と不偏分散は
      ${eq(String.raw`S = 9 + 1 + 1 + 1 + 0 + 0 + 4 + 16 = 32`)}
      ${eq(String.raw`s^2 = \frac{32}{8 - 1} = \frac{32}{7} \approx 4.571429, \qquad s = \sqrt{32/7} \approx 2.138090`)}
      です。分数 ${tex('32/7')} は厳密な値、小数は6桁の近似です。`,
    `Welford の逐次更新の最初の3回は
      ${eq(String.raw`k = 1:\ \delta_1 = 2 - 0 = 2,\quad \bar{x}_1 = 0 + \tfrac{2}{1} = 2,\quad M_1 = 0 + 2\cdot(2 - 2) = 0`)}
      ${eq(String.raw`k = 2:\ \delta_2 = 4 - 2 = 2,\quad \bar{x}_2 = 2 + \tfrac{2}{2} = 3,\quad M_2 = 0 + 2\cdot(4 - 3) = 2`)}
      ${eq(String.raw`k = 3:\ \delta_3 = 4 - 3 = 1,\quad \bar{x}_3 = 3 + \tfrac{1}{3} = \tfrac{10}{3},\quad M_3 = 2 + 1\cdot\left(4 - \tfrac{10}{3}\right) = \tfrac{8}{3}`)}
      です。最初の3個 ${tex('2, 4, 4')} の偏差平方和は ${tex(String.raw`(2 - \tfrac{10}{3})^2 + 2(4 - \tfrac{10}{3})^2 = \tfrac{16}{9} + \tfrac{8}{9} = \tfrac{8}{3}`)} で、確かに一致します。8個を読み終えると ${tex('M_8 = 32')}、${tex('s^2 = 32/7')} です。図の下の表は、選んだ方法でライブラリが計算した各行の値です。`,
  ],
  related: [
    { href: './limit-theorems.html', title: '大数の法則と中心極限定理', description: '標本の大きさを増やすと、標本平均が母平均に近づきます。' },
    { href: './regression.html', title: '線形回帰', description: '2変量の標本の平均と偏差から、回帰直線の係数を求めます。' },
    { href: './observables.html', title: '温度・圧力・動径分布関数', description: '分子動力学の時系列の平均と分散から、巨視的な量を求めます。' },
  ],
  footer: 'この画面の計算は、8個の数値の標本の標本平均と不偏分散です。',
  proof: writtenProof([{
    statement: `${tex('X_1, \\ldots, X_n')}（${tex('n \\ge 2')}）が平均 ${tex(String.raw`\mu`)}、分散 ${tex(String.raw`\sigma^2`)} の分布に独立に従うとき、${tex(String.raw`s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(X_i - \bar{X})^2`)} は ${tex(String.raw`\mathbb{E}[s^2] = \sigma^2`)} を満たします（不偏性）。`,
    proof: [
      `${tex(String.raw`X_i - \bar{X} = (X_i - \mu) - (\bar{X} - \mu)`)} と書き、2乗して ${tex('i')} について足します。${tex(String.raw`\sum_i (X_i - \mu) = n(\bar{X} - \mu)`)} なので
        ${eq(String.raw`\sum_{i=1}^{n}(X_i - \bar{X})^2 = \sum_{i=1}^{n}(X_i - \mu)^2 - 2(\bar{X} - \mu)\cdot n(\bar{X} - \mu) + n(\bar{X} - \mu)^2 = \sum_{i=1}^{n}(X_i - \mu)^2 - n(\bar{X} - \mu)^2`)}
        です。`,
      `分散の定義から ${tex(String.raw`\mathbb{E}[(X_i - \mu)^2] = \sigma^2`)} です。独立な確率変数の和の分散は分散の和なので
        ${eq(String.raw`\mathbb{E}[(\bar{X} - \mu)^2] = \mathrm{Var}(\bar{X}) = \frac{1}{n^2}\sum_{i=1}^{n}\mathrm{Var}(X_i) = \frac{\sigma^2}{n}`)}
        です。`,
      `期待値の線形性により
        ${eq(String.raw`\mathbb{E}\left[\sum_{i=1}^{n}(X_i - \bar{X})^2\right] = n\sigma^2 - n\cdot\frac{\sigma^2}{n} = (n - 1)\sigma^2`)}
        で、両辺を ${tex('n - 1')} で割ると ${tex(String.raw`\mathbb{E}[s^2] = \sigma^2`)} です。${tex('n')} で割った値の期待値は ${tex(String.raw`\frac{n-1}{n}\sigma^2`)} で、${tex(String.raw`\sigma^2`)} より小さくなります。`,
    ],
  }]),
});

let method = 'two-pass';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const canvas = document.getElementById('dots-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(canvas);
    return;
  }
  drawPlot(canvas, {
    label: '8個の標本の点と、標本平均の縦線、平均から標準偏差の幅の帯。',
    polygons: current.polygons.map(p => ({ x: p.x, y: p.y })),
    lines: [...linesWith(current, 'band-'), line(current, 'mean')],
    dots: pointsWith(current, 'data-', 6),
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 4,
  });
}

function row(cells: (string | number)[], header = false) {
  const tag = header ? 'th' : 'td';
  return `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
}

function fill() {
  if (!current) return;
  const { values, arrays } = current;
  show('mean', fixed(values.mean));
  show('method-gap', values.method_gap.toExponential(2));
  show('variance', fixed(values.variance));
  show('sd', fixed(values.sd));
  const table = document.getElementById('stats-table')!;
  const heading = document.getElementById('table-heading')!;
  const data = arrays.data;
  if (method === 'two-pass') {
    heading.textContent = '二パスの公式の偏差と偏差の2乗（整数なので厳密）';
    table.innerHTML = row(['i', 'xᵢ', 'xᵢ − x̄', '(xᵢ − x̄)²'], true)
      + data.map((x, i) => row([i + 1, fixed(x, 0), fixed(arrays.deviations[i], 0), fixed(arrays.squares[i], 0)])).join('');
  } else {
    heading.textContent = 'Welford の逐次更新の各回の値（小数6桁の近似）';
    table.innerHTML = row(['k', 'xₖ', 'δₖ', 'x̄ₖ', 'Mₖ'], true)
      + data.map((x, i) => row([i + 1, fixed(x, 0), fixed(arrays.deltas[i]), fixed(arrays.means[i]), fixed(arrays.m2[i])])).join('');
  }
}

async function load() {
  try {
    current = await lessonFigure('statistics/sample-stats', { method });
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
