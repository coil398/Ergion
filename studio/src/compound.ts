import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

const names: Record<string, string> = { annual: '年複利', monthly: '月複利', daily: '日複利' };

renderLesson({
  id: 'compound',
  section: { label: '金融数学' },
  title: '連続複利と指数成長',
  description: `年利率 ${tex('r')} の利息を年 ${tex('m')} 回組み入れる複利の元利合計 ${tex(String.raw`S_0(1 + r/m)^{mt}`)} が、${tex(String.raw`m \to \infty`)} で連続複利 ${tex(String.raw`S_0 e^{rt}`)} に近づくことを、対数と Taylor 展開から導きます。極限の式は、変数分離で解ける微分方程式 ${tex(`S' = rS`)} の厳密解です。`,
  equation: [
    String.raw`S_m(t) = S_0\left(1 + \frac{r}{m}\right)^{mt}`,
    String.raw`\lim_{m \to \infty} S_m(t) = S_0 e^{rt}, \qquad \frac{dS}{dt} = rS`,
  ],
  equationLabel: '年 m 回の複利の元利合計は S0 掛ける 1 足す r 割る m の mt 乗。m を無限大にした極限は S0 e の rt 乗で、微分方程式 dS/dt = rS の解。',
  studyHeading: '複利の漸化式から連続複利の極限への手順',
  steps: [
    `記号を定めます。${tex('S_0 > 0')} は元本、${tex('r > 0')} は年利率、${tex('m')} は1年あたりの複利の回数、${tex('t')} は年で測った時間です。1回の期間は ${tex('1/m')} 年で、期間の終わりに、その時点の元利合計の ${tex('r/m')} 倍が利息として組み入れられます。${tex('k')} 回目の組み入れの後の元利合計を ${tex('S_k')} とすると
      ${eq(String.raw`S_{k+1} = S_k + \frac{r}{m}S_k = \left(1 + \frac{r}{m}\right)S_k`)}
      ${eq(String.raw`S_k = \left(1 + \frac{r}{m}\right)^k S_0`)}
      です。${tex('t')} 年後には ${tex('k = mt')} 回組み入れているので、${tex(String.raw`S_m(t) = S_0(1 + r/m)^{mt}`)} です（${coreDoc('finance', 'discrete_compound', '複利の元利合計の説明')}）。組み入れの間は値が変わらないので、${tex('S_m')} は時刻 ${tex('k/m')} で跳ね上がる階段です（${coreDoc('finance', 'credited_balance', '階段の値の説明')}）。`,
    `${tex(String.raw`m \to \infty`)} の極限を、対数をとって調べます。
      ${eq(String.raw`\ln\frac{S_m(t)}{S_0} = mt\,\ln\left(1 + \frac{r}{m}\right)`)}
      ${tex('|x| < 1')} で成り立つ Taylor 展開 ${tex(String.raw`\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \cdots`)} に ${tex('x = r/m')} を代入すると
      ${eq(String.raw`mt\,\ln\left(1 + \frac{r}{m}\right) = mt\left(\frac{r}{m} - \frac{r^2}{2m^2} + \frac{r^3}{3m^3} - \cdots\right)`)}
      ${eq(String.raw`= rt - \frac{r^2 t}{2m} + \frac{r^3 t}{3m^2} - \cdots`)}
      です。${tex(String.raw`m \to \infty`)} で右辺は ${tex('rt')} に近づき、指数関数は連続なので
      ${eq(String.raw`\lim_{m \to \infty} S_0\left(1 + \frac{r}{m}\right)^{mt} = S_0 e^{rt}`)}
      です（${coreDoc('finance', 'continuous_compound', '連続複利の説明')}）。この極限の証明はページの最後にあります。`,
    `連続複利との差の大きさを求めます。手順2の展開から ${tex(String.raw`S_m(t) = S_0 e^{rt}\exp\left(-\frac{r^2 t}{2m} + O(m^{-2})\right)`)} で、${tex(String.raw`e^{-a} = 1 - a + O(a^2)`)} を使うと
      ${eq(String.raw`S_0 e^{rt} - S_m(t) = S_0 e^{rt}\,\frac{r^2 t}{2m} + O(m^{-2})`)}
      です（${coreDoc('finance', 'compound_gap_leading', '差の主要項の説明')}）。差は ${tex('m')} に反比例して小さくなり、${tex('m')} を 10 倍にすると約 1/10 になります。`,
    `連続複利の満たす微分方程式を導きます。刻みを ${tex('h = 1/m')} と書くと、漸化式は
      ${eq(String.raw`S(t + h) - S(t) = r h\,S(t)`)}
      ${eq(String.raw`\frac{S(t + h) - S(t)}{h} = r S(t)`)}
      です。${tex(String.raw`h \to 0`)} で左辺は導関数になり、${tex(`S' = rS`)}、${tex('S(0) = S_0')} を得ます。これは変数分離で解けます。${tex('S > 0')} として両辺を ${tex('S')} で割り、${tex('t')} で積分します。
      ${eq(String.raw`\frac{1}{S}\frac{dS}{dt} = r`)}
      ${eq(String.raw`\int \frac{dS}{S} = \int r\,dt`)}
      ${eq(String.raw`\ln S = rt + C`)}
      ${eq(String.raw`S = e^{C} e^{rt}`)}
      ${tex('t = 0')} で ${tex('S_0 = e^C')} なので、${tex(String.raw`S(t) = S_0 e^{rt}`)} です。手順2の極限と同じ式で、これは厳密解です。漸化式 ${tex(String.raw`S_{k+1} = (1 + rh)S_k`)} は、この方程式に刻み ${tex('h')} の Euler 法を当てたものと同じです。`,
  ],
  figureAlt: '年複利と月複利の元利合計の階段が、連続複利の指数曲線 100 e の 0.05t 乗 の下に並び、複利の回数を増やすと曲線に近づく図。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">元利合計の時間変化と連続複利との差</h2><div class="legend"><span><i class="numerical"></i>年 m 回の複利</span><span><i class="analytical"></i>連続複利</span></div></div>
      ${methodTabs('1年あたりの複利の回数', [{ id: 'annual', label: '年複利' }, { id: 'monthly', label: '月複利' }, { id: 'daily', label: '日複利' }])}
      <div class="plot-pair">
        <div><h3>元利合計 ${tex('S(t)')}</h3><canvas id="balance-chart" role="img"></canvas><p>横軸は時間 ${tex('t')}（年）。${tex(String.raw`S_0 = 100`)}、${tex('r = 0.05')}</p></div>
        <div><h3>${tex('t = 10')} での差 ${tex(String.raw`S_0 e^{10r} - S_m(10)`)}</h3><canvas id="gap-chart" role="img"></canvas><p>横軸は ${tex(String.raw`\log_{10} m`)}、縦軸は差の常用対数で、目盛り ${tex('-2')} は差 ${tex('0.01')} です。破線の主要項 ${tex(String.raw`S_0 e^{rt} r^2 t/(2m)`)} は実線とほぼ重なります</p></div>
      </div>
      <div class="readouts">
        <div><span>1年後 S_m(1)（厳密）</span><output id="discrete-1">—</output></div>
        <div><span>連続複利 S₀e^r（厳密）</span><output id="continuous-1">—</output></div>
        <div><span>10年後 S_m(10)（厳密）</span><output id="discrete-end">—</output></div>
        <div><span>10年後の差（厳密）</span><output id="gap-end">—</output></div>
      </div>
      <h3>複利の回数ごとの元利合計（厳密な値を小数6桁に丸めた値）</h3>
      <div class="table-scroll"><table class="value-table" id="compound-table"></table></div>
      <p id="lead-note">—</p>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('S_0 = 100')}、${tex('r = 0.05')}、${tex('t = 1')} とします。年複利（${tex('m = 1')}）では
      ${eq(String.raw`S_1(1) = 100 \cdot 1.05 = 105`)}
      で、厳密に 105 です。`,
    `月複利（${tex('m = 12')}）では ${tex(String.raw`x = 0.05/12 \approx 0.00416667`)} で、二項展開の初めの4項は
      ${eq(String.raw`(1 + x)^{12} = 1 + 12x + 66x^2 + 220x^3 + \cdots`)}
      ${eq(String.raw`\approx 1 + 0.05 + 0.00114583 + 0.00001591 + 0.00000015 + \cdots \approx 1.0511619`)}
      なので ${tex(String.raw`S_{12}(1) \approx 105.116190`)} です。`,
    `連続複利は、${tex(String.raw`e^{x} = 1 + x + \frac{x^2}{2} + \frac{x^3}{6} + \cdots`)} に ${tex('x = 0.05')} を代入して
      ${eq(String.raw`e^{0.05} \approx 1 + 0.05 + 0.00125 + 0.00002083 + 0.00000026 + \cdots \approx 1.0512711`)}
      ${eq(String.raw`100\,e^{0.05} \approx 105.127110`)}
      です。差は年複利で ${tex('105.127110 - 105 = 0.127110')}、月複利で ${tex('105.127110 - 105.116190 = 0.010920')} です。主要項は年複利で ${tex(String.raw`105.127110 \cdot 0.05^2/2 \approx 0.131409`)}、月複利で ${tex(String.raw`105.127110 \cdot 0.05^2/24 \approx 0.010951`)} で、差の近似になっています。画面の計器の1年後の値は、タブで選んだ ${tex('m')} についてライブラリが計算した値です。`,
  ],
  related: [
    { href: './separation.html', title: '変数分離', description: `連続複利の方程式 ${tex(`S' = rS`)} は、変数分離で解ける最も簡単な方程式です。` },
    { href: './linear.html', title: '1階線形', description: `一定の入金 ${tex('q')} を加えた ${tex(`S' = rS + q`)} は1階線形の方程式です。` },
    { href: './taylor.html', title: 'Taylor 展開', description: `極限の計算に使った ${tex(String.raw`\ln(1 + x)`)} と ${tex('e^x')} の展開です。` },
    { href: './gbm.html', title: '幾何 Brownian 運動', description: `成長率に揺らぎを加えた株価のモデルで、期待値は ${tex(String.raw`S_0 e^{\mu t}`)} です。` },
  ],
  footer: 'この画面の計算は、元本 100、年利率 0.05 の複利と連続複利の元利合計です。',
  proof: writtenProof([{
    statement: `${tex('r > 0')} のとき ${tex(String.raw`\lim_{m \to \infty}\left(1 + \frac{r}{m}\right)^m = e^r`)} で、すべての正の整数 ${tex('m')} について ${tex(String.raw`0 \le e^r - \left(1 + \frac{r}{m}\right)^m \le e^r\,\frac{r^2}{2m}`)} です。`,
    proof: [
      `${tex(String.raw`x \ge 0`)} で ${tex(String.raw`x - \frac{x^2}{2} \le \ln(1 + x) \le x`)} を示します。${tex(String.raw`f(x) = x - \ln(1 + x)`)} は ${tex('f(0) = 0')}、${tex(String.raw`f'(x) = 1 - \frac{1}{1 + x} = \frac{x}{1 + x} \ge 0`)} なので ${tex(String.raw`f(x) \ge 0`)} です。${tex(String.raw`g(x) = \ln(1 + x) - x + \frac{x^2}{2}`)} は ${tex('g(0) = 0')}、${tex(String.raw`g'(x) = \frac{1}{1 + x} - 1 + x = \frac{x^2}{1 + x} \ge 0`)} なので ${tex(String.raw`g(x) \ge 0`)} です。`,
      `${tex('x = r/m')} を代入して ${tex('m')} を掛けると
        ${eq(String.raw`r - \frac{r^2}{2m} \le m\ln\left(1 + \frac{r}{m}\right) \le r`)}
        です。両側は ${tex(String.raw`m \to \infty`)} で ${tex('r')} に近づくので、はさみうちの原理により ${tex(String.raw`m\ln(1 + r/m) \to r`)} です。指数関数は連続なので ${tex(String.raw`(1 + r/m)^m = e^{m\ln(1 + r/m)} \to e^r`)} です。`,
      `指数関数は増加関数なので、手順2の不等式から
        ${eq(String.raw`e^{r - r^2/(2m)} \le \left(1 + \frac{r}{m}\right)^m \le e^r`)}
        です。${tex(String.raw`e^{-a} \ge 1 - a`)}（${tex('a \\ge 0')}）を ${tex(String.raw`a = r^2/(2m)`)} に使うと ${tex(String.raw`e^{r - r^2/(2m)} \ge e^r\left(1 - \frac{r^2}{2m}\right)`)} なので
        ${eq(String.raw`0 \le e^r - \left(1 + \frac{r}{m}\right)^m \le e^r\,\frac{r^2}{2m}`)}
        です。`,
    ],
  }]),
});

let method = 'annual';
let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const balance = document.getElementById('balance-chart') as HTMLCanvasElement;
  const gap = document.getElementById('gap-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(balance);
    clearFigure(gap);
    return;
  }
  drawPlot(balance, {
    label: `${names[method]}の元利合計の階段と、連続複利の曲線 100 e の 0.05t 乗。実線は複利、破線は連続複利。`,
    lines: [line(current, 'staircase'), line(current, 'continuous')],
    xMin: 0,
    xMax: 10,
    yMin: 95,
    yMax: 170,
  });
  const chosen = current.points.find(point => point.name === 'chosen')!;
  drawPlot(gap, {
    label: '複利の回数 m の常用対数に対する、10年後の連続複利との差。実線は差、破線は主要項。',
    lines: [line(current, 'gap-leading'), line(current, 'gap')],
    dots: [{ x: chosen.x, y: chosen.y, role: 'numerical', radius: 5, label: names[method] }],
    xMin: 0,
    xMax: 4,
    logY: true,
  });
}

function fill() {
  if (!current) return;
  const { values: v, arrays: a } = current;
  show('discrete-1', fixed(v.discrete_1));
  show('continuous-1', fixed(v.continuous_1));
  show('discrete-end', fixed(v.discrete_end));
  show('gap-end', fixed(v.gap_end));
  const row = (cells: (string | number)[], tag = 'td') => `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
  document.getElementById('compound-table')!.innerHTML = row(['m', 'S_m(1)', 'S_m(10)', '10年後の連続複利との差'], 'th')
    + a.table_m.map((m, i) => row([fixed(m, 0), fixed(a.table_1[i]), fixed(a.table_end[i]), fixed(a.table_gap[i])])).join('')
    + row(['∞（連続複利）', fixed(v.continuous_1), fixed(v.continuous_end), fixed(0)]);
  document.getElementById('lead-note')!.innerHTML = `${names[method]}（${tex(`m = ${fixed(v.m, 0)}`)}）の10年後の差の主要項 ${tex(String.raw`S_0 e^{rt} r^2 t/(2m)`)} は ${fixed(v.lead_end)}（近似）で、厳密な差 ${fixed(v.gap_end)} に近い値です。`;
}

async function load() {
  try {
    current = await lessonFigure('finance/compound', { method });
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
