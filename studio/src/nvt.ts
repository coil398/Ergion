import { coreDoc } from './chrome';
import { drawPlot } from './figures';
import { fixed } from './figures/statistics';
import { dot, eq, lessonFigure, line, renderLesson, setStatus } from './lesson';
import type { LessonFigure } from './protocol';
import { tex } from './tex';
import { onThemeChange } from './theme';

renderLesson({
  id: 'nvt',
  section: { label: '分子動力学' },
  title: 'NVT アンサンブルと熱浴法',
  description: `粒子数 ${tex('N')} と体積 ${tex('V')} を一定に保ち、温度を目標値 ${tex('T_0')} のまわりに置く集団を NVT アンサンブルと呼びます。Berendsen の熱浴は、瞬時温度 ${tex('T')} が ${tex('T_0')} へ時定数 ${tex(String.raw`\tau`)} で近づくように、すべての速度を同じ係数 ${tex(String.raw`\lambda`)} 倍します。エネルギー、長さ、質量の単位を ${tex(String.raw`\varepsilon`)}、${tex(String.raw`\sigma`)}、${tex('m')} にとり、${tex(String.raw`\varepsilon = \sigma = m = k_B = 1`)} とします。`,
  equation: [
    String.raw`\frac{dT}{dt} = \frac{T_0 - T}{\tau}`,
    String.raw`\lambda = \sqrt{1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)}, \qquad \mathbf{v}_i \leftarrow \lambda\,\mathbf{v}_i`,
  ],
  studyHeading: '速度を定数倍して温度を目標へ近づける手順',
  steps: [
    `NVE アンサンブルでは全エネルギー ${tex('E')} が一定で、瞬時温度 ${tex('T')} は運動エネルギー ${tex('K')} と一緒に揺れます。NVT アンサンブルでは ${tex('N')} と ${tex('V')} に加え、目標の温度 ${tex('T_0')} を指定します。熱浴は粒子の速度を変え、${tex('K')} を ${tex('T_0')} に対応する大きさへ寄せます。ここで使う Berendsen の熱浴は、温度の微分方程式
      ${eq(String.raw`\frac{dT}{dt} = \frac{T_0 - T}{\tau}`)}
      に従います。${tex(String.raw`\tau > 0`)} は熱浴の時定数です。${tex('T > T_0')} なら右辺は負で、温度は下がります（${coreDoc('molecular', 'berendsen_factor', '係数の説明')}）。`,
    `時間刻み ${tex(String.raw`\Delta t`)} の前進 Euler 法で1ステップ進めます。
      ${eq(String.raw`T(t + \Delta t) = T + \Delta t\cdot\frac{T_0 - T}{\tau}`)}
      右辺を ${tex('T')} についてまとめます。
      ${eq(String.raw`T(t + \Delta t) = T\left(1 - \frac{\Delta t}{\tau}\right) + \frac{\Delta t}{\tau}\,T_0`)}
      新しい温度と今の温度の比は
      ${eq(String.raw`\frac{T(t + \Delta t)}{T} = 1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)`)}
      です。`,
    `質量が共通で粒子数が変わらないとき、運動エネルギーは温度に比例します。速度をすべて ${tex(String.raw`\lambda`)} 倍すると ${tex(String.raw`|\mathbf{v}_i|^2`)} は ${tex(String.raw`\lambda^2`)} 倍になり、${tex('K')} も ${tex(String.raw`\lambda^2`)} 倍になります。したがって
      ${eq(String.raw`\lambda^2 = \frac{T(t + \Delta t)}{T} = 1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)`)}
      です。${tex(String.raw`\lambda`)} は正に取るので
      ${eq(String.raw`\lambda = \sqrt{1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)}`)}
      です。根号の中が負になるときは、速度を 0 にします。各速度は ${tex(String.raw`\mathbf{v}_i \leftarrow \lambda\mathbf{v}_i`)} と更新します（${coreDoc('molecular', 'scale_velocities', '速度を定数倍する説明')}）。`,
    `この操作は全運動量 ${tex(String.raw`\mathbf{P} = \sum_i m\mathbf{v}_i`)} も ${tex(String.raw`\lambda`)} 倍します。最初に ${tex(String.raw`\mathbf{P} = \mathbf{0}`)} なら、倍しても 0 のままです。Berendsen の熱浴は、カノニカル分布を厳密にサンプルする熱浴ではありません。${tex(String.raw`\tau`)} を ${tex(String.raw`\Delta t`)} より大きく取り、温度をゆるやかに寄せる使い方をします。`,
  ],
  figureAlt: '目標温度 1、時間刻みと時定数がどちらも 1 のとき、Berendsen 係数 λ が瞬時温度 T とともに減る曲線と、T = 4 で λ = 1/2 になる点。',
  figure: `
      <section class="plots panel lesson-figure" aria-labelledby="fig-heading">
        <div class="panel-heading"><h2 id="fig-heading">Berendsen 係数 ${tex(String.raw`\lambda(T)`)}</h2></div>
        <div><h3>${tex('T_0 = 1')}、${tex(String.raw`\Delta t = \tau = 1`)}</h3><canvas id="nvt-chart" role="img"></canvas><p>瞬時温度 T。点は T = 4 の例。</p></div>
      </section>`,
  exampleHeading: '数を代入した例',
  example: [
    `${tex('T = 4')}、${tex('T_0 = 1')}、${tex(String.raw`\Delta t = 1`)}、${tex(String.raw`\tau = 1`)} を根号の中へ代入します。
      ${eq(String.raw`1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right) = 1 + \frac{1}{1}\left(\frac{1}{4} - 1\right)`)}
      ${eq(String.raw`= 1 + \left(\frac{1}{4} - \frac{4}{4}\right) = 1 - \frac{3}{4} = \frac{1}{4}`)}
      したがって ${tex(String.raw`\lambda = \sqrt{1/4} = 1/2`)} です。この ${tex('1/2')} は厳密な値です。画面の係数は <output id="nvt-lambda">—</output> です。`,
    `速度 ${tex(String.raw`\mathbf{v} = (2, 0, 0)`)} に ${tex(String.raw`\lambda = 1/2`)} を掛けると
      ${eq(String.raw`\lambda\mathbf{v} = \left(1, 0, 0\right)`)}
      です。画面の更新後の ${tex('x')} 成分は <output id="nvt-scaled">—</output> です。運動エネルギーは ${tex(String.raw`\tfrac12|\mathbf{v}|^2 = 2`)} から ${tex(String.raw`\tfrac12\cdot 1 = \tfrac12`)} になり、比は ${tex(String.raw`\lambda^2 = 1/4`)} と一致します。どれも厳密です。`,
  ],
  related: [
    { href: './nve.html', title: 'NVE アンサンブルと速度 Verlet 法' },
    { href: './observables.html', title: '温度・圧力・動径分布関数' },
    { href: './neighbor-list.html', title: '近接リスト法とセル分割法' },
  ],
  footer: 'この画面の計算は、Berendsen の熱浴が速度に掛ける係数です。',
});

let shown: LessonFigure | undefined;

function paint() {
  if (!shown) return;
  drawPlot(document.getElementById('nvt-chart') as HTMLCanvasElement, {
    label: '瞬時温度に対する Berendsen 係数。点は T = 4 の例。',
    lines: [line(shown, 'factor', 'λ')],
    dots: [dot(shown, 'example', 'T = 4')],
    xMin: 0.25,
    xMax: 8,
    yMin: 0,
    yMax: 2,
    zeroLabel: 'λ = 0',
  });
}

async function load() {
  setStatus('loading', '計算中');
  try {
    const figure = await lessonFigure('md/nvt');
    shown = figure;
    document.getElementById('nvt-lambda')!.textContent = fixed(figure.values.factor, 6);
    document.getElementById('nvt-scaled')!.textContent = fixed(figure.values.scaled, 6);
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
