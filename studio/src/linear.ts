import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import { loadExample } from './curve';
import { drawExactCurve } from './figures';
import type { Snapshot } from './protocol';
import { tex } from './tex';

const config = { schema_version: 1 as const, initial_position: 1, p: 2, q: 6, dt: 0.015625, steps: 64 };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('linear')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 1階線形</p>
          <h1>1階線形<span class="title-dot">.</span></h1>
          <p class="description">未知関数とその導関数が1次式で結ばれ、係数が定数である方程式を、積分因子を掛けて積分します。<a class="doc-link" href="./separation.html">変数分離</a>では右辺が位置に比例するだけでした。ここでは左辺に位置の項を残し、右辺は定数です。得る式は厳密解です。</p>
        </div>
        <div class="equation" aria-label="1階線形方程式。x プライム足す p x は q">
          ${tex(String.raw`x' + px = q`, true)}
          <span class="equation-note">p と q は定数</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">積分因子の手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の1階線形方程式です。
              <p class="solution-equation">${tex(String.raw`x' + px = q`, true)}</p>
              ${tex('p')} と ${tex('q')} は、時刻にも位置にもよらない定数です。初期位置を ${tex('x(0) = x_0')} とします。求めるものは、この方程式と初期位置をともに満たす関数 ${tex('x(t)')} です。
            </li>
            <li>${tex('p = 0')} のときは、方程式は ${tex(String.raw`x' = q`)} です。右辺が定数なので、未知関数を含みません。<a class="doc-link" href="./integrate.html">積分して解く</a>と同じ手順で、厳密解は ${tex('x(t) = x_0 + qt')} です。以下では ${tex('p \\neq 0')} とします。
            </li>
            <li>積分因子 ${tex('e^{pt}')} を用意します。名前は積分因子のまま、式の中では ${tex('e^{pt}')} と書きます。両辺に掛けます。
              <p class="solution-equation">${tex(String.raw`e^{pt} x' + p e^{pt} x = q e^{pt}`, true)}</p>
              左辺は、積の微分と一致します。
              <p class="solution-equation">${tex(String.raw`\frac{d}{dt}\bigl(x e^{pt}\bigr) = x' e^{pt} + x \cdot p e^{pt}`, true)}</p>
              したがって、方程式は一つの微分にまとまります。
              <p class="solution-equation">${tex(String.raw`\frac{d}{dt}\bigl(x e^{pt}\bigr) = q e^{pt}`, true)}</p>
            </li>
            <li>両辺を時刻で積分します。${tex('p \\neq 0')} なので、右辺の原始関数は ${tex('(q/p) e^{pt}')} です。積分定数を ${tex('C')} とすると、
              <p class="solution-equation">${tex(String.raw`x e^{pt} = \frac{q}{p} e^{pt} + C`, true)}</p>
              ${tex('e^{pt}')} は、どの有限の時刻でも 0 ではありません。両辺を ${tex('e^{pt}')} で割ります。
              <p class="solution-equation">${tex(String.raw`x = \frac{q}{p} + C e^{-pt}`, true)}</p>
            </li>
            <li>初期条件を入れます。${tex('t = 0')} では ${tex('e^{0} = 1')} なので、
              <p class="solution-equation">${tex(String.raw`x(0) = \frac{q}{p} + C = x_0`, true)}</p>
              したがって積分定数は
              <p class="solution-equation">${tex(String.raw`C = x_0 - \frac{q}{p}`, true)}</p>
              です。厳密解は次の式です。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}`, true)}</p>
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置です。${tex('t')} は時刻です。${tex('x_0')} は時刻 0 の位置です。${tex('p')} は未知関数の係数です。${tex('q')} は右辺の定数です。${tex('e')} は自然対数の底です。${tex('C')} は積分定数です。${tex('e^{pt}')} は積分因子です。
            </li>
            <li>この式は厳密解です。級数に展開せず、時間を刻んで傾きを足してもいません。打ち切り誤差はありません。公式を微分して、方程式に戻ることを確かめます。
              <p class="solution-equation">${tex(String.raw`x'(t) = \left(x_0 - \frac{q}{p}\right)(-p)\,e^{-pt}`, true)}</p>
              括弧の中は ${tex('x(t) - q/p')} なので、
              <p class="solution-equation">${tex(String.raw`x'(t) = -p\left(x(t) - \frac{q}{p}\right) = -p\,x(t) + q`, true)}</p>
              したがって
              <p class="solution-equation">${tex(String.raw`x'(t) + p\,x(t) = q`, true)}</p>
              与えられた方程式を満たします。この一致は式のままの一致です。計算の説明は ${coreStepDoc('first_order_linear', '厳密解の説明')} です。
            </li>
          </ol>
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('p = 2')}、${tex('q = 6')}、${tex('x_0 = 1')} とします。${tex('p \\neq 0')} なので、上の仮定を満たします。同じ変形を、数を入れた式でたどります。</p>
          <ol class="solution">
            <li>方程式は次の式です。
              <p class="solution-equation">${tex(String.raw`x' + 2x = 6`, true)}</p>
            </li>
            <li>積分因子 ${tex('e^{2t}')} を両辺に掛けます。
              <p class="solution-equation">${tex(String.raw`e^{2t} x' + 2 e^{2t} x = 6 e^{2t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\frac{d}{dt}\bigl(x e^{2t}\bigr) = 6 e^{2t}`, true)}</p>
            </li>
            <li>${tex('p = 2 \\neq 0')} として積分します。${tex('6/2 = 3')} です。
              <p class="solution-equation">${tex(String.raw`x e^{2t} = 3 e^{2t} + C`, true)}</p>
              ${tex('e^{2t} \\neq 0')} で割ります。
              <p class="solution-equation">${tex(String.raw`x = 3 + C e^{-2t}`, true)}</p>
            </li>
            <li>初期条件 ${tex('x(0) = 1')} を入れます。${tex('e^{0} = 1')} なので ${tex('1 = 3 + C')}、したがって ${tex('C = -2')} です。厳密解は次の式です。
              <p class="solution-equation">${tex(String.raw`x(t) = 3 - 2 e^{-2t}`, true)}</p>
            </li>
            <li>手で確かめます。${tex('t = 0')} では ${tex('x(0) = 3 - 2 \\cdot 1 = 1')} です。初期位置と一致します。微分すると、
              <p class="solution-equation">${tex(String.raw`x'(t) = (-2)\cdot(-2)\,e^{-2t} = 4 e^{-2t}`, true)}</p>
              方程式の左辺へ入れます。
              <p class="solution-equation">${tex(String.raw`x'(t) + 2x(t) = 4 e^{-2t} + 2\bigl(3 - 2 e^{-2t}\bigr)`, true)}</p>
              括弧を展開します。
              <p class="solution-equation">${tex(String.raw`= 4 e^{-2t} + 6 - 4 e^{-2t}`, true)}</p>
              指数の項は打ち消し合います。
              <p class="solution-equation">${tex(String.raw`= 6`, true)}</p>
              右辺 ${tex('q = 6')} と一致します。この一致は近似ではなく、式のままの一致です。したがって ${tex('x(t) = 3 - 2 e^{-2t}')} はこの例の厳密解です。
            </li>
          </ol>
        </div>
      </section>
      <section class="plots panel" aria-labelledby="curve-heading">
        <div class="panel-heading"><h2 id="curve-heading">例の厳密解</h2><div class="legend"><span><i class="analytical"></i>厳密解</span></div></div>
        <p class="scene-caption">曲線は、${tex('p = 2')}、${tex('q = 6')}、${tex('x_0 = 1')} の厳密解を、時刻 0 から 1 までの標本で評価したものです。数値の1ステップではありません。画面の数値は、その厳密解を小数第5位まで示したもので、解法としての打ち切りではありません。</p>
        <canvas id="solution-chart" role="img"></canvas>
        <div class="readouts">
          <div><span>時刻 t</span><output id="solution-time">—</output></div>
          <div><span>位置 x</span><output id="solution-value">—</output></div>
        </div>
      </section>
      ${pageFooter('積分因子で得る x(t) = q/p + (x_0 - q/p) e^{-pt} は、x\' + px = q の厳密解です。')}
    </main>
  </div>`;

const canvas = document.querySelector<HTMLCanvasElement>('#solution-chart')!;
const timeOutput = document.querySelector<HTMLOutputElement>('#solution-time')!;
const valueOutput = document.querySelector<HTMLOutputElement>('#solution-value')!;
let drawn: { samples: Snapshot[]; state: Snapshot } | undefined;

function paint(samples: Snapshot[], state: Snapshot) {
  drawn = { samples, state };
  timeOutput.textContent = state.time.toFixed(5);
  valueOutput.textContent = state.position.toFixed(5);
  drawExactCurve(canvas, {
    key: 'linear-example',
    timeEnd: config.dt * config.steps,
    time: state.time,
    current: state.exact_position,
    samples: samples.map(sample => ({ time: sample.time, value: sample.exact_position })),
    label: '1階線形の例の厳密解',
  });
}

window.addEventListener('resize', () => {
  if (drawn) paint(drawn.samples, drawn.state);
});

loadExample({ model: 'linear', config, paint });
