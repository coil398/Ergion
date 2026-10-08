import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
import systemProof from '../../formal/lean/Ergion/LinearSystem.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('system')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 連立1階</p>
          <h1>連立1階<span class="title-dot">.</span></h1>
          <p class="description">二つの未知関数が、定数係数の1次式で互いに結ばれている方程式です。係数行列の固有値と固有ベクトルから、厳密解を作ります。</p>
        </div>
        <div class="equation" aria-label="定数係数の2元連立1階方程式">
          ${tex(String.raw`\begin{aligned} x' &= x + y \\ y' &= 4x + y \end{aligned}`, true)}
          <span class="equation-note">係数は定数</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">固有値の手順</h2><span class="quiet-label">厳密解</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の連立方程式です。初期条件は ${tex('x(0) = 1')}、${tex('y(0) = 0')} とします。
              <p class="solution-equation">${tex(String.raw`x' = x + y,\qquad y' = 4x + y`, true)}</p>
              ベクトル ${tex('\\mathbf{z} = (x, y)')} と係数行列で書くと、
              <p class="solution-equation">${tex(String.raw`\mathbf{z}' = \begin{pmatrix} 1 & 1 \\ 4 & 1 \end{pmatrix} \mathbf{z}`, true)}</p>
              です。係数はすべて定数です。
            </li>
            <li>${tex('\\mathbf{z} = e^{rt} \\mathbf{v}')} と置くと、係数行列から ${tex('r')} 倍の単位行列を引いた行列を ${tex('\\mathbf{v}')} に掛けると ${tex('0')} です。固有値は
              <p class="solution-equation">${tex(String.raw`\det\begin{pmatrix} 1 - r & 1 \\ 4 & 1 - r \end{pmatrix} = (1 - r)^{2} - 4 = r^{2} - 2r - 3 = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(r - 3)(r + 1) = 0`, true)}</p>
              なので ${tex('r_1 = 3')}、${tex('r_2 = -1')} です。二つの実数で、互いに異なります。
            </li>
            <li>${tex('r = 3')} のとき ${tex('(1 - 3)v_1 + v_2 = 0')}、つまり ${tex('v_2 = 2 v_1')} です。固有ベクトルを ${tex('\\mathbf{v}_1 = (1, 2)')} に取ります。
              ${tex('r = -1')} のとき ${tex('(1 - (-1))v_1 + v_2 = 0')}、つまり ${tex('v_2 = -2 v_1')} です。固有ベクトルを ${tex('\\mathbf{v}_2 = (1, -2)')} に取ります。
            </li>
            <li>一般解は、任意定数 ${tex('A')}、${tex('B')} を用いて
              <p class="solution-equation">${tex(String.raw`\begin{aligned} x(t) &= A e^{3t} + B e^{-t} \\ y(t) &= 2A e^{3t} - 2B e^{-t} \end{aligned}`, true)}</p>
              です。初期条件 ${tex('x(0) = A + B = 1')}、${tex('y(0) = 2A - 2B = 0')} を入れます。第2式から ${tex('A = B')} です。第1式から ${tex('2A = 1')}、したがって ${tex('A = B = 1/2')} です。厳密解は
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{2}\bigl(e^{3t} + e^{-t}\bigr)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`y(t) = e^{3t} - e^{-t}`, true)}</p>
              です。
            </li>
            <li>記号を定めます。${tex('x(t)')} と ${tex('y(t)')} は時刻 ${tex('t')} の二つの未知関数です。${tex('t')} は時刻です。${tex('\\mathbf{z}')} は ${tex('(x, y)')} を縦に並べたベクトルです。${tex('r')} は固有値、${tex('r_1')} と ${tex('r_2')} はその二つの値です。${tex('\\mathbf{v}')}、${tex('\\mathbf{v}_1')}、${tex('\\mathbf{v}_2')} は固有ベクトルで、成分は ${tex('(v_1, v_2)')} です。${tex('A')} と ${tex('B')} は一般解の任意定数です。${tex('e')} は自然対数の底です。係数行列は成分 ${tex('1, 1, 4, 1')} で書いてあり、別の文字は付けていません。
            </li>
            <li>この組は厳密解です。固有値は2次方程式の根で、解は指数関数の一次結合です。級数にも時間の刻みにもよりません。打ち切り誤差はありません。${tex('x')} の説明は ${coreStepDoc('linear_system_x', '厳密解の説明')}、${tex('y')} の説明は ${coreStepDoc('linear_system_y', 'もう一つの未知関数の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${steppedFigure(true)}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した検算</h2>
          <ol class="solution">
            <li>${tex('t = 0')} では ${tex('e^{0} = 1')} なので
              <p class="solution-equation">${tex(String.raw`x(0) = \frac{1}{2}(1 + 1) = 1`, true)}</p>
              <p class="solution-equation">${tex(String.raw`y(0) = 1 - 1 = 0`, true)}</p>
              初期条件と一致します。
            </li>
            <li>微分します。
              <p class="solution-equation">${tex(String.raw`x'(t) = \frac{1}{2}\bigl(3e^{3t} - e^{-t}\bigr)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`y'(t) = 3e^{3t} + e^{-t}`, true)}</p>
              右辺 ${tex('x + y')} は
              <p class="solution-equation">${tex(String.raw`x + y = \frac{1}{2}e^{3t} + \frac{1}{2}e^{-t} + e^{3t} - e^{-t} = \frac{3}{2}e^{3t} - \frac{1}{2}e^{-t}`, true)}</p>
              ${tex('x\'')} と一致します。右辺 ${tex('4x + y')} は
              <p class="solution-equation">${tex(String.raw`4x + y = 2e^{3t} + 2e^{-t} + e^{3t} - e^{-t} = 3e^{3t} + e^{-t}`, true)}</p>
              ${tex('y\'')} と一致します。この一致は式のままの一致です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFooter('定数係数の連立1階方程式は、相異なる実固有値ごとに指数関数と固有ベクトルの積を重ねた厳密解を持ちます。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x' = x + y`)} と ${tex(String.raw`y' = 4x + y`)} の解は、相異なる実固有値ごとの指数関数と固有ベクトルの積の和です。`, source: systemProof, moduleName: 'Ergion.LinearSystem', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'system', t0: 0, dt: 0.015625, steps: 64 },
  label: '連立1階の例の厳密解',
  companion: true,
});
