import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
import variationProof from '../../formal/lean/Ergion/Variation.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('variation')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 定数変化法</p>
          <h1>定数変化法<span class="title-dot">.</span></h1>
          <p class="description">右辺が多項式や指数関数の形をしていないとき、同次解の任意定数を時刻の関数に置き換えて特殊解を作ります。<a class="doc-link" href="./undetermined.html">未定係数法</a>がそのまま使えない例です。ここで得る式は厳密解です。</p>
        </div>
        <div class="equation" aria-label="定数変化法の例。x ダブルプライム足す x は tan t">
          ${tex(String.raw`x'' + x = \tan t`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">定数変化の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の方程式です。区間は ${tex('(-\\pi/2,\\ \\pi/2)')} とします。この区間では ${tex('\\cos t \\neq 0')} で、${tex('\\tan t')} は連続です。初期条件は ${tex('x(0) = 0')}、${tex("x'(0) = 0")} です。
              <p class="solution-equation">${tex(String.raw`x'' + x = \tan t`, true)}</p>
              右辺 ${tex('g(t) = \\tan t')} は、多項式、指数関数、正弦、余弦の積ではありません。未定係数法で使う基本形 ${tex('K \\tan t')} を入れても、左辺は ${tex('\\tan t')} のままにはなりません。そこで定数変化法を使います。
            </li>
            <li>同次方程式 ${tex(String.raw`x'' + x = 0`)} の基本解は、複素根 ${tex('\\pm i')} から
              <p class="solution-equation">${tex(String.raw`y_1 = \cos t,\qquad y_2 = \sin t`, true)}</p>
              です。ロンスキー行列式は
              <p class="solution-equation">${tex(String.raw`W = y_1 y_2' - y_2 y_1' = \cos^{2} t + \sin^{2} t = 1`, true)}</p>
              で、この区間のどこでも 0 ではありません。
            </li>
            <li>特殊解を ${tex('x_p = u_1 y_1 + u_2 y_2')} と置きます。${tex('u_1')} と ${tex('u_2')} は時刻の関数です。条件
              <p class="solution-equation">${tex(String.raw`u_1' y_1 + u_2' y_2 = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`u_1' y_1' + u_2' y_2' = g(t)`, true)}</p>
              を課すと、${tex('W = 1')} のとき
              <p class="solution-equation">${tex(String.raw`u_1' = -y_2 g = -\sin t \tan t = -\sin t \cdot \frac{\sin t}{\cos t} = -\frac{\sin^{2} t}{\cos t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`u_2' = y_1 g = \cos t \tan t = \cos t \cdot \frac{\sin t}{\cos t} = \sin t`, true)}</p>
              です。${tex('\\sin^{2} t = 1 - \\cos^{2} t')} を使うと
              <p class="solution-equation">${tex(String.raw`u_1' = -\frac{1 - \cos^{2} t}{\cos t} = -(\sec t - \cos t) = -\sec t + \cos t`, true)}</p>
              です。積分定数は同次解へ移すので、一つの原始関数を取ります。
              <p class="solution-equation">${tex(String.raw`u_2(t) = \int \sin t\,dt = -\cos t`, true)}</p>
              <p class="solution-equation">${tex(String.raw`u_1(t) = \int (-\sec t + \cos t)\,dt = -\ln|\sec t + \tan t| + \sin t`, true)}</p>
            </li>
            <li>特殊解を組み立てます。
              <p class="solution-equation">${tex(String.raw`x_p = u_1 \cos t + u_2 \sin t`, true)}</p>
              <p class="solution-equation">${tex(String.raw`= \bigl(-\ln|\sec t + \tan t| + \sin t\bigr)\cos t + (-\cos t)\sin t`, true)}</p>
              積を展開します。
              <p class="solution-equation">${tex(String.raw`= -\cos t \cdot \ln|\sec t + \tan t| + \sin t \cos t - \cos t \sin t`, true)}</p>
              ${tex('\\sin t \\cos t')} の項は相殺します。
              <p class="solution-equation">${tex(String.raw`x_p = -\cos t \cdot \ln|\sec t + \tan t|`, true)}</p>
              一般解は任意定数 ${tex('A')}、${tex('B')} を加えて
              <p class="solution-equation">${tex(String.raw`x(t) = A\cos t + B\sin t - \cos t \cdot \ln|\sec t + \tan t|`, true)}</p>
              です。
            </li>
            <li>初期条件を入れます。${tex('L(t) = \\ln|\\sec t + \\tan t|')} と書きます。${tex('t = 0')} では ${tex('\\sec 0 + \\tan 0 = 1')}、${tex('L(0) = \\ln 1 = 0')} です。
              <p class="solution-equation">${tex(String.raw`x(0) = A \cos 0 + B \sin 0 - \cos 0 \cdot L(0) = A \cdot 1 + 0 - 0 = A = 0`, true)}</p>
              したがって ${tex('x = B \\sin t - \\cos t\\, L')} です。${tex('(\\sec t + \\tan t)\' = \\sec t(\\sec t + \\tan t)')} なので ${tex("L' = \\sec t")} です。
              <p class="solution-equation">${tex(String.raw`x' = B\cos t + \sin t \cdot L - \cos t \cdot \sec t = B\cos t + \sin t \cdot L - 1`, true)}</p>
              ${tex('t = 0')} を代入すると
              <p class="solution-equation">${tex(String.raw`x'(0) = B\cos 0 + \sin 0 \cdot L(0) - 1 = B \cdot 1 + 0 - 1 = B - 1 = 0`, true)}</p>
              したがって ${tex('B = 1')} です。厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = \sin t - \cos t \cdot \ln|\sec t + \tan t|`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は区間 ${tex('(-\\pi/2, \\pi/2)')} の時刻、${tex('y_1')} と ${tex('y_2')} は基本解、${tex('W')} はロンスキー行列式、${tex('u_1')} と ${tex('u_2')} は変化させる定数、${tex('A')} と ${tex('B')} は同次解の任意定数、${tex('L')} は ${tex('\\ln|\\sec t + \\tan t|')}、${tex('\\ln')} は自然対数です。
            </li>
            <li>この式は厳密解です。基本解の一次結合の係数を積分で決めており、級数にも時間の刻みにもよりません。打ち切り誤差はありません。計算の説明は ${coreStepDoc('variation_of_parameters', '厳密解の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('variation', 'x″ + x = tan t の解は開区間 (−π/2, π/2) の中にあり、境界へ近づくと傾きが限りなく大きくなる。')}
      ${steppedFigure()}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した検算</h2>
          <p>初期条件 ${tex('x(0) = x\'(0) = 0')} の解を、微分して方程式へ戻します。</p>
          <ol class="solution">
            <li>${tex('t = 0')} では ${tex('L(0) = 0')} なので ${tex('x(0) = \\sin 0 - \\cos 0 \\cdot 0 = 0')} です。前の節で ${tex("x'(0) = 1 - 1 = 0")} です。
            </li>
            <li>${tex('x = \\sin t - \\cos t\\, L')} と ${tex("L' = \\sec t")} から、
              <p class="solution-equation">${tex(String.raw`x' = \cos t + \sin t \cdot L - 1`, true)}</p>
              もう一度微分します。
              <p class="solution-equation">${tex(String.raw`x'' = -\sin t + \cos t \cdot L + \sin t \cdot \sec t`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'' = -\sin t + \cos t \cdot L + \tan t`, true)}</p>
              方程式の左辺は
              <p class="solution-equation">${tex(String.raw`x'' + x = -\sin t + \cos t \cdot L + \tan t + \sin t - \cos t \cdot L = \tan t`, true)}</p>
              右辺と一致します。この一致は式のままの一致です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './second-order.html', title: '定数係数の2階同次' },
        { href: './undetermined.html', title: '未定係数法' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('定数変化法は、同次解の任意定数を時刻の関数にして、右辺 tan t の厳密解を作ります。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x'' + x = \tan t`)} は、同次解の定数を時刻の関数にして解きます。`, source: variationProof, moduleName: 'Ergion.Variation', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'variation', t0: 0, dt: 0.015625, steps: 64 },
  label: '定数変化法の例の厳密解',
});
