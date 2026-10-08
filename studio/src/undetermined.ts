import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import undeterminedProof from '../../formal/lean/Ergion/Undetermined.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('undetermined')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 未定係数法</p>
          <h1>未定係数法<span class="title-dot">.</span></h1>
          <p class="description">右辺が多項式、指数関数、正弦、余弦、またはそれらの積であるとき、特殊解の形を先に仮定して係数を決めます。同次解は <a class="doc-link" href="./second-order.html">定数係数の2階同次</a> で得ます。ここで得る式は厳密解です。</p>
        </div>
        <div class="equation" aria-label="未定係数法の例。右辺は e の 3t">
          ${tex(String.raw`x'' - 3x' + 2x = e^{3t}`, true)}
          <span class="equation-note">右辺は指数関数</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">未定係数の手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の非同次方程式です。初期条件は ${tex('x(0) = 0')}、${tex("x'(0) = 0")} とします。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = e^{3t}`, true)}</p>
              係数 ${tex('-3')} と ${tex('2')} は定数です。右辺 ${tex('g(t) = e^{3t}')} は指数関数です。
            </li>
            <li>まず右辺を 0 にした同次方程式を解きます。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = 0`, true)}</p>
              特性方程式は ${tex('(r - 1)(r - 2) = 0')} です。根は ${tex('1')} と ${tex('2')} なので、同次解は任意定数 ${tex('A')}、${tex('B')} を用いて
              <p class="solution-equation">${tex(String.raw`x_h(t) = A e^{t} + B e^{2t}`, true)}</p>
              です。
            </li>
            <li>特殊解を仮定します。右辺の指数 ${tex('3')} は特性根 ${tex('1')} でも ${tex('2')} でもありません。したがって ${tex('t')} のべきを掛ける必要はなく、
              <p class="solution-equation">${tex(String.raw`x_p(t) = K e^{3t}`, true)}</p>
              と置けます。${tex('K')} が未定係数です。微分は ${tex(String.raw`x_p' = 3K e^{3t}`)}、${tex(String.raw`x_p'' = 9K e^{3t}`)} です。方程式へ入れます。
              <p class="solution-equation">${tex(String.raw`(9K - 9K + 2K)e^{3t} = e^{3t}`, true)}</p>
              ${tex('e^{3t} \\neq 0')} で割ると ${tex('2K = 1')}、したがって ${tex('K = 1/2')} です。
              <p class="solution-equation">${tex(String.raw`x_p(t) = \frac{1}{2} e^{3t}`, true)}</p>
            </li>
            <li>一般解は同次解と特殊解の和です。
              <p class="solution-equation">${tex(String.raw`x(t) = A e^{t} + B e^{2t} + \frac{1}{2} e^{3t}`, true)}</p>
              初期条件を入れます。${tex('x(0) = A + B + 1/2 = 0')} なので
              <p class="solution-equation">${tex(String.raw`A + B = -\frac{1}{2}`, true)}</p>
              微分は ${tex(String.raw`x' = A e^{t} + 2B e^{2t} + \frac{3}{2} e^{3t}`)} です。${tex("x'(0) = A + 2B + 3/2 = 0")} なので
              <p class="solution-equation">${tex(String.raw`A + 2B = -\frac{3}{2}`, true)}</p>
              差を取ると ${tex('B = -1')} です。第1式から ${tex('A - 1 = -1/2')}、したがって ${tex('A = 1/2')} です。厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{2} e^{t} - e^{2t} + \frac{1}{2} e^{3t}`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('x_h')} は同次解、${tex('x_p')} は特殊解、${tex('A')} と ${tex('B')} は同次解の任意定数、${tex('K')} は未定係数、${tex('e')} は自然対数の底、${tex('g(t)')} は右辺です。
            </li>
            <li>この式は厳密解です。特殊解の形を指数のまま仮定し、係数を代数で決めています。級数にも時間の刻みにもよりません。打ち切り誤差はありません。計算の説明は ${coreStepDoc('undetermined_coefficient', '厳密解の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${steppedFigure()}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した検算</h2>
          <p>上の初期条件そのものが、数の入った例です。微分して方程式と初期条件へ戻します。</p>
          <ol class="solution">
            <li>${tex('t = 0')} では ${tex('e^{0} = 1')} なので
              <p class="solution-equation">${tex(String.raw`x(0) = \frac{1}{2} - 1 + \frac{1}{2} = 0`, true)}</p>
              微分は
              <p class="solution-equation">${tex(String.raw`x'(t) = \frac{1}{2} e^{t} - 2e^{2t} + \frac{3}{2} e^{3t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'(0) = \frac{1}{2} - 2 + \frac{3}{2} = 0`, true)}</p>
              初期条件と一致します。
            </li>
            <li>もう一度微分します。
              <p class="solution-equation">${tex(String.raw`x''(t) = \frac{1}{2} e^{t} - 4e^{2t} + \frac{9}{2} e^{3t}`, true)}</p>
              左辺を集めます。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = \left(\frac{1}{2} - \frac{3}{2} + 1\right)e^{t} + (-4 + 6 - 2)e^{2t} + \left(\frac{9}{2} - \frac{9}{2} + 1\right)e^{3t}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`= e^{3t}`, true)}</p>
              右辺と一致します。${tex('e^{t}')} と ${tex('e^{2t}')} の係数は 0 です。この一致は式のままの一致です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFooter('未定係数法は、右辺と同じ形の特殊解を仮定し、同次解と合わせて厳密解を作ります。')}
      ${checkedProofs([{ statement: `右辺が ${tex(String.raw`e^{3t}`)} のとき、特殊解を ${tex(String.raw`x_p = K e^{3t}`)} と仮定して ${tex(String.raw`x'' - 3x' + 2x = e^{3t}`)} を解きます。`, source: undeterminedProof, moduleName: 'Ergion.Undetermined', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'undetermined', t0: 0, dt: 0.015625, steps: 64 },
  label: '未定係数法の例の厳密解',
});
