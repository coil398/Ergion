import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import { mountExactFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('bernoulli')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> ベルヌーイ</p>
          <h1>ベルヌーイ<span class="title-dot">.</span></h1>
          <p class="description">未知関数のべきが右辺に残る方程式を、ベルヌーイの方程式と呼びます。指数が 0 でも 1 でもないとき、置換で <a class="doc-link" href="./linear.html">1階線形</a> に戻します。ここで得る式は厳密解です。</p>
        </div>
        <div class="equation" aria-label="ベルヌーイ方程式。x プライム足す p x は q x の n 乗">
          ${tex(String.raw`x' + px = q x^{n}`, true)}
          <span class="equation-note">n は 0 でも 1 でもない</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">ベルヌーイの手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>一般の形は次の式です。${tex('p')} と ${tex('q')} はこの例では定数、${tex('n')} は実数です。
              <p class="solution-equation">${tex(String.raw`x' + px = q x^{n}`, true)}</p>
              ${tex('n = 0')} なら右辺は定数で、1階線形です。${tex('n = 1')} なら ${tex(String.raw`x' + (p - q)x = 0`)} で、変数分離できます。以下では ${tex('n \\neq 0')} かつ ${tex('n \\neq 1')} とします。具体的な方程式は ${tex('p = -1')}、${tex('q = -1')}、${tex('n = 2')} です。
              <p class="solution-equation">${tex(String.raw`x' - x = -x^{2}`, true)}</p>
              これは ${tex(String.raw`x' = x - x^{2}`)} とも書けます。
            </li>
            <li>${tex('x \\neq 0')} と仮定します。置換は
              <p class="solution-equation">${tex(String.raw`u = x^{1-n} = x^{-1}`, true)}</p>
              なので ${tex('x = 1/u')} です。微分すると
              <p class="solution-equation">${tex(String.raw`x' = -\frac{u'}{u^{2}}`, true)}</p>
              方程式へ入れます。
              <p class="solution-equation">${tex(String.raw`-\frac{u'}{u^{2}} - \frac{1}{u} = -\frac{1}{u^{2}}`, true)}</p>
              両辺に ${tex('-u^{2}')} を掛けます。${tex('u \\neq 0')} は ${tex('x')} が有限であることから従います。
              <p class="solution-equation">${tex(String.raw`u' + u = 1`, true)}</p>
            </li>
            <li>これは定数係数の1階線形方程式です。積分因子は ${tex('e^{t}')} です。
              <p class="solution-equation">${tex(String.raw`e^{t} u' + e^{t} u = e^{t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\frac{d}{dt}\bigl(u e^{t}\bigr) = e^{t}`, true)}</p>
              積分します。積分定数を ${tex('C')} とすると、
              <p class="solution-equation">${tex(String.raw`u e^{t} = e^{t} + C`, true)}</p>
              ${tex('e^{t} \\neq 0')} で割ります。
              <p class="solution-equation">${tex(String.raw`u = 1 + C e^{-t}`, true)}</p>
              ${tex('x = 1/u')} へ戻します。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{1 + C e^{-t}}`, true)}</p>
            </li>
            <li>初期位置を ${tex('x(0) = x_0 \\neq 0')} とします。
              <p class="solution-equation">${tex(String.raw`x(0) = \frac{1}{1 + C} = x_0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`C = \frac{1}{x_0} - 1`, true)}</p>
              厳密解は次の式です。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{1 + \left(\dfrac{1}{x_0} - 1\right) e^{-t}}`, true)}</p>
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('x_0')} は時刻 0 の位置、${tex('p')} と ${tex('q')} は方程式の定数、${tex('n')} はべきの指数、${tex('u')} は置換 ${tex('x^{1-n}')}、${tex('C')} は積分定数、${tex('e')} は自然対数の底です。
            </li>
            <li>この式は厳密解です。置換のあと、1階線形の積分を閉じた形のまま残しています。打ち切り誤差はありません。定数 ${tex('x(t) = 0')} ももとの方程式を満たしますが、${tex('x')} で割る置換の外にあります。計算の説明は ${coreStepDoc('bernoulli_logistic', '厳密解の説明')} です。
            </li>
          </ol>
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('x_0 = 1/2')} とします。${tex('x_0 \\neq 0')} かつ ${tex('n = 2 \\neq 0, 1')} なので、上の仮定を満たします。</p>
          <ol class="solution">
            <li>積分定数は ${tex('C = 1/(1/2) - 1 = 1')} です。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{1 + e^{-t}}`, true)}</p>
            </li>
            <li>手で確かめます。${tex('t = 0')} では ${tex('e^{0} = 1')} なので ${tex('x(0) = 1/2')} です。初期位置と一致します。微分すると、
              <p class="solution-equation">${tex(String.raw`x'(t) = \frac{e^{-t}}{(1 + e^{-t})^{2}}`, true)}</p>
              右辺 ${tex('x - x^{2}')} は
              <p class="solution-equation">${tex(String.raw`x(1 - x) = \frac{1}{1 + e^{-t}} \cdot \frac{e^{-t}}{1 + e^{-t}} = \frac{e^{-t}}{(1 + e^{-t})^{2}}`, true)}</p>
              左辺と右辺は同じ式です。この一致は式のままの一致です。したがって ${tex('x(t) = 1/(1 + e^{-t})')} はこの例の厳密解です。
            </li>
          </ol>
        </div>
      </section>
      <section class="plots panel" aria-labelledby="curve-heading">
        <div class="panel-heading"><h2 id="curve-heading">例の厳密解</h2><div class="legend"><span><i class="analytical"></i>厳密解</span></div></div>
        <p class="scene-caption">曲線は、${tex('x_0 = 1/2')} の厳密解を、時刻 0 から 1 までの標本で評価したものです。数値の1ステップではありません。画面の数値は、その厳密解を小数第5位まで示したもので、解法としての打ち切りではありません。</p>
        <canvas id="solution-chart" role="img"></canvas>
        <div class="readouts">
          <div><span>時刻 t</span><output id="solution-time">—</output></div>
          <div><span>位置 x</span><output id="solution-value">—</output></div>
        </div>
      </section>
      ${pageFooter('ベルヌーイ方程式は、u = x^{1-n} と置くと1階線形になり、その解は厳密です。')}
    </main>
  </div>`;

mountExactFigure({ kind: 'bernoulli', t0: 0, dt: 0.015625, steps: 64, label: 'ベルヌーイの例の厳密解' });
