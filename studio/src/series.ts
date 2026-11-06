import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
import seriesProof from '../../formal/lean/Ergion/PowerSeries.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('series')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> べき級数</p>
          <h1>べき級数</h1>
          <p class="description">係数が通常点のまわりでべき級数になるとき、解も同じ点のまわりのべき級数として求めます。ここでは通常点 ${tex('t = 0')} で、級数の和が閉じた関数になる方程式を解きます。和は厳密解です。</p>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">級数の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の方程式です。初期条件は ${tex('x(0) = 1')}、${tex("x'(0) = 0")} とします。
              <p class="solution-equation">${tex(String.raw`x'' + x = 0`, true)}</p>
              ${tex('x\'\'')} の係数は定数 ${tex('1')} で、${tex('t = 0')} でも 0 ではありません。係数はすべて整関数なので、${tex('t = 0')} は通常点です。解は、この点のまわりのべき級数で書けます。
            </li>
            <li>解を次の形に仮定します。収束半径は、この方程式では無限大です。
              <p class="solution-equation">${tex(String.raw`x(t) = \sum_{n=0}^{\infty} a_n t^{n}`, true)}</p>
              項別に微分します。
              <p class="solution-equation">${tex(String.raw`x''(t) = \sum_{n=2}^{\infty} n(n-1)a_n t^{n-2}`, true)}</p>
              指数を ${tex('m = n - 2')} にずらすと、
              <p class="solution-equation">${tex(String.raw`x''(t) = \sum_{m=0}^{\infty} (m+2)(m+1)a_{m+2} t^{m}`, true)}</p>
              方程式 ${tex(String.raw`x'' + x = 0`)} へ代入すると
              <p class="solution-equation">${tex(String.raw`\sum_{m=0}^{\infty} \bigl[(m+2)(m+1)a_{m+2} + a_m\bigr] t^{m} = 0`, true)}</p>
              すべての ${tex('m \\ge 0')} について、各べきの係数は 0 です。
              <p class="solution-equation">${tex(String.raw`(m+2)(m+1)a_{m+2} + a_m = 0`, true)}</p>
              ${tex('a_m')} を移項します。
              <p class="solution-equation">${tex(String.raw`(m+2)(m+1)a_{m+2} = -a_m`, true)}</p>
              ${tex('m \\ge 0')} では ${tex('(m+1)(m+2) \\neq 0')} なので、漸化式は
              <p class="solution-equation">${tex(String.raw`a_{m+2} = -\frac{a_m}{(m+1)(m+2)}`, true)}</p>
              です。
            </li>
            <li>初期条件が最初の二つの係数です。
              <p class="solution-equation">${tex(String.raw`a_0 = x(0) = 1,\qquad a_1 = x'(0) = 0`, true)}</p>
              ${tex('a_1 = 0')} から、奇数番号の係数はすべて 0 です。偶数は漸化式から順に計算します。${tex('m = 0')} のとき
              <p class="solution-equation">${tex(String.raw`a_2 = -\frac{a_0}{(0+1)(0+2)} = -\frac{1}{1\cdot 2} = -\frac{1}{2}`, true)}</p>
              ${tex('m = 2')} のとき
              <p class="solution-equation">${tex(String.raw`a_4 = -\frac{a_2}{(2+1)(2+2)} = -\frac{-1/2}{3\cdot 4} = \frac{1/2}{12} = \frac{1}{24}`, true)}</p>
              ${tex('m = 4')} のとき
              <p class="solution-equation">${tex(String.raw`a_6 = -\frac{a_4}{(4+1)(4+2)} = -\frac{1/24}{5\cdot 6} = -\frac{1/24}{30} = -\frac{1}{720}`, true)}</p>
              したがって、最初の項は
              <p class="solution-equation">${tex(String.raw`x(t) = 1 - \frac{t^{2}}{2} + \frac{t^{4}}{24} - \frac{t^{6}}{720} + \cdots`, true)}</p>
              です。これは ${tex('\\cos t')} のテイラー級数です。無限和は
              <p class="solution-equation">${tex(String.raw`x(t) = \cos t`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('a_n')} は ${tex('t^n')} の係数、${tex('n')} と ${tex('m')} は和の番号、${tex('\\cos')} は余弦です。級数の和は厳密解です。途中で書いた有限個の項は、和そのものではなく、係数を見るための部分和です。
            </li>
            <li>計算の説明は ${coreStepDoc('power_series_cosine', '厳密解の説明')} です。図が描くのは、この無限和です。有限項で止めた多項式を、別に計算して描いてはいません。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('series', 'x″ + x = 0、x(0) = 1、x′(0) = 0 のべき級数の部分和は、原点の近くで厳密解 cos t に沿い、次数を上げるほど遠くまで沿う。')}
      ${steppedFigure(false, 'series')}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した検算</h2>
          <p>係数 ${tex('a_0')}、${tex('a_2')}、${tex('a_4')} までを手で方程式へ入れ、残る項の次数を見ます。</p>
          <ol class="solution">
            <li>部分和を ${tex('s(t) = 1 - t^{2}/2 + t^{4}/24')} とします。これは級数の第5項の手前までです。
              <p class="solution-equation">${tex(String.raw`s''(t) = -1 + \frac{t^{2}}{2}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`s''(t) + s(t) = \frac{t^{4}}{24}`, true)}</p>
              右辺は、次の項 ${tex('a_6 t^{6}')} より前に残る次数です。${tex('t = 0')} では残差も 0 で、${tex('s(0) = 1')}、${tex("s'(0) = 0")} です。初期条件は部分和の段階でも満たされています。
            </li>
            <li>無限和 ${tex('x(t) = \\cos t')} は、すべての項を含みます。
              <p class="solution-equation">${tex(String.raw`x''(t) + x(t) = -\cos t + \cos t = 0`, true)}</p>
              方程式を満たします。${tex('x(0) = 1')}、${tex("x'(0) = 0")} です。この一致は式のままの一致です。部分和の残差 ${tex('t^{4}/24')} は、和をそこで止めたことによるもので、和そのものの誤差ではありません。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './taylor.html', title: 'Taylor 展開' },
        { href: './second-order.html', title: '定数係数の2階同次' },
        { href: './variation.html', title: '定数変化法' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('通常点のべき級数は、漸化式で係数が決まり、この方程式では和が cos t という厳密解です。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x'' + x = 0`)} のべき級数は、係数の漸化式 ${tex(String.raw`a_{m+2} = -\frac{a_m}{(m+1)(m+2)}`)} を満たし、和は ${tex(String.raw`\cos t`)} です。`, source: seriesProof, moduleName: 'Ergion.PowerSeries', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'series', t0: 0, dt: 0.015625, steps: 64 },
  label: 'べき級数の和である厳密解',
});
