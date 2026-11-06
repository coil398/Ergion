import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
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
          <h1>定数係数の2階同次</h1>
          <p class="description">未知関数とその1階、2階の導関数が、定数係数の1次式で結ばれ、右辺が 0 である方程式です。特性方程式の根の形で、一般解が決まります。ここで得る式はどれも厳密解です。</p>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">特性根の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられている形は次の式です。${tex('b')} と ${tex('c')} は実定数です。
              <p class="solution-equation">${tex(String.raw`x'' + b x' + c x = 0`, true)}</p>
              ${tex('x = e^{rt}')} を試しに入れます。${tex('r')} は定数です。導関数は
              <p class="solution-equation">${tex(String.raw`x' = r e^{rt},\qquad x'' = r^{2} e^{rt}`, true)}</p>
              です。方程式の左辺へ代入します。
              <p class="solution-equation">${tex(String.raw`r^{2} e^{rt} + b r e^{rt} + c e^{rt} = 0`, true)}</p>
              共通因数 ${tex('e^{rt}')} でくくります。
              <p class="solution-equation">${tex(String.raw`(r^{2} + b r + c)\,e^{rt} = 0`, true)}</p>
              ${tex('e^{rt} \\neq 0')} ですから、特性方程式は
              <p class="solution-equation">${tex(String.raw`r^{2} + b r + c = 0`, true)}</p>
              です。2次方程式の根の公式から
              <p class="solution-equation">${tex(String.raw`r = \frac{-b \pm \sqrt{b^{2} - 4c}}{2}`, true)}</p>
              です。根号の中を判別式 ${tex('D = b^{2} - 4c')} とします。${tex('D')} の符号で、根の形が三つに分かれます。
            </li>
            <li>${tex('D > 0')} のとき、${tex('\\sqrt{D}')} は正の実数です。根の公式の二つの符号から、相異なる二つの実根を得ます。
              <p class="solution-equation">${tex(String.raw`r_1 = \frac{-b - \sqrt{D}}{2},\qquad r_2 = \frac{-b + \sqrt{D}}{2}`, true)}</p>
              前の手順により、${tex('e^{r_1 t}')} と ${tex('e^{r_2 t}')} はどちらも解です。方程式は ${tex('x')} について1次なので、二つの解の定数倍の和も解です。一般解は任意定数 ${tex('A')}、${tex('B')} を用いて
              <p class="solution-equation">${tex(String.raw`x(t) = A e^{r_1 t} + B e^{r_2 t}`, true)}</p>
              です。
            </li>
            <li>${tex('D = 0')} のとき、${tex('\\sqrt{D} = 0')} なので、根は一つだけです。
              <p class="solution-equation">${tex(String.raw`r = -\frac{b}{2}`, true)}</p>
              この ${tex('r')} を重根と呼びます。${tex('e^{rt}')} は解です。もう一つの解として ${tex('x = t e^{rt}')} を確かめます。積の微分により
              <p class="solution-equation">${tex(String.raw`x' = e^{rt} + r t e^{rt}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'' = r e^{rt} + r e^{rt} + r^{2} t e^{rt} = 2r e^{rt} + r^{2} t e^{rt}`, true)}</p>
              です。方程式の左辺へ代入します。
              <p class="solution-equation">${tex(String.raw`x'' + b x' + c x = \bigl(2r e^{rt} + r^{2} t e^{rt}\bigr) + b\bigl(e^{rt} + r t e^{rt}\bigr) + c\,t e^{rt}`, true)}</p>
              括弧を外します。
              <p class="solution-equation">${tex(String.raw`= 2r e^{rt} + r^{2} t e^{rt} + b e^{rt} + b r t e^{rt} + c\,t e^{rt}`, true)}</p>
              ${tex('e^{rt}')} の項と ${tex('t e^{rt}')} の項にまとめます。
              <p class="solution-equation">${tex(String.raw`= (2r + b)\,e^{rt} + (r^{2} + b r + c)\,t e^{rt}`, true)}</p>
              ${tex('r = -b/2')} なので ${tex('2r + b = 0')} です。${tex('r')} は特性方程式の根なので ${tex('r^{2} + br + c = 0')} です。
              <p class="solution-equation">${tex(String.raw`= 0 \cdot e^{rt} + 0 \cdot t e^{rt} = 0`, true)}</p>
              したがって ${tex('t e^{rt}')} も解です。${tex('e^{rt}')} と ${tex('t e^{rt}')} は一次独立なので、一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = (A + B t)\,e^{rt}`, true)}</p>
              です。
            </li>
            <li>${tex('D < 0')} のとき、${tex('-D > 0')} なので ${tex('\\sqrt{D} = i\\sqrt{-D}')} と書けます。根の公式は
              <p class="solution-equation">${tex(String.raw`r = \frac{-b \pm i\sqrt{-D}}{2} = -\frac{b}{2} \pm i\,\frac{\sqrt{4c - b^{2}}}{2}`, true)}</p>
              です。実部と虚部を
              <p class="solution-equation">${tex(String.raw`\alpha = -\frac{b}{2},\qquad \beta = \frac{\sqrt{4c - b^{2}}}{2}`, true)}</p>
              と置くと、根は ${tex('\\alpha \\pm i\\beta')} で、${tex('\\beta > 0')} です。複素数の解 ${tex('e^{(\\alpha + i\\beta)t}')} を、オイラーの公式 ${tex('e^{i\\theta} = \\cos\\theta + i\\sin\\theta')} で書き直します。
              <p class="solution-equation">${tex(String.raw`e^{(\alpha + i\beta)t} = e^{\alpha t} e^{i\beta t} = e^{\alpha t}(\cos \beta t + i \sin \beta t)`, true)}</p>
              方程式の係数 ${tex('b')}、${tex('c')} は実数なので、複素数の解の実部と虚部は、それぞれ実数値の解です。
              <p class="solution-equation">${tex(String.raw`e^{\alpha t}\cos \beta t,\qquad e^{\alpha t}\sin \beta t`, true)}</p>
              実数値の一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = e^{\alpha t}(A \cos \beta t + B \sin \beta t)`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('b')} と ${tex('c')} は方程式の定数、${tex('r')} は特性根、${tex('r_1')} と ${tex('r_2')} は相異なる二つの実根、${tex('D')} は判別式、${tex('A')} と ${tex('B')} は任意定数、${tex('e')} は自然対数の底、${tex('i')} は虚数単位、${tex('\\alpha')} は複素根の実部、${tex('\\beta')} は虚部の絶対値、${tex('\\theta')} はオイラーの公式の実数の変数です。これらの一般解は、特性方程式を代数的に解いて得た厳密解です。時間の刻みによる打ち切りはありません。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('second-order', '定数係数の2階同次は、特性根が相異なる実数、重根、複素数のどれかで、三つの形の厳密解を持つ。')}
      ${steppedFigure(false, 'second-order')}
      <section class="study panel" id="example" aria-labelledby="real-heading">
        <div class="study-body">
          <h2 id="real-heading">相異なる実根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = 0,\qquad x(0) = 1,\qquad x'(0) = 3`, true)}</p>
              ${tex('b = -3')}、${tex('c = 2')} です。${tex('x = e^{rt}')} を代入します。
              <p class="solution-equation">${tex(String.raw`r^{2} e^{rt} - 3r e^{rt} + 2 e^{rt} = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(r^{2} - 3r + 2)\,e^{rt} = 0`, true)}</p>
              ${tex('e^{rt} \\neq 0')} なので、特性方程式は
              <p class="solution-equation">${tex(String.raw`r^{2} - 3r + 2 = 0`, true)}</p>
              です。判別式は
              <p class="solution-equation">${tex(String.raw`D = (-3)^{2} - 4 \cdot 2 = 9 - 8 = 1`, true)}</p>
              で、${tex('D > 0')} です。根の公式へ入れます。
              <p class="solution-equation">${tex(String.raw`r = \frac{3 \pm \sqrt{1}}{2} = \frac{3 \pm 1}{2}`, true)}</p>
              <p class="solution-equation">${tex(String.raw`r_1 = \frac{3 - 1}{2} = 1,\qquad r_2 = \frac{3 + 1}{2} = 2`, true)}</p>
              因数分解の形は ${tex('(r - 1)(r - 2) = 0')} です。展開すると特性方程式に戻ります。
              <p class="solution-equation">${tex(String.raw`(r - 1)(r - 2) = r^{2} - 2r - r + 2 = r^{2} - 3r + 2`, true)}</p>
              根 ${tex('r_1 = 1')}、${tex('r_2 = 2')} は相異なります。一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = A e^{t} + B e^{2t}`, true)}</p>
              です。導関数は
              <p class="solution-equation">${tex(String.raw`x'(t) = A e^{t} + 2B e^{2t}`, true)}</p>
              です。
            </li>
            <li>初期条件を代入します。
              <p class="solution-equation">${tex(String.raw`x(0) = A e^{0} + B e^{0} = A + B = 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'(0) = A e^{0} + 2B e^{0} = A + 2B = 3`, true)}</p>
              第2式から第1式を引きます。
              <p class="solution-equation">${tex(String.raw`(A + 2B) - (A + B) = 3 - 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`A - A + 2B - B = 2`, true)}</p>
              <p class="solution-equation">${tex(String.raw`B = 2`, true)}</p>
              第1式へ代入します。
              <p class="solution-equation">${tex(String.raw`A + 2 = 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`A = 1 - 2 = -1`, true)}</p>
              したがって厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = -e^{t} + 2e^{2t}`, true)}</p>
              です。計算の説明は ${coreStepDoc('characteristic_two_real', '厳密解の説明')} です。
            </li>
            <li>手で確かめます。${tex('t = 0')} では ${tex('x(0) = -1 + 2 = 1')} です。
              <p class="solution-equation">${tex(String.raw`x'(t) = -e^{t} + 4e^{2t},\qquad x'(0) = -1 + 4 = 3`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x''(t) = -e^{t} + 8e^{2t}`, true)}</p>
              左辺へ代入します。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = \bigl(-e^{t} + 8e^{2t}\bigr) - 3\bigl(-e^{t} + 4e^{2t}\bigr) + 2\bigl(-e^{t} + 2e^{2t}\bigr)`, true)}</p>
              括弧を外します。
              <p class="solution-equation">${tex(String.raw`= -e^{t} + 8e^{2t} + 3e^{t} - 12e^{2t} - 2e^{t} + 4e^{2t}`, true)}</p>
              同類項をまとめます。
              <p class="solution-equation">${tex(String.raw`= (-1 + 3 - 2)e^{t} + (8 - 12 + 4)e^{2t} = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。
            </li>
            <li>図は、この相異なる実根の例です。図の下の欄と比べます。時刻 ${tex('t = 1')} では
              <p class="solution-equation">${tex(String.raw`x(1) = -e^{1} + 2e^{2 \cdot 1} = -e + 2e^{2}`, true)}</p>
              です。これは厳密な値です。欄の「厳密解」に出る 12.05983 は、ライブラリが返したこの値を小数5桁で表した近似の値です。「数値解」と「位置の誤差」は、同じ方程式を選んだ数値解法で時間を刻んで得た近似の値です。
            </li>
          </ol>
          <h2 id="repeated-heading">重根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' - 2x' + x = 0,\qquad x(0) = 1,\qquad x'(0) = 0`, true)}</p>
              ${tex('b = -2')}、${tex('c = 1')} です。${tex('x = e^{rt}')} を代入します。
              <p class="solution-equation">${tex(String.raw`r^{2} e^{rt} - 2r e^{rt} + e^{rt} = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(r^{2} - 2r + 1)\,e^{rt} = 0`, true)}</p>
              ${tex('e^{rt} \\neq 0')} なので、特性方程式は
              <p class="solution-equation">${tex(String.raw`r^{2} - 2r + 1 = 0`, true)}</p>
              です。判別式は
              <p class="solution-equation">${tex(String.raw`D = (-2)^{2} - 4 \cdot 1 = 4 - 4 = 0`, true)}</p>
              で、${tex('D = 0')} です。根の公式へ入れます。
              <p class="solution-equation">${tex(String.raw`r = \frac{2 \pm \sqrt{0}}{2} = \frac{2}{2} = 1`, true)}</p>
              因数分解の形は ${tex('(r - 1)^{2} = 0')} です。展開すると特性方程式に戻ります。
              <p class="solution-equation">${tex(String.raw`(r - 1)^{2} = r^{2} - r - r + 1 = r^{2} - 2r + 1`, true)}</p>
              根は ${tex('r = 1')} の重根です。一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = (A + Bt)\,e^{t}`, true)}</p>
              です。積の微分により
              <p class="solution-equation">${tex(String.raw`x'(t) = B e^{t} + (A + Bt)e^{t} = (A + B + Bt)e^{t}`, true)}</p>
              です。
            </li>
            <li>初期条件を代入します。
              <p class="solution-equation">${tex(String.raw`x(0) = (A + B \cdot 0)e^{0} = A = 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'(0) = (A + B + B \cdot 0)e^{0} = A + B = 0`, true)}</p>
              ${tex('A = 1')} を代入すると
              <p class="solution-equation">${tex(String.raw`1 + B = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`B = -1`, true)}</p>
              したがって厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = (1 - t)e^{t}`, true)}</p>
              です。計算の説明は ${coreStepDoc('characteristic_repeated', '重根の解の説明')} です。
            </li>
            <li>手で確かめます。${tex('x(0) = (1 - 0)e^{0} = 1')} です。積の微分により
              <p class="solution-equation">${tex(String.raw`x'(t) = -e^{t} + (1 - t)e^{t} = (-1 + 1 - t)e^{t} = -t e^{t}`, true)}</p>
              ${tex("x'(0) = -0 \\cdot e^{0} = 0")} です。もう一度微分します。
              <p class="solution-equation">${tex(String.raw`x''(t) = -e^{t} - t e^{t} = -(1 + t)e^{t}`, true)}</p>
              左辺へ代入します。
              <p class="solution-equation">${tex(String.raw`x'' - 2x' + x = -(1 + t)e^{t} - 2\bigl(-t e^{t}\bigr) + (1 - t)e^{t}`, true)}</p>
              ${tex('e^{t}')} でくくり、括弧を外します。
              <p class="solution-equation">${tex(String.raw`= e^{t}\bigl(-1 - t + 2t + 1 - t\bigr)`, true)}</p>
              同類項をまとめます。
              <p class="solution-equation">${tex(String.raw`= e^{t}\bigl((-1 + 1) + (-1 + 2 - 1)t\bigr) = e^{t} \cdot 0 = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。
            </li>
          </ol>
          <h2 id="complex-heading">複素根の例</h2>
          <ol class="solution">
            <li>方程式と初期条件は次のとおりです。
              <p class="solution-equation">${tex(String.raw`x'' + x = 0,\qquad x(0) = 1,\qquad x'(0) = 0`, true)}</p>
              ${tex('b = 0')}、${tex('c = 1')} です。${tex('x = e^{rt}')} を代入します。
              <p class="solution-equation">${tex(String.raw`r^{2} e^{rt} + e^{rt} = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(r^{2} + 1)\,e^{rt} = 0`, true)}</p>
              ${tex('e^{rt} \\neq 0')} なので、特性方程式は
              <p class="solution-equation">${tex(String.raw`r^{2} + 1 = 0`, true)}</p>
              です。判別式は
              <p class="solution-equation">${tex(String.raw`D = 0^{2} - 4 \cdot 1 = -4`, true)}</p>
              で、${tex('D < 0')} です。${tex('\\sqrt{D} = i\\sqrt{4} = 2i')} を根の公式へ入れます。
              <p class="solution-equation">${tex(String.raw`r = \frac{0 \pm 2i}{2} = \pm i`, true)}</p>
              実部と虚部は
              <p class="solution-equation">${tex(String.raw`\alpha = -\frac{0}{2} = 0,\qquad \beta = \frac{\sqrt{4 \cdot 1 - 0^{2}}}{2} = \frac{2}{2} = 1`, true)}</p>
              なので、一般解は
              <p class="solution-equation">${tex(String.raw`x(t) = e^{0 \cdot t}(A \cos t + B \sin t) = A \cos t + B \sin t`, true)}</p>
              です。導関数は
              <p class="solution-equation">${tex(String.raw`x'(t) = -A \sin t + B \cos t`, true)}</p>
              です。
            </li>
            <li>初期条件を代入します。
              <p class="solution-equation">${tex(String.raw`x(0) = A \cos 0 + B \sin 0 = A \cdot 1 + B \cdot 0 = A = 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'(0) = -A \sin 0 + B \cos 0 = -A \cdot 0 + B \cdot 1 = B = 0`, true)}</p>
              したがって ${tex('A = 1')}、${tex('B = 0')} です。厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = \cos t`, true)}</p>
              です。計算の説明は ${coreStepDoc('characteristic_complex', '複素根の解の説明')} です。
            </li>
            <li>手で確かめます。${tex('x(0) = \\cos 0 = 1')} です。微分すると
              <p class="solution-equation">${tex(String.raw`x'(t) = -\sin t,\qquad x'(0) = -\sin 0 = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x''(t) = -\cos t`, true)}</p>
              左辺へ代入します。
              <p class="solution-equation">${tex(String.raw`x''(t) + x(t) = -\cos t + \cos t = 0`, true)}</p>
              方程式を満たします。この一致は式のままの一致です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './undetermined.html', title: '未定係数法' },
        { href: './variation.html', title: '定数変化法' },
        { href: './series.html', title: 'べき級数' },
        { href: './system.html', title: '連立1階' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('定数係数の2階同次方程式の解は、特性根が実数、重根、複素数のどれかで厳密に書けます。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x'' + b x' + c x = 0`)} の一般解は、特性根が相異なる実数、重根、複素数のどれかで書けます。`, source: secondOrderProof, moduleName: 'Ergion.SecondOrder', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'two-real', t0: 0, dt: 0.015625, steps: 64 },
  label: '相異なる実根の例の厳密解',
});
