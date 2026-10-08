import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { coreTypeDoc, fixed, linesWith } from './figures/statistics';
import { eq, experimentPanel, formReader, lessonFigure, line, renderLesson, writtenProof } from './lesson';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'finance/mc-pricing',
  s0: 100,
  strike: 100,
  rate: 0.05,
  sigma: 0.2,
  maturity: 1,
  samples_per_step: 50,
  seed: 1,
  dt: 1,
  steps: 200,
};

renderLesson({
  id: 'mc-pricing',
  section: { label: '金融数学' },
  title: 'Monte Carlo 価格評価',
  description: `欧州型コールオプションの価格は、リスク中立測度のもとでの満期の支払いの期待値を割り引いたものです。満期の株価の擬似乱数の標本 ${tex('M')} 個から支払いの平均をとって価格を推定し、標準誤差 ${tex(String.raw`s/\sqrt{M}`)} とともに Black–Scholes 公式の値へ近づく様子を確かめます。`,
  equation: [
    String.raw`C = e^{-rT}\,\mathbb{E}^{\mathbb{Q}}\left[\max(S_T - K, 0)\right]`,
    String.raw`\hat{C}_M = \frac{1}{M}\sum_{i=1}^{M} Y_i, \qquad \mathrm{SE} = \frac{s_Y}{\sqrt{M}}`,
  ],
  equationLabel: 'コールの価格は e のマイナス rT 乗 掛ける リスク中立測度での max(S_T − K, 0) の期待値。推定量は M 個の割り引いた支払い Y_i の平均。標準誤差は標本標準偏差を ルート M で割ったもの。',
  equationNote: `${tex(String.raw`Y_i = e^{-rT}\max(S_T^{(i)} - K, 0)`)}、${tex(String.raw`S_T^{(i)} = S_0\exp\left((r - \tfrac{1}{2}\sigma^2)T + \sigma\sqrt{T}\,Z^{(i)}\right)`)}、${tex(String.raw`Z^{(i)} \sim \mathcal{N}(0, 1)`)}`,
  studyHeading: '期待値の表現から推定量と標準誤差への手順',
  steps: [
    `記号を定めます。${tex('S_0')} は現在の株価、${tex('K')} は権利行使価格、${tex('r')} は無リスク金利、${tex(String.raw`\sigma`)} はボラティリティ、${tex('T')} は満期までの時間（年）です。Black–Scholes 方程式の解は、株価のドリフト率を ${tex('r')} に置きかえた幾何 Brownian 運動（リスク中立測度 ${tex(String.raw`\mathbb{Q}`)}）のもとでの、割り引いた支払いの期待値で表せます（Feynman–Kac の公式）。
      ${eq(String.raw`C = e^{-rT}\,\mathbb{E}^{\mathbb{Q}}\left[\max(S_T - K, 0)\right]`)}
      ${tex(String.raw`e^{-rT}`)} は、満期の1円を現在の価値に直す連続複利の割引係数です。`,
    `リスク中立測度のもとで、満期の株価は幾何 Brownian 運動の厳密解で、${tex(String.raw`W_T = \sqrt{T}\,Z`)}（${tex(String.raw`Z \sim \mathcal{N}(0, 1)`)}）と書けます。
      ${eq(String.raw`S_T = S_0\exp\left(\left(r - \tfrac{1}{2}\sigma^2\right)T + \sigma\sqrt{T}\,Z\right)`)}
      満期だけが支払いを決めるので、途中の経路を作る必要はありません（${coreDoc('finance', 'risk_neutral_terminal', '満期の株価の説明')}）。${tex(String.raw`\mathbb{E}^{\mathbb{Q}}[S_T] = S_0 e^{rT}`)} で、株価の期待値は無リスク金利で増えます。`,
    `${tex('M')} 個の独立な標本 ${tex(String.raw`Z^{(1)}, \ldots, Z^{(M)}`)} から満期の株価 ${tex(String.raw`S_T^{(i)}`)} を作り、割り引いた支払い
      ${eq(String.raw`Y_i = e^{-rT}\max\left(S_T^{(i)} - K, 0\right)`)}
      の標本平均を推定量とします。
      ${eq(String.raw`\hat{C}_M = \frac{1}{M}\sum_{i=1}^{M} Y_i = e^{-rT}\frac{1}{M}\sum_{i=1}^{M}\max\left(S_T^{(i)} - K, 0\right)`)}
      期待値の線形性から ${tex(String.raw`\mathbb{E}[\hat{C}_M] = C`)} で、大数の法則により ${tex(String.raw`M \to \infty`)} で ${tex(String.raw`\hat{C}_M \to C`)} です。`,
    `${tex(String.raw`\sigma_Y^2 = \mathrm{Var}(Y)`)} とすると、独立性から ${tex(String.raw`\mathrm{Var}(\hat{C}_M) = \sigma_Y^2/M`)} です。${tex(String.raw`\sigma_Y`)} の代わりに不偏分散の平方根 ${tex('s_Y')} を使った
      ${eq(String.raw`s_Y^2 = \frac{1}{M - 1}\sum_{i=1}^{M}\left(Y_i - \hat{C}_M\right)^2, \qquad \mathrm{SE} = \frac{s_Y}{\sqrt{M}}`)}
      を標準誤差と呼びます（${coreDoc('finance', 'price_estimate', '推定値と標準誤差の説明')}）。平均と不偏分散は Welford の逐次更新で、標本を加えるたびに更新します。誤差は ${tex(String.raw`O(1/\sqrt{M})`)} で減り、1桁よい精度には ${tex('100')} 倍の標本が要ります。`,
    `支払いの2乗の期待値は、${tex(String.raw`\mathbb{I}`)} を ${tex('S_T > K')} の指示関数として
      ${eq(String.raw`\mathbb{E}\left[(S_T - K)^2\,\mathbb{I}\right] = S_0^2 e^{(2r + \sigma^2)T}N(d_1 + \sigma\sqrt{T}) - 2KS_0 e^{rT}N(d_1) + K^2 N(d_2)`)}
      で（${coreDoc('finance', 'call_payoff_second_moment', '支払いの2乗の期待値の説明')}）、母標準偏差 ${tex(String.raw`\sigma_Y = e^{-rT}\sqrt{\mathbb{E}[(S_T - K)^2\mathbb{I}] - (e^{rT}C)^2}`)} が求まります（${coreDoc('finance', 'discounted_payoff_sd', '母標準偏差の説明')}）。第2の図の破線 ${tex(String.raw`\sigma_Y/\sqrt{M}`)} です。${tex('N')} は標準正規分布の累積分布関数の近似（誤差 ${tex(String.raw`10^{-15}`)} 以下）で、比べる Black–Scholes 公式の値も、この近似を除けば厳密です。`,
    `${tex(String.raw`Z^{(i)}`)} は、種（seed）から始まる SplitMix64 の擬似乱数を Box–Muller 法で変換した標本です（${coreTypeDoc('statistics', 'Rng', '擬似乱数の生成器の説明')}）。計算の初めに ${tex('k')} 個の標本を作り、1ステップごとに ${tex('k')} 個を加えます。同じ種からは同じ標本が出ます。推定値、標準誤差、ヒストグラムはどれも擬似乱数の標本による近似です。`,
  ],
  figureAlt: '満期の株価の擬似乱数の標本のヒストグラムと対数正規分布の密度、権利行使価格 K = 100 の縦線、および標本数とともに Black–Scholes 公式の値へ近づく推定価格の推移。',
  figure: experimentPanel({
    fieldsetLabel: 'オプションと株価',
    fields: [
      { name: 's0', label: '現在の株価', symbol: 'S_0', value: 100, min: 0, max: 1000000 },
      { name: 'strike', label: '権利行使価格', symbol: 'K', value: 100, min: 0, max: 1000000 },
      { name: 'rate', label: '無リスク金利', symbol: 'r', value: 0.05, min: -1, max: 1 },
      { name: 'sigma', label: 'ボラティリティ', symbol: String.raw`\sigma`, value: 0.2, min: 0, max: 2 },
      { name: 'maturity', label: '満期までの時間', symbol: 'T', value: 1, min: 0, max: 50 },
      { name: 'samples_per_step', label: '1ステップに加える標本の数', symbol: 'k', value: 50, min: 1, max: 5000, step: '1' },
      { name: 'seed', label: '擬似乱数の種', value: 1, min: 0, max: 9007199254740992, step: '1' },
    ],
    dt: 1,
    steps: 200,
    sceneHeading: `満期の株価 ${tex('S_T')} の分布`,
    sceneCaption: `棒は満期の株価の擬似乱数の標本のヒストグラム（区間 ${tex('[0, 250]')}、幅 5）、青緑の破線は対数正規分布の密度、橙の縦線は権利行使価格 ${tex('K')} です。${tex('K')} より右の標本だけが支払いを生みます。時刻 ${tex('t')} はステップ数と時間刻みの積で、満期とは関係しません。`,
    sceneLabel: '満期の株価のヒストグラムと権利行使価格',
    sceneHeight: 320,
    readouts: { position: '推定値 Ĉ_M（近似）', velocity: '標準誤差 SE（近似）', exact: 'Black–Scholes 公式の値（厳密）', error: '差 Ĉ_M − C（近似）' },
    plotsHeading: '推定値と標準誤差の推移',
    legend: '<span><i class="numerical"></i>擬似乱数の標本による推定</span><span><i class="analytical"></i>公式から求めた値</span>',
    plots: `<div class="plot-grid"><div class="plot-main"><h3>推定値 ${tex(String.raw`\hat{C}_M`)} の推移</h3><canvas id="estimate-chart" role="img"></canvas><p>標本数 ${tex('M')}（千個）。灰色の破線は ${tex(String.raw`C \pm \mathrm{SE}`)}</p></div><div class="plot-phase"><h3>標準誤差 ${tex(String.raw`\mathrm{SE}`)} の推移</h3><canvas id="se-chart" role="img"></canvas><p>標本数 ${tex('M')}（千個）。破線は ${tex(String.raw`\sigma_Y/\sqrt{M}`)}</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('S_0 = K = 100')}、${tex('r = 0.05')}、${tex(String.raw`\sigma = 0.2`)}、${tex('T = 1')} とします。${tex(String.raw`(r - \tfrac{1}{2}\sigma^2)T = 0.05 - 0.02 = 0.03`)}、${tex(String.raw`\sigma\sqrt{T} = 0.2`)} なので ${tex(String.raw`S_T = 100\,e^{0.03 + 0.2Z}`)} です。4個の標本 ${tex('Z = -1, 0, 0.5, 1')} では
      ${eq(String.raw`S_T = 100e^{-0.17},\ 100e^{0.03},\ 100e^{0.13},\ 100e^{0.23} \approx 84.3665,\ 103.0455,\ 113.8828,\ 125.8600`)}
      で、支払い ${tex(String.raw`\max(S_T - 100, 0)`)} は ${tex('0,\\ 3.0455,\\ 13.8828,\\ 25.8600')} です。`,
    `支払いの平均と推定値は
      ${eq(String.raw`\frac{0 + 3.0455 + 13.8828 + 25.8600}{4} = \frac{42.7883}{4} \approx 10.6971`)}
      ${eq(String.raw`\hat{C}_4 = e^{-0.05} \cdot 10.6971 \approx 0.951229 \cdot 10.6971 \approx 10.1754`)}
      です。ライブラリの値は、支払いの平均 <output id="example-payoff">—</output>、推定値 <output id="example-estimate">—</output>、標準誤差 <output id="example-se">—</output> です。標本が4個では標準誤差が大きく、推定値は公式の値 10.4506 から大きくずれえます。`,
    `Black–Scholes 公式の値は ${tex(String.raw`C = 100N(0.35) - 100e^{-0.05}N(0.15) \approx 10.450584`)} です（計器の「Black–Scholes 公式の値」）。既定の条件（${tex('k = 50')}、200 ステップ、種 1）では計算の終わりに ${tex(String.raw`M = 50 \cdot 201 = 10050`)} 個の標本があり、標準誤差は約 0.15 です。推定値（種 1 の擬似乱数による近似）は、公式の値から標準誤差の数倍の範囲に入ります。標準誤差を 0.01 にするには ${tex(String.raw`M \approx (14.72/0.01)^2 \approx 2.2 \times 10^6`)} 個の標本が要ります。`,
  ],
  related: [
    { href: './monte-carlo.html', title: 'Monte Carlo 法', description: '期待値を擬似乱数の標本平均で近似する方法と、標準誤差の考え方です。' },
    { href: './gbm.html', title: '幾何 Brownian 運動', description: '満期の株価の式を導く Itô の補題と厳密解です。' },
    { href: './black-scholes.html', title: 'Black–Scholes 方程式', description: '比べている価格の公式と、その導出です。' },
    { href: './limit-theorems.html', title: '大数の法則と中心極限定理', description: '推定値が価格に近づき、そのばらつきが正規分布に近づく理由です。' },
  ],
  footer: 'この画面の計算は、満期の株価の擬似乱数の標本による欧州型コールの価格の推定です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`S_T = S_0\exp((r - \frac{1}{2}\sigma^2)T + \sigma\sqrt{T}Z)`)}、${tex(String.raw`Z \sim \mathcal{N}(0, 1)`)} のとき、${tex(String.raw`e^{-rT}\,\mathbb{E}[\max(S_T - K, 0)] = S_0 N(d_1) - Ke^{-rT}N(d_2)`)} です。すなわち推定量 ${tex(String.raw`\hat{C}_M`)} の期待値は Black–Scholes 公式の値です。`,
    proof: [
      `${tex(String.raw`S_T > K`)} は ${tex(String.raw`Z > -d_2`)} と同じです。実際、対数をとって整理すると ${tex(String.raw`Z > \frac{\ln(K/S_0) - (r - \sigma^2/2)T}{\sigma\sqrt{T}} = -d_2`)} です。よって
        ${eq(String.raw`\mathbb{E}[\max(S_T - K, 0)] = \int_{-d_2}^{\infty}\left(S_0 e^{(r - \sigma^2/2)T + \sigma\sqrt{T}z} - K\right)\varphi(z)\,dz`)}
        です。`,
      `第2項は ${tex(String.raw`K\int_{-d_2}^{\infty}\varphi(z)\,dz = K\,P(Z > -d_2) = K N(d_2)`)} です。第1項は指数を平方完成して
        ${eq(String.raw`\sigma\sqrt{T}z - \frac{z^2}{2} = -\frac{(z - \sigma\sqrt{T})^2}{2} + \frac{\sigma^2 T}{2}`)}
        ${eq(String.raw`S_0 e^{(r - \sigma^2/2)T}e^{\sigma^2 T/2}\int_{-d_2}^{\infty}\varphi(z - \sigma\sqrt{T})\,dz = S_0 e^{rT}\,P(Z > -d_2 - \sigma\sqrt{T}) = S_0 e^{rT}N(d_1)`)}
        です。${tex(String.raw`d_2 + \sigma\sqrt{T} = d_1`)} を使いました。`,
      `二つの項を合わせて ${tex(String.raw`e^{-rT}`)} を掛けると
        ${eq(String.raw`e^{-rT}\,\mathbb{E}[\max(S_T - K, 0)] = S_0 N(d_1) - Ke^{-rT}N(d_2)`)}
        です。${tex(String.raw`\mathbb{E}[\hat{C}_M] = \mathbb{E}[Y_1]`)} なので、推定量の期待値はこの値に等しくなります。`,
    ],
  }]),
});

