import { coreDoc } from './chrome';
import { clearFigure, drawPlot } from './figures';
import { coreTypeDoc, fixed, linesWith } from './figures/statistics';
import { eq, experimentPanel, formReader, lessonFigure, line, renderLesson, writtenProof } from './lesson';
import { bindMethodTabs, methodTabs } from './method-tabs';
import type { LessonConfig, Snapshot } from './protocol';
import { mountSession } from './session';
import { tex } from './tex';

const defaults: LessonConfig = {
  schema_version: 1,
  kind: 'finance/gbm',
  s0: 100,
  mu: 0.08,
  sigma: 0.3,
  paths: 1000,
  seed: 1,
  dt: 0.01,
  steps: 100,
};

renderLesson({
  id: 'gbm',
  section: { label: '金融数学' },
  title: '幾何 Brownian 運動',
  description: `株価 ${tex('S_t')} の相対的な変化が、一定の成長率 ${tex(String.raw`\mu`)} と Brownian 運動による揺らぎ ${tex(String.raw`\sigma\,dW_t`)} の和になるモデルです。Itô の補題で対数価格の式を導いて厳密解を求め、同じ擬似乱数の増分で進めた Euler–Maruyama 法の経路と比べます。`,
  equation: [
    String.raw`dS_t = \mu S_t\,dt + \sigma S_t\,dW_t`,
    String.raw`S_t = S_0 \exp\left(\left(\mu - \tfrac{1}{2}\sigma^2\right)t + \sigma W_t\right)`,
  ],
  studyHeading: 'Itô の補題から厳密解と離散化への手順',
  steps: [
    `記号を定めます。${tex('S_t > 0')} は時刻 ${tex('t')}（年）の株価、${tex('S_0')} は初期価格、${tex(String.raw`\mu`)} はドリフト率、${tex(String.raw`\sigma > 0`)} はボラティリティです。${tex('W_t')} は標準 Brownian 運動で、${tex('W_0 = 0')}、重ならない区間の増分は独立、増分 ${tex('W_{t+h} - W_t')} は平均 0、分散 ${tex('h')} の正規分布 ${tex(String.raw`\mathcal{N}(0, h)`)} に従います。方程式 ${tex(String.raw`dS_t = \mu S_t\,dt + \sigma S_t\,dW_t`)} は、短い時間 ${tex(String.raw`\Delta t`)} の相対的な変化が
      ${eq(String.raw`\frac{\Delta S}{S} \approx \mu\,\Delta t + \sigma\,\Delta W, \qquad \Delta W \sim \mathcal{N}(0, \Delta t)`)}
      であることを表します。`,
    `${tex(String.raw`\Delta W`)} の2乗は、平均が ${tex(String.raw`\mathbb{E}[(\Delta W)^2] = \Delta t`)}、分散が ${tex(String.raw`\mathrm{Var}((\Delta W)^2) = 2\Delta t^2`)} です。区間 ${tex('[0, t]')} を ${tex('n')} 等分した増分の2乗の和は、平均 ${tex('t')}、分散 ${tex(String.raw`2t^2/n`)} なので、${tex(String.raw`n \to \infty`)} で ${tex('t')} に近づきます。この規則を
      ${eq(String.raw`(dW_t)^2 = dt, \qquad dt\,dW_t = 0, \qquad (dt)^2 = 0`)}
      と書きます。2回微分できる関数 ${tex('f')} について Taylor 展開を2次まで書き、この規則を使うと Itô の補題
      ${eq(String.raw`df(S_t) = f'(S_t)\,dS_t + \frac{1}{2}f''(S_t)\,(dS_t)^2`)}
      ${eq(String.raw`(dS_t)^2 = \sigma^2 S_t^2\,(dW_t)^2 = \sigma^2 S_t^2\,dt`)}
      を得ます。通常の微分と違い、2次の項が ${tex('dt')} の大きさで残ります。`,
    `${tex(String.raw`f(S) = \ln S`)} とします。${tex(String.raw`f'(S) = 1/S`)}、${tex(String.raw`f''(S) = -1/S^2`)} なので
      ${eq(String.raw`d(\ln S_t) = \frac{1}{S_t}\left(\mu S_t\,dt + \sigma S_t\,dW_t\right) - \frac{1}{2}\cdot\frac{1}{S_t^2}\,\sigma^2 S_t^2\,dt`)}
      各項を約分します。
      ${eq(String.raw`\frac{1}{S_t}\cdot\mu S_t = \mu, \qquad \frac{1}{S_t}\cdot\sigma S_t = \sigma, \qquad -\frac{1}{2}\cdot\frac{1}{S_t^2}\cdot\sigma^2 S_t^2 = -\frac{1}{2}\sigma^2`)}
      ${eq(String.raw`d(\ln S_t) = \mu\,dt + \sigma\,dW_t - \tfrac{1}{2}\sigma^2\,dt = \left(\mu - \tfrac{1}{2}\sigma^2\right)dt + \sigma\,dW_t`)}
      です。右辺の係数は定数なので、${tex('0')} から ${tex('t')} まで積分できます。
      ${eq(String.raw`\ln S_t - \ln S_0 = \left(\mu - \tfrac{1}{2}\sigma^2\right)t + \sigma\,(W_t - W_0)`)}
      ${eq(String.raw`S_t = S_0 \exp\left(\left(\mu - \tfrac{1}{2}\sigma^2\right)t + \sigma W_t\right)`)}
      これが厳密解です（${coreDoc('finance', 'gbm_exact', '厳密解の説明')}）。${tex(String.raw`W_t \sim \mathcal{N}(0, t)`)} なので、対数価格は正規分布
      ${eq(String.raw`\ln S_t \sim \mathcal{N}\left(\ln S_0 + \left(\mu - \tfrac{1}{2}\sigma^2\right)t,\ \sigma^2 t\right)`)}
      に従い（${coreDoc('finance', 'log_price_density', '対数価格の密度の説明')}）、${tex('S_t')} は対数正規分布に従います。期待値は ${tex(String.raw`\mathbb{E}[S_t] = S_0 e^{\mu t}`)} です（${coreDoc('finance', 'gbm_mean', '期待値の説明')}、証明はページの最後）。`,
    `時刻を ${tex(String.raw`t_n = n\Delta t`)} に区切り、増分を ${tex(String.raw`\Delta W_n = \sqrt{\Delta t}\,Z_n`)}（${tex(String.raw`Z_n \sim \mathcal{N}(0, 1)`)}）で作ります。Euler–Maruyama 法は、方程式の係数を区間の始めの値で止めた更新です（${coreDoc('finance', 'gbm_euler_maruyama_step', 'Euler–Maruyama 法の説明')}）。
      ${eq(String.raw`S_{n+1} = S_n + \mu S_n\,\Delta t + \sigma S_n\sqrt{\Delta t}\,Z_n`)}
      対数価格の厳密な更新は、手順3の式を1ステップ分だけ使います（${coreDoc('finance', 'gbm_exact_step', '厳密な更新の説明')}）。
      ${eq(String.raw`S_{n+1} = S_n \exp\left(\left(\mu - \tfrac{1}{2}\sigma^2\right)\Delta t + \sigma\sqrt{\Delta t}\,Z_n\right)`)}
      画面では、どちらのタブでも同じ ${tex('Z_n')} から ${tex(String.raw`W_{t_n} = \sum_{k<n}\Delta W_k`)} を作り、厳密解を同時に計算します。したがって数値解と厳密解の差は、乱数の違いを含まない離散化の誤差です。Euler–Maruyama 法の経路ごとの誤差は、${tex(String.raw`\Delta t`)} を小さくすると ${tex(String.raw`\Delta t^{1/2}`)} 程度の速さで小さくなります。対数価格の更新の差は丸めの大きさです。`,
    `Euler–Maruyama 法の期待値は、${tex('Z_n')} が ${tex('S_n')} と独立で平均 0 なので ${tex(String.raw`\mathbb{E}[S_{n+1}] = (1 + \mu\Delta t)\,\mathbb{E}[S_n]`)}、すなわち ${tex(String.raw`\mathbb{E}[S_n] = S_0(1 + \mu\Delta t)^{n}`)} です。これは年 ${tex(String.raw`1/\Delta t`)} 回の複利と同じ式で、${tex(String.raw`\Delta t \to 0`)} で ${tex(String.raw`S_0 e^{\mu t}`)} に近づきます。${tex('Z_n')} は、種（seed）から始まる SplitMix64 の擬似乱数を Box–Muller 法で変換した標本です（${coreTypeDoc('statistics', 'Rng', '擬似乱数の生成器の説明')}）。1ステップごとに、経路 ${tex('1, 2, \\ldots, M')} の順に一つずつ作ります。同じ種からは同じ経路が出ます。標本平均とヒストグラムは、どれも擬似乱数の標本による近似です。`,
  ],
  figureAlt: '初期価格 100 から揺らぎながら進む多数の株価の経路と、終端の対数価格のヒストグラムに重なる正規分布の密度。',
  figure: experimentPanel({
    fieldsetLabel: '株価のモデル',
    fields: [
      { name: 's0', label: '初期価格', symbol: 'S_0', value: 100, min: 0 },
      { name: 'mu', label: 'ドリフト率', symbol: String.raw`\mu`, value: 0.08, min: -2, max: 2 },
      { name: 'sigma', label: 'ボラティリティ', symbol: String.raw`\sigma`, value: 0.3, min: 0, max: 2 },
      { name: 'paths', label: '経路の数', symbol: 'M', value: 1000, min: 2, max: 5000, step: '1' },
      { name: 'seed', label: '擬似乱数の種', value: 1, min: 0, max: 9007199254740992, step: '1' },
    ],
    dt: 0.01,
    steps: 100,
    sceneHeading: `株価の経路 ${tex('S_t')}`,
    sceneCaption: `青の実線は、選んだ方法で進めた最初の 8 本の経路（擬似乱数の標本）です。青緑の破線は、同じ増分 ${tex(String.raw`\Delta W_n`)} による厳密解です。二つの線の間隔が離散化の誤差です。`,
    sceneLabel: '初期価格から揺らぎながら進む株価の経路',
    sceneHeight: 320,
    readouts: { position: '経路1の数値解 S（近似）', velocity: '全経路の標本平均（近似）', exact: '経路1の厳密解（同じ増分）', error: '経路1の差 S − S_exact（近似）' },
    plotsHeading: '標本平均の推移と対数価格の分布',
    legend: '<span><i class="numerical"></i>擬似乱数の標本による値</span><span><i class="analytical"></i>厳密な値</span>',
    tabs: methodTabs('確率微分方程式の数値解法', [{ id: 'euler-maruyama', label: 'Euler–Maruyama 法' }, { id: 'log-exact', label: '対数価格の厳密な更新' }]),
    plots: `<div class="plot-grid"><div class="plot-main"><h3>標本平均 ${tex(String.raw`\bar{S}_t`)} と期待値 ${tex(String.raw`S_0 e^{\mu t}`)}</h3><canvas id="mean-chart" role="img"></canvas><p>横軸は時間 ${tex('t')}（年）</p></div><div class="plot-phase"><h3>対数価格 ${tex(String.raw`\ln S_t`)} の分布</h3><canvas id="log-chart" role="img"></canvas><p>横軸 ${tex(String.raw`\ln S_t`)}。棒は全経路のヒストグラム、破線は正規分布の密度</p></div></div>`,
  }),
  exampleHeading: '数を代入した例',
  example: [
    `${tex('S_0 = 100')}、${tex(String.raw`\mu = 0.08`)}、${tex(String.raw`\sigma = 0.3`)}、${tex(String.raw`\Delta t = 0.01`)} とし、1ステップの標本を ${tex('Z_0 = 0.5')} とします。${tex(String.raw`\sqrt{\Delta t} = 0.1`)} なので ${tex(String.raw`\Delta W_0 = 0.05`)} です。Euler–Maruyama 法では
      ${eq(String.raw`S_1 = 100 + 100 \cdot 0.08 \cdot 0.01 + 100 \cdot 0.3 \cdot 0.05 = 100 + 0.08 + 1.5 = 101.58`)}
      です。ライブラリの値は <output id="example-em">—</output> です。`,
    `厳密な更新では、指数は ${tex(String.raw`(0.08 - \tfrac{1}{2}\cdot 0.09)\cdot 0.01 + 0.3 \cdot 0.05 = 0.00035 + 0.015 = 0.01535`)} で、
      ${eq(String.raw`e^{0.01535} \approx 1 + 0.01535 + \frac{0.01535^2}{2} + \frac{0.01535^3}{6} \approx 1.01546842`)}
      ${eq(String.raw`S_1 = 100\,e^{0.01535} \approx 101.546842`)}
      です。ライブラリの値は <output id="example-exact">—</output>、差は <output id="example-gap">—</output> です。Euler–Maruyama 法は ${tex(String.raw`\tfrac{1}{2}\sigma^2\Delta t`)} の補正と2次以上の項を落とすので、1ステップで約 0.033 大きくなります。`,
    `既定の条件（${tex('M = 1000')}、100 ステップ、種 1）で ${tex('t = 1')} まで進めると、期待値は ${tex(String.raw`100\,e^{0.08} \approx 108.328707`)} です。全経路の標本平均の標準偏差は ${tex(String.raw`108.33\sqrt{e^{0.09} - 1}/\sqrt{1000} \approx 1.05`)} なので、標本平均（種 1 の擬似乱数による近似）は、この程度の幅で期待値からずれます。対数価格の分散は厳密には ${tex(String.raw`\sigma^2 t = 0.09`)} で、計器の下に標本の分散（近似）を並べます。`,
  ],
  related: [
    { href: './euler.html', title: 'Euler法' },
    { href: './monte-carlo.html', title: 'Monte Carlo 法' },
    { href: './limit-theorems.html', title: '大数の法則と中心極限定理' },
    { href: './black-scholes.html', title: 'Black–Scholes 方程式' },
    { href: './compound.html', title: '連続複利と指数成長' },
  ],
  footer: 'この画面の計算は、幾何 Brownian 運動に従う多数の株価の擬似乱数の経路です。',
  proof: writtenProof([{
    statement: `${tex(String.raw`S_t = S_0\exp\left((\mu - \frac{1}{2}\sigma^2)t + \sigma W_t\right)`)}、${tex(String.raw`W_t \sim \mathcal{N}(0, t)`)} のとき、${tex(String.raw`\mathbb{E}[S_t] = S_0 e^{\mu t}`)} です。`,
    proof: [
      `${tex('t > 0')} とし、${tex(String.raw`W_t = \sqrt{t}\,Z`)}（${tex(String.raw`Z \sim \mathcal{N}(0, 1)`)}）と書きます。標準正規分布の密度 ${tex(String.raw`\varphi(z) = \frac{1}{\sqrt{2\pi}}e^{-z^2/2}`)} を使うと
        ${eq(String.raw`\mathbb{E}\left[e^{\sigma W_t}\right] = \int_{-\infty}^{\infty} e^{\sigma\sqrt{t}\,z}\,\frac{1}{\sqrt{2\pi}}e^{-z^2/2}\,dz`)}
        です。`,
      `指数の部分を平方完成します。
        ${eq(String.raw`\sigma\sqrt{t}\,z - \frac{z^2}{2} = -\frac{(z - \sigma\sqrt{t})^2}{2} + \frac{\sigma^2 t}{2}`)}
        なので
        ${eq(String.raw`\mathbb{E}\left[e^{\sigma W_t}\right] = e^{\sigma^2 t/2}\int_{-\infty}^{\infty}\frac{1}{\sqrt{2\pi}}e^{-(z - \sigma\sqrt{t})^2/2}\,dz = e^{\sigma^2 t/2}`)}
        です。最後の積分は平均 ${tex(String.raw`\sigma\sqrt{t}`)} の正規分布の密度の積分で、1 です。`,
      `期待値の線形性により
        ${eq(String.raw`\mathbb{E}[S_t] = S_0 e^{(\mu - \sigma^2/2)t}\,\mathbb{E}\left[e^{\sigma W_t}\right] = S_0 e^{(\mu - \sigma^2/2)t}\,e^{\sigma^2 t/2} = S_0 e^{\mu t}`)}
        です。${tex('t = 0')} では ${tex('S_0 = S_0 e^0')} で成り立ちます。`,
    ],
  }]),
});

const form = formReader(defaults);
let method = 'euler-maruyama';

function paintFigures(state: Snapshot | undefined, _points: Snapshot[], config: LessonConfig) {
  const canvases = ['scene', 'mean-chart', 'log-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
  const frame = state?.frame;
  if (!state || !frame) {
    for (const canvas of canvases) clearFigure(canvas);
    return;
  }
  const key = `${JSON.stringify(config)}|${method}`;
  const timeEnd = config.steps * config.dt;
  drawPlot(canvases[0], {
    key: `${key}|paths`,
    label: '最初の 8 本の株価の経路。実線は選んだ方法の数値解、破線は同じ増分による厳密解。',
    lines: [...linesWith(frame, 'exact-'), ...linesWith(frame, 'path-', 1.6)],
    dots: [{ x: state.time, y: state.position, role: 'numerical' }],
    xMin: 0,
    xMax: timeEnd,
  });
  drawPlot(canvases[1], {
    key: `${key}|mean`,
    label: '全経路の標本平均の推移。実線は標本平均、破線は期待値 S0 e の μt 乗。',
    lines: [line(frame, 'expected'), line(frame, 'mean')],
    dots: [{ x: state.time, y: state.velocity, role: 'numerical' }],
    xMin: 0,
    xMax: timeEnd,
  });
  const bars = frame.bars.find(item => item.name === 'log-histogram')!;
  drawPlot(canvases[2], {
    label: '全経路の対数価格のヒストグラムと、正規分布の密度。',
    bars: [{ edges: bars.x, heights: bars.y, role: bars.role }],
    lines: [line(frame, 'log-density')],
    yMin: 0,
  });
}

const session = mountSession({
  defaults,
  model: 'lesson',
  downloadName: 'ergion-gbm.json',
  readForm: form.read,
  fillForm: form.fill,
  paintFigures,
  method: () => method,
  comparison: state => {
    const v = state.frame?.values;
    return [
      `擬似乱数の種 ${v ? v.seed : '—'}`,
      `経路の数 M ${v ? v.paths : '—'}`,
      `数値解の標本平均 ${fixed(v?.mean)}（近似）`,
      `厳密解の標本平均 ${fixed(v?.mean_exact)}（近似）`,
      `期待値 S₀ exp(μt) ${fixed(v?.expected)}（厳密）`,
      `経路ごとの差の最大値 ${v ? v.max_error.toExponential(2) : '—'}（近似）`,
      `対数価格の標本分散 ${fixed(v?.log_var)}（近似）`,
      `対数価格の分散 σ²t ${fixed(v?.log_var_theory)}（厳密）`,
    ].join('\n');
  },
});
bindMethodTabs<string>(next => {
  method = next;
  session.reloadMethod();
});

async function loadExample() {
  const example = await lessonFigure('finance/gbm');
  const show = (id: string, text: string) => { document.getElementById(id)!.textContent = text; };
  show('example-em', fixed(example.values.em_step));
  show('example-exact', fixed(example.values.exact_step));
  show('example-gap', fixed(example.values.step_gap));
}
void loadExample();
