import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { coreTypeDoc, fixed, linesWith, seriesDots } from './figures/statistics';
import { eq, experimentPanel, formReader, line, renderLesson, writtenProof } from './lesson';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'statistics/monte-carlo',
  points_per_step: 20,
  seed: 1,
  dt: 1,
  steps: 200,
};

renderLesson({
  id: 'monte-carlo',
  section: { label: '統計学' },
  title: 'Monte Carlo 法',
  description: `期待値 ${tex(String.raw`\mathbb{E}[g(X)] = \int g(x)\,p(x)\,dx`)} を、擬似乱数の標本 ${tex('x_1, \\ldots, x_N')} の平均で近似します。単位正方形に点を打ち、四分円の内側に入った点の割合から円周率 ${tex(String.raw`\pi`)} を推定し、誤差が ${tex(String.raw`1/\sqrt{N}`)} の速さで小さくなることを確かめます。`,
  equation: [
    String.raw`\hat{I}_N = \frac{1}{N}\sum_{i=1}^{N} g(x_i), \qquad \mathrm{SE} = \frac{s_g}{\sqrt{N}}`,
    String.raw`\hat{\pi}_N = 4\,\frac{N_{\mathrm{in}}}{N}`,
  ],
  equationNote: `${tex(String.raw`N_{\mathrm{in}}`)} は ${tex(String.raw`x_i^2 + y_i^2 \le 1`)} を満たす点の数`,
  studyHeading: '期待値の標本平均による近似と標準誤差の手順',
  steps: [
    `記号を定めます。${tex('X')} は確率密度 ${tex('p(x)')} に従う確率変数、${tex('g')} は関数で、求めたい値は ${tex(String.raw`I = \mathbb{E}[g(X)] = \int g(x)\,p(x)\,dx`)} です。${tex('x_1, \\ldots, x_N')} を ${tex('p')} に独立に従う標本とし、推定量を ${tex(String.raw`\hat{I}_N = \frac{1}{N}\sum_{i=1}^{N} g(x_i)`)} とします。期待値の線形性と大数の法則により
      ${eq(String.raw`\mathbb{E}[\hat{I}_N] = \frac{1}{N}\sum_{i=1}^{N}\mathbb{E}[g(x_i)] = I, \qquad \hat{I}_N \to I \quad (N \to \infty)`)}
      です。`,
    `${tex(String.raw`\sigma_g^2 = \mathrm{Var}(g(X))`)} とすると、独立性から
      ${eq(String.raw`\mathrm{Var}(\hat{I}_N) = \frac{1}{N^2}\sum_{i=1}^{N}\mathrm{Var}(g(x_i)) = \frac{\sigma_g^2}{N}`)}
      で、推定量の標準偏差は ${tex(String.raw`\sigma_g/\sqrt{N}`)} です。${tex(String.raw`\sigma_g`)} の代わりに標本の標準偏差 ${tex('s_g')} を使った ${tex(String.raw`\mathrm{SE} = s_g/\sqrt{N}`)} を標準誤差と呼びます（${coreDoc('statistics', 'standard_error', '標準誤差の説明')}）。誤差は ${tex(String.raw`O(1/\sqrt{N})`)} で減り、1桁よい精度には ${tex('100')} 倍の標本が要ります。この速さは積分の次元によりません。`,
    `円周率の推定では、${tex('(x, y)')} を単位正方形 ${tex('[0, 1)^2')} 上の一様分布とし、
      ${eq(String.raw`g(x, y) = 4\,\mathbb{I}(x^2 + y^2 \le 1)`)}
      と置きます。${tex(String.raw`\mathbb{I}`)} は、条件が成り立てば 1、成り立たなければ 0 です。四分円の面積は ${tex(String.raw`\pi/4`)} なので ${tex(String.raw`\mathbb{E}[g] = 4 \cdot \pi/4 = \pi`)} で、推定値は
      ${eq(String.raw`\hat{\pi}_N = \frac{1}{N}\sum_{i=1}^{N} 4\,\mathbb{I}(x_i^2 + y_i^2 \le 1) = 4\,\frac{N_{\mathrm{in}}}{N}`)}
      です（${coreDoc('statistics', 'pi_estimate', '円周率の推定値の説明')}）。`,
    `内側の割合を ${tex(String.raw`\hat{p} = N_{\mathrm{in}}/N`)} とします。${tex('g_i')} は ${tex('4')} か ${tex('0')} なので、不偏分散と標準誤差は
      ${eq(String.raw`s_g^2 = \frac{1}{N - 1}\left[N_{\mathrm{in}}(4 - \hat{\pi}_N)^2 + (N - N_{\mathrm{in}})\,\hat{\pi}_N^2\right] = \frac{16N\hat{p}(1 - \hat{p})}{N - 1}`)}
      ${eq(String.raw`\mathrm{SE} = \frac{s_g}{\sqrt{N}} = 4\sqrt{\frac{\hat{p}(1 - \hat{p})}{N - 1}}`)}
      です。母集団の値は ${tex(String.raw`\sigma_g^2 = \pi(4 - \pi) \approx 2.696766`)}（${coreDoc('statistics', 'pi_indicator_sd', '母標準偏差の説明')}）で、第2の図の破線 ${tex(String.raw`\sigma_g/\sqrt{N}`)} です。`,
    `点の座標は、種（seed）${tex('s_0')} から始まる SplitMix64 の擬似乱数 ${tex('z_k')} の上位 53 ビットを ${tex('[0, 1)')} の数 ${tex(String.raw`U_k = \lfloor z_k/2^{11}\rfloor \cdot 2^{-53}`)} にしたもので、${tex(String.raw`(x_i, y_i) = (U_{2i-1}, U_{2i})`)} です（${coreTypeDoc('statistics', 'Rng', '擬似乱数の生成器の説明')}）。同じ種からは同じ点が出ます。計算の初めに ${tex('k')} 個の点を打ち、1ステップごとに ${tex('k')} 個を加えます。推定値と標準誤差はどれも擬似乱数の標本による近似です。`,
  ],
  figureAlt: '単位正方形に打たれた点のうち四分円の内側と外側の点、および点の数とともに円周率へ近づく推定値の折れ線と ±SE の帯。',
  figure: experimentPanel({
    fieldsetLabel: '標本点',
    fields: [
      { name: 'points_per_step', label: '1ステップに加える点の数', symbol: 'k', value: 20, min: 2, max: 1000, step: '1' },
      { name: 'seed', label: '擬似乱数の種', symbol: 's_0', value: 1, min: 0, max: 9007199254740992, step: '1' },
    ],
    dt: 1,
    steps: 200,
    sceneHeading: '単位正方形の点と四分円',
    sceneCaption: `青の点は四分円 ${tex(String.raw`x^2 + y^2 \le 1`)} の内側、灰色の点は外側の擬似乱数の点です。青緑の破線は四分円の弧です。時刻 ${tex('t')} はステップ数と時間刻みの積で、点の数とは関係しません。図には最初の 6000 点を描きます。`,
    sceneLabel: '単位正方形に打たれた擬似乱数の点と四分円',
    sceneHeight: 320,
    readouts: { position: '推定値 π̂_N（近似）', velocity: '標準誤差 SE（近似）', exact: '円周率 π（小数5桁）', error: '差 π̂_N − π（近似）' },
    plotsHeading: '推定値と標準誤差の推移',
    legend: '<span><i class="numerical"></i>擬似乱数の標本による推定</span><span><i class="analytical"></i>厳密な値</span>',
    plots: `<div class="plot-grid"><div class="plot-main"><h3>推定値 ${tex(String.raw`\hat{\pi}_N`)} の推移</h3><canvas id="estimate-chart" role="img"></canvas><p>点の数 ${tex('N')}（千個）。灰色の破線は ${tex(String.raw`\pi \pm \mathrm{SE}`)}</p></div><div class="plot-phase"><h3>標準誤差 ${tex(String.raw`\mathrm{SE}`)} の推移</h3><canvas id="se-chart" role="img"></canvas><p>点の数 ${tex('N')}（千個）。破線は ${tex(String.raw`\sigma_g/\sqrt{N}`)}</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('N = 100')} 個の点のうち ${tex(String.raw`N_{\mathrm{in}} = 80`)} 個が内側にあったとします。${tex(String.raw`\hat{p} = 0.8`)} で、
      ${eq(String.raw`\hat{\pi}_{100} = 4 \cdot \frac{80}{100} = 3.2, \qquad \mathrm{SE} = 4\sqrt{\frac{0.8 \cdot 0.2}{99}} = \frac{1.6}{\sqrt{99}} \approx 0.160806`)}
      です。推定値 3.2 と ${tex(String.raw`\pi`)} の差 ${tex(String.raw`0.0584`)} は、標準誤差の約 0.36 倍です。`,
    `既定の条件（${tex('k = 20')}、200 ステップ、種 1）では、計算の終わりに ${tex('N = 20 \\cdot 201 = 4020')} 個の点があり、そのうち ${tex(String.raw`N_{\mathrm{in}} = 3206`)} 個が内側です。
      ${eq(String.raw`\hat{\pi}_{4020} = 4 \cdot \frac{3206}{4020} = \frac{12824}{4020} \approx 3.190050`)}
      ${eq(String.raw`\mathrm{SE} = 4\sqrt{\frac{0.797512 \cdot 0.202488}{4019}} \approx 0.025355, \qquad \frac{\sigma_g}{\sqrt{N}} = \sqrt{\frac{\pi(4 - \pi)}{4020}} \approx 0.025901`)}
      で、どれも種 1 の擬似乱数の標本による近似です。この標本では差 ${tex(String.raw`\hat{\pi}_N - \pi \approx 0.0485`)} が標準誤差の約 1.9 倍です。種を変えると点が変わり、差も変わります。`,
    `標準誤差を 0.025901 の半分にするには、${tex('N')} を4倍の 16080 にします。小数第3位まで ${tex(String.raw`\pi`)} を求めるため標準誤差を ${tex('0.0005')} にするには ${tex(String.raw`N \approx 2.696766/0.0005^2 \approx 1.08 \times 10^{7}`)} 個の点が要ります。`,
  ],
  related: [
    { href: './limit-theorems.html', title: '大数の法則と中心極限定理' },
    { href: './mc-pricing.html', title: 'Monte Carlo 価格評価' },
    { href: './observables.html', title: '温度・圧力・動径分布関数' },
  ],
  footer: 'この画面の計算は、単位正方形の擬似乱数の点による円周率の推定です。',
  proof: writtenProof([{
    statement: `${tex('(x_i, y_i)')}（${tex('i = 1, \\ldots, N')}）が単位正方形上の一様分布に独立に従うとき、${tex(String.raw`\hat{\pi}_N = 4N_{\mathrm{in}}/N`)} は ${tex(String.raw`\mathbb{E}[\hat{\pi}_N] = \pi`)}、${tex(String.raw`\mathrm{Var}(\hat{\pi}_N) = \pi(4 - \pi)/N`)} を満たします。`,
    proof: [
      `一様分布の密度は正方形の上で 1 なので、一つの点が四分円 ${tex(String.raw`D = \{x^2 + y^2 \le 1,\ x, y \ge 0\}`)} に入る確率はその面積で、極座標で計算して
        ${eq(String.raw`p = \iint_D dx\,dy = \int_0^{\pi/2}\!\!\int_0^1 r\,dr\,d\theta = \frac{\pi}{2}\cdot\frac{1}{2} = \frac{\pi}{4}`)}
        です。`,
      `${tex(String.raw`g_i = 4\,\mathbb{I}((x_i, y_i) \in D)`)} は確率 ${tex('p')} で 4、確率 ${tex('1 - p')} で 0 をとるので
        ${eq(String.raw`\mathbb{E}[g_i] = 4p = \pi, \qquad \mathbb{E}[g_i^2] = 16p = 4\pi, \qquad \mathrm{Var}(g_i) = 4\pi - \pi^2 = \pi(4 - \pi)`)}
        です。`,
      `${tex(String.raw`\hat{\pi}_N = \frac{1}{N}\sum_i g_i`)} なので、期待値の線形性から ${tex(String.raw`\mathbb{E}[\hat{\pi}_N] = \pi`)} です。${tex('g_i')} は独立なので分散は足し合わせられ、
        ${eq(String.raw`\mathrm{Var}(\hat{\pi}_N) = \frac{1}{N^2}\cdot N\pi(4 - \pi) = \frac{\pi(4 - \pi)}{N}`)}
        です。`,
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
  drawPlot(canvases[0], {
    label: '単位正方形の擬似乱数の点。青は四分円の内側、灰色は外側。破線は四分円の弧。',
    lines: [line(frame, 'arc')],
    dots: [...seriesDots(frame, 'outside', 1.3), ...seriesDots(frame, 'inside', 1.3)],
    equalAspect: true,
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
    pad: 0,
  });
  const estimate = line(frame, 'estimate');
  const n = estimate.x[estimate.x.length - 1];
  drawPlot(canvases[1], {
    key: `${key}|estimate`,
    label: '点の数 N に対する円周率の推定値。実線は推定値、破線は π、灰色の破線は π ± SE。',
    lines: [...linesWith(frame, 'band-'), line(frame, 'pi'), estimate],
    dots: [{ x: n, y: state.position, role: 'numerical' }],
    xMin: 0,
    yMin: 2.6,
    yMax: 3.7,
  });
  drawPlot(canvases[2], {
    key: `${key}|se`,
    label: '点の数 N に対する標準誤差。実線は標本から求めた SE、破線は σ_g/√N。',
    lines: [line(frame, 'se-exact'), line(frame, 'se')],
    dots: [{ x: n, y: state.velocity, role: 'numerical' }],
    xMin: 0,
    yMin: 0,
  });
}

mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-monte-carlo.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `擬似乱数の種 ${v ? v.seed : '—'}`,
      `点の数 N ${v ? v.samples : '—'}`,
      `内側の点の数 N_in ${v ? v.inside : '—'}`,
      `推定値 π̂_N ${fixed(v?.estimate)}（近似）`,
      `標準誤差 SE ${fixed(v?.standard_error)}（近似）`,
      `σ_g/√N ${fixed(state.exact_velocity)}（近似）`,
    ].join('\n');
  },
});
