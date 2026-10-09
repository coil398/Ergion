import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
import homogeneousProof from '../../formal/lean/Ergion/Homogeneous.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('homogeneous')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 同次形</p>
          <h1>同次形<span class="title-dot">.</span></h1>
          <p class="description">右辺が比 ${tex('x/t')} だけの関数である方程式を、同次形と呼びます。置換 ${tex('u = x/t')} で <a class="doc-link" href="./separation.html">変数分離</a> に戻します。ここで得る式は厳密解です。2階方程式の右辺が 0 であるという意味の同次とは、別の形です。</p>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">同次形の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられているのは、次の方程式です。
              <p class="solution-equation">${tex(String.raw`x' = 1 + \frac{x}{t}`, true)}</p>
              右辺を ${tex('u = x/t')} の関数 ${tex('f(u) = 1 + u')} と見ます。この形を同次形と呼びます。時刻は ${tex('t > 0')} とします。${tex('t = 0')} では右辺の分母が 0 になるので、このページの解はその点を含みません。
            </li>
            <li>未知関数を比に置き換えます。${tex('u = x/t')} と置くと ${tex('x = ut')} です。積の微分は
              <p class="solution-equation">${tex(String.raw`x' = u' t + u`, true)}</p>
              です。これを方程式へ入れます。
              <p class="solution-equation">${tex(String.raw`u' t + u = 1 + u`, true)}</p>
              両辺から ${tex('u')} を引きます。
              <p class="solution-equation">${tex(String.raw`u' t = 1`, true)}</p>
              導関数を ${tex('du/dt')} と書きます。
              <p class="solution-equation">${tex(String.raw`t \frac{du}{dt} = 1`, true)}</p>
              ${tex('t > 0')} で両辺を割ると、${tex('u')} だけの方程式になります。
              <p class="solution-equation">${tex(String.raw`\frac{du}{dt} = \frac{1}{t}`, true)}</p>
            </li>
            <li>変数を分けます。両辺に ${tex('dt')} を掛けます。
              <p class="solution-equation">${tex(String.raw`du = \frac{1}{t}\,dt`, true)}</p>
              両辺を積分します。
              <p class="solution-equation">${tex(String.raw`\int 1\,du = \int \frac{1}{t}\,dt`, true)}</p>
              ${tex('t > 0')} なので ${tex('\\ln|t| = \\ln t')} です。積分定数を ${tex('C')} とすると、
              <p class="solution-equation">${tex(String.raw`u(t) = \ln t + C`, true)}</p>
              ${tex('x = ut')} へ戻します。
              <p class="solution-equation">${tex(String.raw`x(t) = t(\ln t + C)`, true)}</p>
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置です。${tex('t')} は正の時刻です。${tex('u')} は位置と時刻の比 ${tex('x/t')} です。${tex('C')} は積分定数です。${tex('\\ln')} は自然対数です。${tex('t = 1')} では ${tex('\\ln 1 = 0')} なので ${tex('x(1) = C')} です。
            </li>
            <li>この式は厳密解です。級数にも、時間を刻む数値解法にもよらず、積分を閉じた形のまま残しています。打ち切り誤差はありません。計算の説明は ${coreStepDoc('homogeneous_ratio', '厳密解の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('homogeneous', 'x′ = 1 + x/t の傾きは原点から出る半直線の上で一定で、例の解 x = t ln t は t = 0 を通らない。')}
      ${steppedFigure(false, 'homogeneous')}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('C = 0')} とします。${tex('t > 0')} という仮定はそのままです。同じ変形を、数を入れた式でたどります。</p>
          <ol class="solution">
            <li>方程式は ${tex(String.raw`x' = 1 + x/t`)} のままです。${tex('u = x/t')} と置くと、上の手順と同じく
              <p class="solution-equation">${tex(String.raw`\frac{du}{dt} = \frac{1}{t}`, true)}</p>
              です。両辺を積分し、${tex('C = 0')} を入れます。
              <p class="solution-equation">${tex(String.raw`u(t) = \int \frac{1}{t}\,dt = \ln t + C = \ln t + 0 = \ln t`, true)}</p>
              ${tex('x = ut')} へ戻します。
              <p class="solution-equation">${tex(String.raw`x(t) = t \ln t`, true)}</p>
            </li>
            <li>手で確かめます。${tex('t = 1')} では ${tex('\\ln 1 = 0')} なので ${tex('x(1) = 0')} です。これは ${tex('C = 0')} と一致します。微分すると、
              <p class="solution-equation">${tex(String.raw`x'(t) = \ln t + t \cdot \frac{1}{t} = \ln t + 1`, true)}</p>
              右辺は
              <p class="solution-equation">${tex(String.raw`1 + \frac{x(t)}{t} = 1 + \ln t`, true)}</p>
              左辺と右辺は同じ式です。この一致は近似ではなく、式のままの一致です。したがって ${tex('x(t) = t \\ln t')} はこの例の厳密解です。
            </li>
            <li>図の下の欄と比べます。図は時刻 ${tex('t = 1')} から始まり、時刻 ${tex('t = 2')} では
              <p class="solution-equation">${tex(String.raw`x(2) = 2 \ln 2`, true)}</p>
              です。これは厳密な値です。欄の「厳密解」に出る 1.38629 は、ライブラリが返したこの値を小数5桁で表した近似の値です。「数値解」と「位置の誤差」は、選んだ数値解法で時間を刻んで得た近似の値です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './separation.html', title: '変数分離' },
        { href: './linear.html', title: '1階線形' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('同次形の置換 u = x/t で得る x(t) = t(ln t + C) は、t > 0 における厳密解です。')}
      ${checkedProofs([{ statement: `${tex(String.raw`x' = 1 + \frac{x}{t}`)} の、${tex('t > 0')} における厳密解は ${tex(String.raw`x(t) = t(\ln t + C)`)} です。`, source: homogeneousProof, moduleName: 'Ergion.Homogeneous', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'homogeneous', t0: 1, dt: 0.015625, steps: 64 },
  xMin: 1,
  label: '同次形の例の厳密解',
});
