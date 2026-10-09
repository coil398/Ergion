import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { dot, eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'neighbor-list',
  section: { label: '分子動力学' },
  title: '近接リスト法とセル分割法',
  description: `Lennard–Jones 力はカットオフ ${tex('r_c')} より遠い対では 0 です。近接リストは、最小イメージの距離が ${tex('r_c')} 以下の対だけを残します。セル分割は、箱を一辺 ${tex(String.raw`\ell`)} のセルに分け、粒子の入るセルの番号 ${tex(String.raw`\lfloor x/\ell \rfloor`)} を使って、遠くの対を最初から調べないようにします。`,
  equation: [
    String.raw`c = \left\lfloor \frac{x}{\ell} \right\rfloor`,
    String.raw`r_{ij} = \lvert \mathbf{d}_{ij} - L\,\mathrm{round}(\mathbf{d}_{ij}/L) \rvert, \qquad r_{ij} \le r_c`,
  ],
  studyHeading: 'セル番号と近接対を求める手順',
  steps: [
    `粒子数 ${tex('N')} のすべての対は ${tex('N(N-1)/2')} 組です。${tex('N = 108')} なら ${tex(String.raw`108\cdot 107/2 = 5778`)} 組で、これは厳密です。力の到達距離が ${tex('r_c')} なら、そのうちの多くは力が 0 です。近接リストは ${tex(String.raw`r_{ij} \le r_c`)} の対だけを記録します（${coreDoc('molecular', 'neighbor_pairs', '近接対の説明')}）。`,
    `一辺 ${tex('L')} の箱を、一辺 ${tex(String.raw`\ell > 0`)} の立方体セルに分けます。座標 ${tex('x')} のセル番号は
      ${eq(String.raw`c = \left\lfloor \frac{x}{\ell} \right\rfloor`)}
      です（${coreDoc('molecular', 'cell_index', 'セル番号の説明')}）。${tex('y')} と ${tex('z')} も同じ式で番号を付けます。${tex(String.raw`\ell \ge r_c`)} のとき、セル番号がどの軸でも 2 以上離れた粒子は、周期境界の隣のセルへ折り返したあとでも距離が ${tex('r_c')} 以上になるので、力の計算から外せます。周期境界では、端のセルの隣は反対側の端のセルです。`,
    `対の距離は最小イメージで測ります。差 ${tex(String.raw`\mathbf{d}_{ij} = \mathbf{r}_j - \mathbf{r}_i`)} の各成分について
      ${eq(String.raw`q = \mathrm{round}(d/L), \qquad d - qL`)}
      を取り、そのベクトルの長さを ${tex(String.raw`r_{ij}`)} とします（${coreDoc('molecular', 'nearest_image_distance', '最小イメージの距離の説明')}）。${tex(String.raw`r_{ij} \le r_c`)} のときだけ、その対を近接リストへ入れます。このページの対の一覧は、すべての対をこの距離で調べた結果です。`,
  ],
  figureAlt: '一辺 2.5 のセルに分けた座標と、x = 7.2 がセル 2 に入る点。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">セル番号 ${tex(String.raw`c(x)`)}</h2></div>
        <div><h3>${tex(String.raw`\ell = 2.5`)}、箱の一辺 ${tex('L = 10')}</h3><canvas id="cell-chart" role="img"></canvas><p>座標 x。点は x = 7.2 の例。階段は床関数。</p></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\ell = 2.5`)}、${tex('x = 7.2')} とします。
      ${eq(String.raw`\frac{7.2}{2.5} = 2.88, \qquad \lfloor 2.88 \rfloor = 2`)}
      なので、この粒子はセル 2 に入ります。${tex('2')} は厳密な値です。画面のセル番号は <output id="cell-index">—</output> です。同じ一辺で ${tex('x = 0')} はセル 0、${tex('x = 2.5')} は ${tex(String.raw`\lfloor 1 \rfloor = 1`)} です。`,
    `${tex('L = 10')}、${tex('r_c = 1')}、位置 ${tex(String.raw`(0.1, 0, 0)`)}、${tex(String.raw`(9.8, 0, 0)`)}、${tex(String.raw`(5, 0, 0)`)} を調べます。最初の対の差は
      ${eq(String.raw`d = 9.8 - 0.1 = 9.7, \qquad \frac{d}{L} = 0.97, \qquad \mathrm{round}(0.97) = 1`)}
      ${eq(String.raw`d - L = 9.7 - 10 = -0.3, \qquad \lvert -0.3 \rvert = 0.3`)}
      です。${tex('0.3 \le 1')} なので、この対は近接リストに入ります。${tex('0.3')} は厳密な値で、画面の距離は <output id="pair-distance">—</output> です。`,
    `残る差は ${tex(String.raw`5.0 - 0.1 = 4.9`)} と ${tex(String.raw`5.0 - 9.8 = -4.8`)} です。どちらも絶対値が ${tex('L/2 = 5')} より小さいので最小イメージはそのままの差で、${tex('4.9 > 1')}、${tex('4.8 > 1')} です。近接対は1組だけです。画面の組の数は <output id="pair-count">—</output> です。`,
  ],
  related: [
    { href: './periodic.html', title: '周期境界条件と最小イメージ法' },
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
    { href: './nvt.html', title: 'NVT アンサンブルと熱浴法' },
  ],
  footer: 'この画面の計算は、セル番号と、最小イメージで選んだ近接対です。',
});

let shown: LessonFigure | undefined;

function paint() {
  if (!shown) return;
  drawPlot(document.getElementById('cell-chart') as HTMLCanvasElement, {
    label: '座標に対するセル番号。点は x = 7.2 の例。',
    lines: [line(shown, 'cell', 'c')],
    dots: [dot(shown, 'hand', 'x = 7.2')],
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 4,
    zeroLabel: 'c = 0',
  });
}

async function load() {
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('md/neighbor-list');
    shown = figure;
    document.getElementById('cell-index')!.textContent = String(figure.values.cell_index);
    document.getElementById('pair-distance')!.textContent = fixed(figure.values.distance, 6);
    document.getElementById('pair-count')!.textContent = String(figure.values.pair_count);
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