const form = formReader(defaults);

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'estimate-chart', 'se-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = JSON.stringify(config);
  const bars = frame.bars.find(item => item.name === 'histogram')!;
  drawPlot(canvases[0], {
    key: `${key}|histogram`,
    label: '満期の株価の擬似乱数の標本のヒストグラムと、対数正規分布の密度。縦線は権利行使価格 K。',
    bars: [{ edges: bars.x, heights: bars.y, role: bars.role }],
    lines: [line(frame, 'density'), line(frame, 'strike', 'K')],
    xMin: 0,
    xMax: 250,
    yMin: 0,
  });
  const estimate = line(frame, 'estimate');
  const m = estimate.x[estimate.x.length - 1];
  drawPlot(canvases[1], {
    key: `${key}|estimate`,
    label: '標本数 M に対するコールの価格の推定値。実線は推定値、破線は Black–Scholes 公式の値、灰色の破線は C ± SE。',
    lines: [...linesWith(frame, 'band-'), line(frame, 'price'), estimate],
    dots: [{ x: m, y: state.position, role: 'numerical' }],
    xMin: 0,
  });
  drawPlot(canvases[2], {
    key: `${key}|se`,
    label: '標本数 M に対する標準誤差。実線は標本から求めた SE、破線は σ_Y/√M。',
    lines: [line(frame, 'se-exact'), line(frame, 'se')],
    dots: [{ x: m, y: state.velocity, role: 'numerical' }],
    xMin: 0,
    yMin: 0,
  });
}

mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-mc-pricing.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `擬似乱数の種 ${v ? v.seed : '—'}`,
      `標本数 M ${v ? v.samples : '—'}`,
      `S_T > K の標本の数 ${v ? v.in_the_money : '—'}`,
      `推定値 Ĉ_M ${fixed(v?.estimate)}（近似）`,
      `標準誤差 SE ${fixed(v?.standard_error)}（近似）`,
      `Black–Scholes 公式の値 ${fixed(v?.price)}（N の近似を除き厳密）`,
      `σ_Y/√M ${fixed(state.exact_velocity)}（N の近似を除き厳密）`,
    ].join('\n');
  },
});

async function loadExample() {
  const example = await lessonFigure('finance/mc-pricing');
  const show = (id: string, text: string) => { document.getElementById(id)!.textContent = text; };
  show('example-payoff', fixed(example.values.payoff_mean));
  show('example-estimate', fixed(example.values.estimate));
  show('example-se', fixed(example.values.standard_error));
}
void loadExample();
