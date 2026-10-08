import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { coreTypeDoc, fixed, linesWith } from './figures/statistics';
import { eq, lessonFigure, line, renderLesson, setStatus, writtenProof } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'limit-theorems',
  section: { label: '統計学' },
  title: '大数の法則と中心極限定理',
  description: `平均 ${tex(String.raw`\mu`)}、分散 ${tex(String.raw`\sigma^2`)} の分布から独立に取り出した標本の平均 ${tex(String.raw`\bar{x}_n`)} は、${tex('n')} を大きくすると ${tex(String.raw`\mu`)} に近づき（大数の法則）、標準化すると分布の形によらず標準正規分布に近づきます（中心極限定理）。指数分布の擬似乱数の標本で確かめます。`,
  equation: [String.raw`\lim_{n \to \infty} P\left(|\bar{x}_n - \mu| \ge \varepsilon\right) = 0`, String.raw`Z_n = \frac{\bar{x}_n - \mu}{\sigma/\sqrt{n}} \ \xrightarrow{d}\ \mathcal{N}(0, 1)`],
  equationLabel: '大数の弱法則：標本平均が母平均から ε 以上離れる確率は 0 に近づく。中心極限定理：標準化した標本平均は標準正規分布に分布収束する。',
  studyHeading: '標本平均の平均と分散から二つの定理への手順',
  steps: [
    `記号を定めます。${tex('X_1, X_2, \\ldots')} は、平均 ${tex(String.raw`\mu = \mathbb{E}[X_i]`)}、分散 ${tex(String.raw`\sigma^2 = \mathrm{Var}(X_i) < \infty`)} の同じ分布に独立に従う確率変数です。最初の ${tex('n')} 個の標本平均を ${tex(String.raw`\bar{x}_n = \frac{1}{n}\sum_{i=1}^{n} X_i`)}、${tex(String.raw`\varepsilon > 0`)} を任意の正の数とします。`,
    `標本平均の平均と分散を求めます。期待値の線形性と、独立な確率変数の和の分散が分散の和であることから
      ${eq(String.raw`\mathbb{E}[\bar{x}_n] = \frac{1}{n}\sum_{i=1}^{n}\mathbb{E}[X_i] = \frac{n\mu}{n} = \mu`)}
      ${eq(String.raw`\mathrm{Var}(\bar{x}_n) = \frac{1}{n^2}\sum_{i=1}^{n}\mathrm{Var}(X_i) = \frac{n\sigma^2}{n^2} = \frac{\sigma^2}{n}`)}
      です。標本平均の標準偏差 ${tex(String.raw`\sigma/\sqrt{n}`)} は、${tex('n')} を4倍にすると半分になります。`,
    `Chebyshev の不等式 ${tex(String.raw`P(|Y - \mathbb{E}Y| \ge \varepsilon) \le \mathrm{Var}(Y)/\varepsilon^2`)} を ${tex(String.raw`Y = \bar{x}_n`)} に使うと
      ${eq(String.raw`P\left(|\bar{x}_n - \mu| \ge \varepsilon\right) \le \frac{\sigma^2}{n\varepsilon^2}`)}
      で、右辺は ${tex(String.raw`n \to \infty`)} で 0 になります（${coreDoc('statistics', 'chebyshev_bound', 'Chebyshev の上界の説明')}）。これが大数の弱法則で、証明はページの最後にあります。`,
    `標本平均を、平均 0、分散 1 になるように標準化します。
      ${eq(String.raw`Z_n = \frac{\bar{x}_n - \mu}{\sigma/\sqrt{n}}, \qquad \mathbb{E}[Z_n] = \frac{\mu - \mu}{\sigma/\sqrt{n}} = 0, \qquad \mathrm{Var}(Z_n) = \frac{\sigma^2/n}{\sigma^2/n} = 1`)}
      中心極限定理は、すべての ${tex('a < b')} について
      ${eq(String.raw`\lim_{n \to \infty} P(a \le Z_n \le b) = \int_a^b \varphi(z)\,dz, \qquad \varphi(z) = \frac{1}{\sqrt{2\pi}}e^{-z^2/2}`)}
      が成り立つことを述べます（${coreDoc('statistics', 'standard_normal_density', '標準正規分布の密度の説明')}）。この定理の証明には特性関数を使い、このページでは扱いません。`,
    `標本の分布には、率 ${tex(String.raw`\lambda = 1`)} の指数分布 ${tex(String.raw`p(x) = e^{-x}`)}（${tex(String.raw`x \ge 0`)}）を使います。左右対称でない分布です。部分積分により
      ${eq(String.raw`\mu = \int_0^\infty x e^{-x}\,dx = 1, \qquad \mathbb{E}[X^2] = \int_0^\infty x^2 e^{-x}\,dx = 2, \qquad \sigma^2 = 2 - 1^2 = 1`)}
      です。標本は、一様な擬似乱数 ${tex('U')} を逆関数法 ${tex(String.raw`X = -\ln(1 - U)`)} で変換して作ります（${coreTypeDoc('statistics', 'Rng', '擬似乱数の生成器の説明')}）。擬似乱数は種（seed）から決まる数列で、画面の標本はすべて種 1 から作ったものです。標本から求めた平均、割合、ヒストグラムは、どれも近似です。`,
  ],
  figureAlt: '標本の大きさとともに母平均 1 に近づく標本平均の推移と、標準化した標本平均のヒストグラムに重なる標準正規分布の密度。',
  figure: `
    <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
      <div class="panel-heading"><h2 id="fig-heading">標本平均の推移と標準化した標本平均の分布</h2><div class="legend"><span><i class="numerical"></i>擬似乱数の標本（種 1）</span><span><i class="analytical"></i>厳密な値</span></div></div>
      <div class="plot-pair">
        <div><h3>標本平均 ${tex(String.raw`\bar{x}_n`)} の推移</h3><canvas id="running-chart" role="img"></canvas><p>横軸は標本の大きさ ${tex('n')}。青緑の破線は ${tex(String.raw`\mu = 1`)}、灰色の破線は ${tex(String.raw`\mu \pm 2\sigma/\sqrt{n}`)}</p></div>
        <div><h3>${tex('Z_{30}')} のヒストグラムと ${tex(String.raw`\varphi(z)`)}</h3><canvas id="histogram-chart" role="img"></canvas><p>横軸 ${tex('z')}。${tex('n = 30')} の標本平均 2000 組を標準化した値の密度</p></div>
      </div>
      <div class="readouts">
        <div><span>標本平均 x̄₈₀₀（近似）</span><output id="final-mean">—</output></div>
        <div><span>|Z₃₀| ≤ 1 の組の割合（近似）</span><output id="within">—</output></div>
        <div><span>Chebyshev の上界 σ²/(nε²)</span><output id="chebyshev">—</output></div>
        <div><span>|x̄₃₀ − μ| ≥ 0.5 の組の割合（近似）</span><output id="deviation">—</output></div>
      </div>
      <p id="z-moments" style="white-space:pre-line">—</p>
    </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex(String.raw`\sigma^2 = 1`)}、${tex('n = 30')}、${tex(String.raw`\varepsilon = 0.5`)} とします。Chebyshev の上界は
      ${eq(String.raw`\frac{\sigma^2}{n\varepsilon^2} = \frac{1}{30 \cdot 0.25} = \frac{1}{7.5} = \frac{2}{15} \approx 0.133333`)}
      で、分数 ${tex('2/15')} は厳密な値です。画面の2000組では、${tex(String.raw`|\bar{x}_{30} - 1| \ge 0.5`)} となった組の割合は計器の値（種 1 の擬似乱数による近似）で、この上界より小さくなります。`,
    `標本平均の標準偏差は ${tex(String.raw`\sigma/\sqrt{30} = 1/\sqrt{30} \approx 0.182574`)} なので、${tex(String.raw`\varepsilon = 0.5`)} は標準化すると ${tex(String.raw`0.5\sqrt{30} \approx 2.738613`)} です。中心極限定理による近似では
      ${eq(String.raw`P\left(|\bar{x}_{30} - 1| \ge 0.5\right) \approx 1 - \int_{-2.738613}^{2.738613}\varphi(z)\,dz`)}
      で、右辺の値は計器の下に示します。Chebyshev の上界 ${tex('2/15')} は、どの分布にも成り立つ代わりに、この近似よりずっと大きな値です。`,
    `中心極限定理によれば ${tex(String.raw`P(|Z_{30}| \le 1) \approx \int_{-1}^{1}\varphi(z)\,dz \approx 0.682689`)}（Simpson 則の近似）です。画面の ${tex(String.raw`|Z_{30}| \le 1`)} の割合は、この値に近い近似です。`,
  ],
  related: [
    { href: './sample-stats.html', title: '標本・平均・分散', description: '標本平均と不偏分散の求め方です。' },
    { href: './monte-carlo.html', title: 'Monte Carlo 法', description: '大数の法則を使って、擬似乱数の標本平均で積分を近似します。' },
    { href: './observables.html', title: '温度・圧力・動径分布関数', description: '分子動力学の長い時系列の平均で、巨視的な量を推定します。' },
  ],
  footer: 'この画面の計算は、率 1 の指数分布の擬似乱数（種 1）の標本平均です。',
  proof: writtenProof([
    {
      statement: `（Chebyshev の不等式）確率変数 ${tex('Y')} の分散 ${tex(String.raw`\mathrm{Var}(Y)`)} が有限なら、任意の ${tex(String.raw`\varepsilon > 0`)} について ${tex(String.raw`P(|Y - \mathbb{E}Y| \ge \varepsilon) \le \frac{\mathrm{Var}(Y)}{\varepsilon^2}`)} です。`,
      proof: [
        `${tex(String.raw`D = Y - \mathbb{E}Y`)} と置き、事象 ${tex(String.raw`A = \{|D| \ge \varepsilon\}`)} の指示関数を ${tex(String.raw`\mathbb{I}_A`)}（${tex('A')} が起これば 1、起こらなければ 0）とします。`,
        `${tex('A')} が起こるときは ${tex(String.raw`D^2 \ge \varepsilon^2 = \varepsilon^2\,\mathbb{I}_A`)}、起こらないときは ${tex(String.raw`D^2 \ge 0 = \varepsilon^2\,\mathbb{I}_A`)} です。したがって、つねに
          ${eq(String.raw`\varepsilon^2\,\mathbb{I}_A \le D^2`)}
          です。`,
        `両辺の期待値をとります。${tex(String.raw`\mathbb{E}[\mathbb{I}_A] = P(A)`)}、${tex(String.raw`\mathbb{E}[D^2] = \mathrm{Var}(Y)`)} なので
          ${eq(String.raw`\varepsilon^2 P(|Y - \mathbb{E}Y| \ge \varepsilon) \le \mathrm{Var}(Y)`)}
          で、${tex(String.raw`\varepsilon^2 > 0`)} で割れば主張です。`,
      ],
    },
    {
      statement: `（大数の弱法則）${tex('X_1, X_2, \\ldots')} が平均 ${tex(String.raw`\mu`)}、有限な分散 ${tex(String.raw`\sigma^2`)} の分布に独立に従うとき、任意の ${tex(String.raw`\varepsilon > 0`)} について ${tex(String.raw`\lim_{n \to \infty} P(|\bar{x}_n - \mu| \ge \varepsilon) = 0`)} です。`,
      proof: [
        `手順2の計算により ${tex(String.raw`\mathbb{E}[\bar{x}_n] = \mu`)}、${tex(String.raw`\mathrm{Var}(\bar{x}_n) = \sigma^2/n`)} です。分散の計算には、独立性から出る ${tex(String.raw`\mathrm{Cov}(X_i, X_j) = 0`)}（${tex(String.raw`i \ne j`)}）を使いました。`,
        `Chebyshev の不等式を ${tex(String.raw`Y = \bar{x}_n`)} に使うと
          ${eq(String.raw`0 \le P\left(|\bar{x}_n - \mu| \ge \varepsilon\right) \le \frac{\sigma^2}{n\varepsilon^2}`)}
          です。`,
        `${tex(String.raw`\sigma^2`)} と ${tex(String.raw`\varepsilon`)} は ${tex('n')} によらない定数なので、右辺は ${tex(String.raw`n \to \infty`)} で 0 に収束します。はさみうちにより、確率も 0 に収束します。`,
      ],
    },
  ]),
});

