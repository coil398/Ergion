import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
import exactProof from '../../formal/lean/Ergion/Exact.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('exact')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 完全微分</p>
          <h1>完全微分<span class="title-dot">.</span></h1>
          <p class="description">微分方程式を ${tex('M\\,dx + N\\,dy = 0')} と書いたとき、ある関数 ${tex('\\varphi')} の全微分になっているものを完全微分と呼びます。解は ${tex('\\varphi(x, y) = C')} という陰関数です。</p>
        </div>
        <div class="equation" aria-label="完全微分。(2x + y) dx + (x + 2y) dy = 0">
          ${tex(String.raw`(2x + y)\,dx + (x + 2y)\,dy = 0`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">完全微分の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の微分形式です。
              <p class="solution-equation">${tex(String.raw`(2x + y)\,dx + (x + 2y)\,dy = 0`, true)}</p>
              ${tex('M(x, y) = 2x + y')}、${tex('N(x, y) = x + 2y')} と置きます。どちらも平面全体で連続で、偏導関数も連続です。
            </li>
            <li>完全性の判定をします。完全であるためには
              <p class="solution-equation">${tex(String.raw`\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}`, true)}</p>
              が、考えている領域で成り立つことが必要です。平面は単連結なので、この等式は十分でもあります。計算すると、
              <p class="solution-equation">${tex(String.raw`\frac{\partial M}{\partial y} = 1,\qquad \frac{\partial N}{\partial x} = 1`, true)}</p>
              両辺は等しいので、この方程式は完全です。
            </li>
            <li>ポテンシャル ${tex('\\varphi(x, y)')} を求めます。${tex('\\partial \\varphi/\\partial x = M')} なので、${tex('y')} を固定して ${tex('x')} で積分します。
              <p class="solution-equation">${tex(String.raw`\varphi(x, y) = \int (2x + y)\,dx = x^2 + xy + h(y)`, true)}</p>
              ${tex('h(y)')} は ${tex('x')} を含まない関数です。${tex('y')} で偏微分します。
              <p class="solution-equation">${tex(String.raw`\frac{\partial \varphi}{\partial y} = \frac{\partial}{\partial y}\bigl(x^{2} + xy + h(y)\bigr) = x + h'(y)`, true)}</p>
              これを ${tex('N = x + 2y')} と等置します。
              <p class="solution-equation">${tex(String.raw`x + h'(y) = x + 2y`, true)}</p>
              両辺から ${tex('x')} を引くと、${tex("h'(y) = 2y")} です。${tex('y')} で積分します。積分定数は、あとでレベル ${tex('C')} に吸収するので、ここでは 0 に取ります。
              <p class="solution-equation">${tex(String.raw`h(y) = \int 2y\,dy = y^{2}`, true)}</p>
              したがってポテンシャルは
              <p class="solution-equation">${tex(String.raw`\varphi(x, y) = x^2 + xy + y^2`, true)}</p>
            </li>
            <li>解曲線の上では ${tex('\\varphi')} が一定です。陰関数の厳密解は
              <p class="solution-equation">${tex(String.raw`x^2 + xy + y^2 = C`, true)}</p>
              です。${tex('C')} は任意定数です。
            </li>
            <li>記号を定めます。${tex('x')} と ${tex('y')} は未知関数の組です。${tex('M')} は ${tex('dx')} の係数、${tex('N')} は ${tex('dy')} の係数です。${tex('\\varphi')} はポテンシャル、${tex('h')} は ${tex('x')} 積分の残り、${tex('C')} はレベルです。
            </li>
            <li>この陰関数は厳密解です。完全性の判定を満たす領域で、${tex('\\varphi')} の全微分が与えられた微分形式と一致します。打ち切り誤差はありません。計算の説明は ${coreStepDoc('exact_quadratic', '厳密解の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('exact', '完全微分 (2x+y)dx + (x+2y)dy = 0 の解は、ポテンシャル x² + xy + y² = C の等高線である。')}
      ${steppedFigure()}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('C = 1')} とします。陰関数を ${tex('x')} について解き、独立変数を ${tex('y = t')} と書いて図にします。</p>
          <ol class="solution">
            <li>レベルは次の式です。
              <p class="solution-equation">${tex(String.raw`x^2 + xt + t^2 = 1`, true)}</p>
              ${tex('x')} について整理します。
              <p class="solution-equation">${tex(String.raw`x^{2} + tx + (t^{2} - 1) = 0`, true)}</p>
              2次方程式の根の公式を用います。
              <p class="solution-equation">${tex(String.raw`x = \frac{-t \pm \sqrt{t^{2} - 4 \cdot 1 \cdot (t^{2} - 1)}}{2 \cdot 1}`, true)}</p>
              根号の中を展開します。
              <p class="solution-equation">${tex(String.raw`t^{2} - 4(t^{2} - 1) = t^{2} - 4t^{2} + 4 = 4 - 3t^{2}`, true)}</p>
              したがって
              <p class="solution-equation">${tex(String.raw`x = \frac{-t \pm \sqrt{4 - 3t^2}}{2}`, true)}</p>
              平方根の中が負でない範囲を求めます。
              <p class="solution-equation">${tex(String.raw`4 - 3t^{2} \ge 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`3t^{2} \le 4`, true)}</p>
              <p class="solution-equation">${tex(String.raw`t^{2} \le \frac{4}{3}`, true)}</p>
              平方根をとると、実数解をもつ範囲は
              <p class="solution-equation">${tex(String.raw`|t| \le \frac{2}{\sqrt{3}}`, true)}</p>
              です。
            </li>
            <li>${tex('t = 0')} で ${tex('x = 1')} となる枝を取ります。プラスの符号です。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{-t + \sqrt{4 - 3t^2}}{2}`, true)}</p>
              ${tex('t = 0')} では ${tex('x(0) = \\sqrt{4}/2 = 1')} です。ポテンシャルへ戻すと ${tex('1^2 + 0 + 0 = 1 = C')} です。
            </li>
            <li>陰関数を微分して、もとの微分形式に戻ることを確かめます。${tex('x^2 + xy + y^2 = 1')} の両辺を微分すると、
              <p class="solution-equation">${tex(String.raw`2x\,dx + (y\,dx + x\,dy) + 2y\,dy = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(2x + y)\,dx + (x + 2y)\,dy = 0`, true)}</p>
              与えられた方程式そのものです。この一致は式のままの一致です。したがって、この枝は例の厳密解です。
            </li>
            <li>図の下の欄と比べます。図は ${tex('t = 0')} から ${tex('t = 1/2')} までです。${tex('t = 1/2')} では
              <p class="solution-equation">${tex(String.raw`4 - 3 \cdot \left(\frac{1}{2}\right)^{2} = 4 - \frac{3}{4} = \frac{13}{4}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x\!\left(\frac{1}{2}\right) = \frac{-\frac{1}{2} + \sqrt{\frac{13}{4}}}{2} = \frac{-\frac{1}{2} + \frac{\sqrt{13}}{2}}{2} = \frac{\sqrt{13} - 1}{4}`, true)}</p>
              です。これは厳密な値です。欄の「厳密解」に出る 0.65139 は、ライブラリが返したこの値を小数5桁で表した近似の値です。「数値解」と「位置の誤差」は、選んだ数値解法で時間を刻んで得た近似の値です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './integrate.html', title: '積分して解く' },
        { href: './separation.html', title: '変数分離' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('完全性の判定を満たすとき、解はポテンシャルが一定という陰関数です。')}
      ${checkedProofs([{ statement: `${tex(String.raw`(2x + y)\,dx + (x + 2y)\,dy = 0`)} の陰関数の厳密解は ${tex(String.raw`x^2 + xy + y^2 = C`)} です。`, source: exactProof, moduleName: 'Ergion.Exact', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'exact', t0: 0, dt: 0.015625, steps: 32 },
  label: '完全微分の例の厳密解',
});
