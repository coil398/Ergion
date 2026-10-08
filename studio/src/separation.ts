import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import separationProof from '../../formal/lean/Ergion/Separation.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('separation')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 変数分離</p>
          <h1>変数分離<span class="title-dot">.</span></h1>
          <p class="description">右辺が位置 ${tex('x')} に比例するとき、位置と時刻を分けて積分します。<a class="doc-link" href="./integrate.html">積分して解く</a>では右辺が未知関数を含みませんでした。ここでは右辺が ${tex('x')} を含むので、割ってから積分します。得る式は厳密解です。</p>
        </div>
        <div class="equation" aria-label="変数分離する方程式。x プライムは k x">
          ${tex(String.raw`x' = kx`, true)}
          <span class="equation-note">k は定数</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">変数分離の手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、位置の時間微分が、その位置に定数を掛けたものに等しい、という方程式です。
              <p class="solution-equation">${tex(String.raw`x' = kx`, true)}</p>
              ${tex('k')} は時刻にも位置にもよらない定数です。初期位置を ${tex('x(0) = x_0')} とします。求めるものは、この方程式と初期位置をともに満たす関数 ${tex('x(t)')} です。
            </li>
            <li>まず ${tex('x \\neq 0')} と仮定します。この仮定のもとで、両辺を ${tex('x')} で割れます。導関数を ${tex('dx/dt')} と書くと、
              <p class="solution-equation">${tex(String.raw`\frac{1}{x}\frac{dx}{dt} = k`, true)}</p>
              両辺に ${tex('dt')} を掛け、位置だけの式と時刻だけの式に分けます。
              <p class="solution-equation">${tex(String.raw`\frac{dx}{x} = k\,dt`, true)}</p>
              左辺は ${tex('x')} だけを含み、右辺は ${tex('t')} だけを含みます。${tex('k')} は定数なので、右辺の係数のまま残します。
            </li>
            <li>両辺を積分します。左辺は ${tex('x')} について、右辺は ${tex('t')} について積分します。
              <p class="solution-equation">${tex(String.raw`\int \frac{1}{x}\,dx = \int k\,dt`, true)}</p>
              ${tex('k')} は定数なので、右辺は ${tex('kt')} です。左辺は自然対数です。積分定数を ${tex('C')} と書くと、
              <p class="solution-equation">${tex(String.raw`\ln|x| = kt + C`, true)}</p>
              絶対値を外すために、両辺を指数関数にします。${tex('e^{C}')} は正の定数です。
              <p class="solution-equation">${tex(String.raw`|x| = e^{kt+C} = e^{C} e^{kt}`, true)}</p>
              絶対値を外すと、符号は正にも負にも取れます。0 でない定数 ${tex('A = \\pm e^{C}')} を使って、
              <p class="solution-equation">${tex(String.raw`x = A e^{kt}`, true)}</p>
              と書けます。仮定 ${tex('x \\neq 0')} から ${tex('A \\neq 0')} です。この段階では ${tex('A = 0')} は入っていません。
            </li>
            <li>初期条件を入れます。${tex('t = 0')} のとき ${tex('e^{k \\cdot 0} = e^{0} = 1')} なので、
              <p class="solution-equation">${tex(String.raw`x(0) = A = x_0`, true)}</p>
              ここまでの仮定は ${tex('x_0 \\neq 0')} です。したがって
              <p class="solution-equation">${tex(String.raw`x(t) = x_0 e^{kt}`, true)}</p>
              です。同じ式は、${tex('k')} が正でも負でも成り立ちます。${tex('k > 0')} なら位置の絶対値は時刻とともに増え、${tex('k < 0')} なら 0 に近づきます。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置です。${tex('t')} は時刻です。${tex('x_0')} は時刻 0 の位置です。${tex('k')} は方程式の定数係数です。${tex('e')} は自然対数の底です。途中の ${tex('C')} は積分定数です。${tex('A')} は符号を含めた 0 でない定数で、初期条件により ${tex('A = x_0')} となります。
            </li>
            <li>この式は厳密解です。級数に展開せず、積分を閉じた形のまま残しています。時間を刻んで傾きを足してもいません。打ち切り誤差はありません。式を微分して方程式に戻ることを、次の例で式のまま確かめます。計算の説明は ${coreStepDoc('separated_exponential', '厳密解の説明')} です。
            </li>
            <li>定数関数 ${tex('x(t) = 0')} も解です。微分すると左辺は 0 で、右辺も ${tex('k \\cdot 0 = 0')} です。変数分離では ${tex('x')} で割ったので、この解は上の積分の外にあります。初期位置を ${tex('x_0 = 0')} と置いて公式へ入れると ${tex('x(t) = 0')} になり、この定数解を含みます。
            </li>
          </ol>
        </div>
      </section>
      ${steppedFigure(`タブは、方程式 ${tex(String.raw`x' = kx`)} を進める数値解法だけを切り替えます。上の導出と厳密解は変わりません。${tex('k = 2')}、${tex('x_0 = 3')} の誤差は、時間刻みによる打ち切りであり、丸めだけではありません。位置の表示は、厳密解を小数第5位まで示したものです。`)}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('k = 2')}、${tex('x_0 = 3')} とします。${tex('x_0 \\neq 0')} なので、上の仮定を満たします。同じ変形を、数を入れた式でたどります。</p>
          <ol class="solution">
            <li>方程式は次の式です。
              <p class="solution-equation">${tex(String.raw`x' = 2x`, true)}</p>
            </li>
            <li>${tex('x \\neq 0')} として変数を分けます。
              <p class="solution-equation">${tex(String.raw`\frac{dx}{x} = 2\,dt`, true)}</p>
            </li>
            <li>両辺を積分します。
              <p class="solution-equation">${tex(String.raw`\ln|x| = 2t + C`, true)}</p>
              <p class="solution-equation">${tex(String.raw`|x| = e^{C} e^{2t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x = A e^{2t}`, true)}</p>
              ${tex('A = \\pm e^{C}')} で、${tex('A \\neq 0')} です。
            </li>
            <li>初期条件 ${tex('x(0) = 3')} を入れます。${tex('e^{0} = 1')} なので ${tex('A = 3')} です。厳密解は次の式です。
              <p class="solution-equation">${tex(String.raw`x(t) = 3 e^{2t}`, true)}</p>
            </li>
            <li>手で確かめます。${tex('t = 0')} では ${tex('e^{0} = 1')} なので ${tex('x(0) = 3 \\cdot 1 = 3')} です。初期位置と一致します。微分すると、
              <p class="solution-equation">${tex(String.raw`x'(t) = 3 \cdot 2 e^{2t} = 6 e^{2t}`, true)}</p>
              右辺は
              <p class="solution-equation">${tex(String.raw`2x(t) = 2 \cdot 3 e^{2t} = 6 e^{2t}`, true)}</p>
              左辺と右辺は同じ式です。この一致は近似ではなく、式のままの一致です。したがって ${tex('x(t) = 3 e^{2t}')} はこの例の厳密解です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFooter('変数分離で得る x(t) = x_0 e^{kt} は、x\' = kx の厳密解です。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x' = kx`)} の厳密解は ${tex(String.raw`x(t) = x_0 e^{kt}`)} です。`, source: separationProof, moduleName: 'Ergion.Separation', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'separation', t0: 0, dt: 0.015625, steps: 64, initial_position: 3, k: 2 },
  label: '変数分離の例の厳密解',
});