let current: LessonFigure | undefined;

function show(id: string, text: string) {
  const output = document.getElementById(id);
  if (output) output.textContent = text;
}

function paint() {
  const running = document.getElementById('running-chart') as HTMLCanvasElement;
  const histogram = document.getElementById('histogram-chart') as HTMLCanvasElement;
  if (!current) {
    clearFigure(running);
    clearFigure(histogram);
    return;
  }
  drawPlot(running, {
    label: '標本の大きさ n に対する標本平均の推移。実線は種 1 の擬似乱数の標本平均、破線は母平均 1。',
    lines: [...linesWith(current, 'band-'), line(current, 'mu'), line(current, 'running-mean')],
    xMin: 0,
    xMax: current.values.n_max,
    yMin: 0.4,
    yMax: 1.6,
  });
  const bars = current.bars.find(item => item.name === 'z-histogram')!;
  drawPlot(histogram, {
    label: '標準化した標本平均のヒストグラムと、標準正規分布の密度の破線。',
    bars: [{ edges: bars.x, heights: bars.y, role: bars.role }],
    lines: [line(current, 'normal-density')],
    xMin: -4,
    xMax: 4,
    yMin: 0,
  });
}

function fill() {
  if (!current) return;
  const v = current.values;
  show('final-mean', fixed(v.final_mean));
  show('chebyshev', fixed(v.chebyshev));
  show('deviation', `${fixed(v.deviation_fraction, 4)}（${v.deviation_count} / ${v.groups} 組）`);
  show('within', fixed(v.within_one, 4));
  document.getElementById('z-moments')!.textContent = [
    `2000組の Z₃₀ の標本平均 ${fixed(v.z_mean, 4)}（近似、厳密な期待値は 0）`,
    `2000組の Z₃₀ の不偏分散 ${fixed(v.z_variance, 4)}（近似、厳密な分散は 1）`,
    `正規分布による P(|x̄₃₀ − 1| ≥ 0.5) の近似 ${fixed(v.normal_far, 6)}`,
    `標準正規分布の P(|Z| ≤ 1) ${fixed(v.normal_within_one, 6)}（Simpson 則の近似）`,
  ].join('\n');
}

async function load() {
  try {
    current = await lessonFigure('statistics/limit-theorems', { seed: 1 });
    fill();
    paint();
    setStatus('finished');
  } catch {
    setStatus('error');
  }
}

window.addEventListener('resize', paint);
onThemeChange(paint);
void load();
