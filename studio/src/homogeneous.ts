import './style.css';
import { appHeader, coreStepDoc, pageFooter, rail } from './chrome';
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
        <div class="equation" aria-label="同次形。x プライムは 1 足す x 割る t">
          ${tex(String.raw`x' = 1 + \frac{x}{t}`, true)}
          <span class="equation-note">右辺は x/t だけによる</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">同次形の手順</h2><span class="quiet-label">厳密解</span></div>
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
              ${tex('u')} は両辺から消えます。
              <p class="solution-equation">${tex(String.raw`t \frac{du}{dt} = 1`, true)}</p>
              ${tex('t > 0')} で割ると、${tex('u')} だけの方程式になります。
              <p class="solution-equation">${tex(String.raw`\frac{du}{dt} = \frac{1}{t}`, true)}</p>
            </li>
            <li>変数を分けます。これは変数分離です。
              <p class="solution-equation">${tex(String.raw`du = \frac{1}{t}\,dt`, true)}</p>
              両辺を積分します。${tex('t > 0')} なので ${tex('\\ln|t| = \\ln t')} です。積分定数を ${tex('C')} とすると、
              <p class="solution-equation">${tex(String.raw`u = \ln t + C`, true)}</p>
              ${tex('x = ut')} へ戻します。
              <p class="solution-equation">${tex(String.raw`x(t) = t(\ln t + C)`, true)}</p>
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置です。${tex('t')} は正の時刻です。${tex('u')} は位置と時刻の比 ${tex('x/t')} です。${tex('C')} は積分定数です。${tex('\\ln')} は自然対数です。${tex('t = 1')} では ${tex('\\ln 1 = 0')} なので ${tex('x(1) = C')} です。
            </li>
            <li>この式は厳密解です。級数にも、時間を刻む数値解法にもよらず、積分を閉じた形のまま残しています。打ち切り誤差はありません。計算の説明は ${coreStepDoc('homogeneous_ratio', '厳密解の説明')} です。
            </li>
          </ol>
          <h2 id="example-heading">数を代入した例</h2>
          <p>${tex('C = 0')} とします。${tex('t > 0')} という仮定はそのままです。同じ変形を、数を入れた式でたどります。</p>
          <ol class="solution">
            <li>方程式は ${tex(String.raw`x' = 1 + x/t`)} のままです。${tex('u = x/t')} と置くと ${tex(String.raw`u' = 1/t`)} です。
              <p class="solution-equation">${tex(String.raw`u = \ln t`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x(t) = t \ln t`, true)}</p>
            </li>
            <li>手で確かめます。${tex('t = 1')} では ${tex('\\ln 1 = 0')} なので ${tex('x(1) = 0')} です。これは ${tex('C = 0')} と一致します。微分すると、
              <p class="solution-equation">${tex(String.raw`x'(t) = \ln t + t \cdot \frac{1}{t} = \ln t + 1`, true)}</p>
              右辺は
              <p class="solution-equation">${tex(String.raw`1 + \frac{x(t)}{t} = 1 + \ln t`, true)}</p>
              左辺と右辺は同じ式です。この一致は近似ではなく、式のままの一致です。したがって ${tex('x(t) = t \\ln t')} はこの例の厳密解です。
            </li>
          </ol>
        </div>
      </section>
      ${steppedFigure(`タブは、方程式 ${tex(String.raw`x' = 1 + x/t`)} を進める数値解法だけを切り替えます。上の導出と厳密解は変わりません。時刻 1 から 2 までの誤差は、時間刻みによる打ち切りであり、丸めだけではありません。位置の表示は、厳密解を小数第5位まで示したものです。`)}
      ${pageFooter('同次形の置換 u = x/t で得る x(t) = t(ln t + C) は、t > 0 における厳密解です。')}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'homogeneous', t0: 1, dt: 0.015625, steps: 64 },
  xMin: 1,
  label: '同次形の例の厳密解',
});
