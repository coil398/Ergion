import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import secondOrderProof from '../../formal/lean/Ergion/SecondOrder.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('second-order')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 定数係数の2階同次</p>
          <h1>定数係数の2階同次<span class="title-dot">.</span></h1>
          <p class="description">未知関数とその1階、2階の導関数が、定数係数の1次式で結ばれ、右辺が 0 である方程式です。特性方程式の根の形で、一般解が決まります。ここで得る式はどれも厳密解です。</p>
        </div>
        <div class="equation" aria-label="定数係数の2階同次方程式">
          ${tex(String.raw`x'' + b x' + c x = 0`, true)}
          <span class="equation-note">b と c は定数</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">特性根の手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられている形は次の式です。${tex('b')} と ${tex('c')} は実定数です。
              <p class="solution-equation">${tex(String.raw`x'' + b x' + c x = 0`, true)}</p>
              ${tex('x = e^{rt}')} を試しに入れます。${tex(String.raw`x' = r e^{rt}`)}、${tex(String.raw`x'' = r^{2} e^{rt}`)} なので、
              <p class="solution-equation">${tex(String.raw`(r^{2} + b r + c)\,e^{rt} = 0`, true)}</p>
              ${tex('e^{rt} \\neq 0')} ですから、特性方程式は
              <p class="solution-equation">${tex(String.raw`r^{2} + b r + c = 0`, true)}</p>
              です。判別式を ${tex('D = b^{2} - 4c')} とします。
            </li>
            <li>相異なる二つの実根 ${tex('D > 0')} のとき、根を ${tex('r_1')}、${tex('r_2')} とします。一般解は任意定数 ${tex('A')}、${tex('B')} を用いて
              <p class="solution-equation">${tex(String.raw`x(t) = A e^{r_1 t} + B e^{r_2 t}`, true)}</p>
              です。
            </li>
            <li>重根 ${tex('D = 0')} のとき、根を ${tex('r')} とすると ${tex('e^{rt}')} と ${tex('t e^{rt}')} が一次独立な解です。一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = (A + B t)\,e^{rt}`, true)}</p>
              です。
            </li>
            <li>複素根 ${tex('D < 0')} のとき、根は ${tex('\\alpha \\pm i\\beta')} で、${tex('\\beta > 0')} です。実数値の一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = e^{\alpha t}(A \cos \beta t + B \sin \beta t)`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('b')} と ${tex('c')} は方程式の定数、${tex('r')} は特性根、${tex('D')} は判別式、${tex('A')} と ${tex('B')} は任意定数、${tex('e')} は自然対数の底、${tex('i')} は虚数単位、${tex('\\alpha')} は複素根の実部、${tex('\\beta')} は虚部の絶対値です。これらの一般解は、特性方程式を代数的に解いて得た厳密解です。時間の刻みによる打ち切りはありません。
            </li>
          </ol>
          <h2 id="real-heading">相異なる実根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = 0,\qquad x(0) = 1,\qquad x'(0) = 3`, true)}</p>
              特性方程式は ${tex('r^{2} - 3r + 2 = 0')}、つまり ${tex('(r - 1)(r - 2) = 0')} です。根は ${tex('r_1 = 1')}、${tex('r_2 = 2')} で、相異なります。
              <p class="solution-equation">${tex(String.raw`x(t) = A e^{t} + B e^{2t}`, true)}</p>
            </li>
            <li>初期条件を入れます。${tex('x(0) = A + B = 1')} です。微分は ${tex(String.raw`x' = A e^{t} + 2B e^{2t}`)} なので ${tex('x\'(0) = A + 2B = 3')} です。差を取ると ${tex('B = 2')}、したがって ${tex('A = -1')} です。
              <p class="solution-equation">${tex(String.raw`x(t) = -e^{t} + 2e^{2t}`, true)}</p>
              計算の説明は ${coreStepDoc('characteristic_two_real', '厳密解の説明')} です。
            </li>
            <li>手で確かめます。${tex('t = 0')} では ${tex('x(0) = -1 + 2 = 1')} です。
              <p class="solution-equation">${tex(String.raw`x'(t) = -e^{t} + 4e^{2t},\qquad x'(0) = 3`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x''(t) = -e^{t} + 8e^{2t}`, true)}</p>
              左辺は
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = (-1 + 3 - 2)e^{t} + (8 - 12 + 4)e^{2t} = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。
            </li>
          </ol>
          <h2 id="repeated-heading">重根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' - 2x' + x = 0,\qquad x(0) = 1,\qquad x'(0) = 0`, true)}</p>
              特性方程式は ${tex('(r - 1)^{2} = 0')} です。根は ${tex('r = 1')} の重根です。
              <p class="solution-equation">${tex(String.raw`x(t) = (A + Bt)\,e^{t}`, true)}</p>
            </li>
            <li>${tex('x(0) = A = 1')} です。微分は ${tex(String.raw`x' = (A + B + Bt)e^{t}`)} なので ${tex('x\'(0) = A + B = 0')}、したがって ${tex('B = -1')} です。
              <p class="solution-equation">${tex(String.raw`x(t) = (1 - t)e^{t}`, true)}</p>
              計算の説明は ${coreStepDoc('characteristic_repeated', '重根の解の説明')} です。
            </li>
            <li>手で確かめます。${tex('x(0) = 1')} です。
              <p class="solution-equation">${tex(String.raw`x'(t) = -e^{t} + (1 - t)e^{t} = -t e^{t}`, true)}</p>
              ${tex('x\'(0) = 0')} です。さらに ${tex(String.raw`x'' = -(1 + t)e^{t}`)} なので、
              <p class="solution-equation">${tex(String.raw`x'' - 2x' + x = e^{t}\bigl(-(1 + t) + 2t + (1 - t)\bigr) = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。
            </li>
          </ol>
          <h2 id="complex-heading">複素根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' + x = 0,\qquad x(0) = 1,\qquad x'(0) = 0`, true)}</p>
              特性方程式は ${tex('r^{2} + 1 = 0')}、根は ${tex('r = \\pm i')} です。実部 ${tex('\\alpha = 0')}、虚部 ${tex('\\beta = 1')} なので、
              <p class="solution-equation">${tex(String.raw`x(t) = A \cos t + B \sin t`, true)}</p>
            </li>
            <li>${tex('x(0) = A = 1')} です。${tex(String.raw`x' = -A \sin t + B \cos t`)} なので ${tex('x\'(0) = B = 0')} です。
              <p class="solution-equation">${tex(String.raw`x(t) = \cos t`, true)}</p>
              計算の説明は ${coreStepDoc('characteristic_complex', '複素根の解の説明')} です。
            </li>
            <li>手で確かめます。${tex('x(0) = \\cos 0 = 1')}、${tex(String.raw`x'(0) = -\sin 0 = 0`)} です。
              <p class="solution-equation">${tex(String.raw`x''(t) + x(t) = -\cos t + \cos t = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。図の厳密解は、相異なる実根の例を標本の時刻で評価したものです。数値解は、同じ方程式を選んだ方法で進めたものです。
            </li>
          </ol>
        </div>
      </section>
      ${steppedFigure(`タブは、実根の例 ${tex(String.raw`x'' - 3x' + 2x = 0`)} を進める数値解法だけを切り替えます。上の導出と厳密解は変わりません。誤差は、時間刻みによる打ち切りであり、丸めだけではありません。位置の表示は、厳密解を小数第5位まで示したものです。`)}
      ${checkedProofs([{ statement: `${tex(String.raw`x'' + b x' + c x = 0`)} の一般解は、特性根が相異なる実数、重根、複素数のどれかで書けます。`, source: secondOrderProof, moduleName: 'Ergion.SecondOrder', kind: '実数' }])}
      ${pageFooter('定数係数の2階同次方程式の解は、特性根が実数、重根、複素数のどれかで厳密に書けます。')}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'two-real', t0: 0, dt: 0.015625, steps: 64 },
  label: '相異なる実根の例の厳密解',
});
