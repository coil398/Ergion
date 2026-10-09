import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, coreStepDoc, pageFooter, rail, relatedPages } from './chrome';
import laplaceProof from '../../formal/lean/Ergion/Laplace.lean?raw';
import { checkedProofs } from './proof';
import { mountSteppedFigure, steppedFigure } from './curve';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail('laplace')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> Laplace 変換</p>
          <h1>Laplace 変換<span class="title-dot">.</span></h1>
          <p class="description">初期値を変換の中に取り込み、微分方程式を ${tex('s')} の代数方程式にします。逆変換で時刻の関数へ戻します。ここで使う変換は、このページに書き出します。得る式は厳密解です。</p>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">変換と逆変換</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>与えられている初期値問題は、次の式です。左辺は <a class="doc-link" href="./undetermined.html">未定係数法</a> の例と同じです。ここでは変換で解き、同じ厳密解に着くことを見ます。
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = e^{3t},\qquad x(0) = 0,\qquad x'(0) = 0`, true)}</p>
              ${tex('x')} は指数型の増大しかしない解を探す、という仮定で Laplace 変換を使います。この問題の解は指数関数の一次結合なので、その仮定を満たします。
            </li>
            <li>このページで使う変換を、先に書きます。${tex('X(s) = \\mathcal{L}\\{x\\}(s)')} とし、${tex('s')} は変換の変数です。
              <p class="solution-equation">${tex(String.raw`\mathcal{L}\{x'\} = sX - x(0)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\mathcal{L}\{x''\} = s^{2}X - sx(0) - x'(0)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\mathcal{L}\{e^{at}\} = \frac{1}{s - a}\quad (s > a)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\mathcal{L}^{-1}\!\left\{\frac{1}{s - a}\right\} = e^{at}`, true)}</p>
              ${tex('a')} は実定数です。初期条件 ${tex('x(0) = x\'(0) = 0')} を入れると、${tex('\\mathcal{L}\\{x\'\\} = sX')}、${tex('\\mathcal{L}\\{x\'\'\\} = s^{2}X')} です。
            </li>
            <li>方程式の両辺を変換します。
              <p class="solution-equation">${tex(String.raw`(s^{2}X - sx(0) - x'(0)) - 3(sX - x(0)) + 2X = \frac{1}{s - 3}`, true)}</p>
              初期条件 ${tex('x(0) = 0')}、${tex("x'(0) = 0")} を代入します。
              <p class="solution-equation">${tex(String.raw`s^{2}X - 3sX + 2X = \frac{1}{s - 3}`, true)}</p>
              ${tex('X(s)')} をくくります。
              <p class="solution-equation">${tex(String.raw`(s^{2} - 3s + 2)X = \frac{1}{s - 3}`, true)}</p>
              左辺の2次式を因数分解します。積を展開すると元の2次式に戻ります。
              <p class="solution-equation">${tex(String.raw`(s - 1)(s - 2) = s^{2} - 2s - s + 2 = s^{2} - 3s + 2`, true)}</p>
              <p class="solution-equation">${tex(String.raw`(s - 1)(s - 2)X = \frac{1}{s - 3}`, true)}</p>
              ${tex('s \\neq 1')}、${tex('s \\neq 2')}、${tex('s \\neq 3')} として両辺を割ります。
              <p class="solution-equation">${tex(String.raw`X(s) = \frac{1}{(s - 1)(s - 2)(s - 3)}`, true)}</p>
            </li>
            <li>部分分数に分けます。
              <p class="solution-equation">${tex(String.raw`\frac{1}{(s - 1)(s - 2)(s - 3)} = \frac{A}{s - 1} + \frac{B}{s - 2} + \frac{C}{s - 3}`, true)}</p>
              両辺に分母を掛けます。
              <p class="solution-equation">${tex(String.raw`A(s - 2)(s - 3) + B(s - 1)(s - 3) + C(s - 1)(s - 2) = 1`, true)}</p>
              ${tex('s = 1')} を代入します。
              <p class="solution-equation">${tex(String.raw`A(1 - 2)(1 - 3) = A(-1)(-2) = 2A = 1`, true)}</p>
              したがって ${tex('A = 1/2')} です。${tex('s = 2')} を代入します。
              <p class="solution-equation">${tex(String.raw`B(2 - 1)(2 - 3) = B(1)(-1) = -B = 1`, true)}</p>
              したがって ${tex('B = -1')} です。${tex('s = 3')} を代入します。
              <p class="solution-equation">${tex(String.raw`C(3 - 1)(3 - 2) = C(2)(1) = 2C = 1`, true)}</p>
              したがって ${tex('C = 1/2')} です。各係数を戻すと
              <p class="solution-equation">${tex(String.raw`X(s) = \frac{1/2}{s - 1} - \frac{1}{s - 2} + \frac{1/2}{s - 3}`, true)}</p>
              です。
            </li>
            <li>書き出した逆変換を項ごとに使います。
              <p class="solution-equation">${tex(String.raw`x(t) = \frac{1}{2} e^{t} - e^{2t} + \frac{1}{2} e^{3t}`, true)}</p>
              これは未定係数法で得た式と同じです。変換は別の道で、同じ厳密解に着きます。
            </li>
            <li>記号を定めます。${tex('x(t)')} は時刻 ${tex('t')} の位置、${tex('t')} は時刻、${tex('s')} は変換の変数、${tex('X(s)')} は ${tex('x')} の Laplace 変換、${tex('A')}、${tex('B')}、${tex('C')} は部分分数の係数、${tex('a')} は指数関数の係数、${tex('e')} は自然対数の底、${tex('\\mathcal{L}')} は Laplace 変換、${tex('\\mathcal{L}^{-1}')} はその逆変換です。
            </li>
            <li>この式は厳密解です。変換、代数、逆変換のどこにも級数の打ち切りも時間の刻みもありません。初期条件と方程式を満たすことは、未定係数法のページと同じ微分で確かめられます。ここでも一度だけ微分を書きます。計算の説明は ${coreStepDoc('laplace_ivp', '厳密解の説明')} です。
            </li>
          </ol>
        </div>
      </section>
      ${pageFigure('laplace', 'X(s) = 1/((s−1)(s−2)(s−3)) の三つの実極が、逆変換 x = ½e^t − e^(2t) + ½e^(3t) の指数を決める。')}
      ${steppedFigure(false, 'laplace')}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">数を代入した検算</h2>
          <ol class="solution">
            <li>${tex('t = 0')} では
              <p class="solution-equation">${tex(String.raw`x(0) = \frac{1}{2} - 1 + \frac{1}{2} = 0`, true)}</p>
              <p class="solution-equation">${tex(String.raw`x'(t) = \frac{1}{2}e^{t} - 2e^{2t} + \frac{3}{2}e^{3t},\qquad x'(0) = 0`, true)}</p>
              初期条件と一致します。
            </li>
            <li>左辺を計算すると、${tex('e^{t}')} と ${tex('e^{2t}')} の係数は消え、
              <p class="solution-equation">${tex(String.raw`x'' - 3x' + 2x = e^{3t}`, true)}</p>
              です。与えられた方程式と一致します。この一致は式のままの一致です。
            </li>
          </ol>
        </div>
      </section>
      ${relatedPages([
        { href: './undetermined.html', title: '未定係数法' },
        { href: './second-order.html', title: '定数係数の2階同次' },
        { href: './euler.html', title: 'Euler法' },
        { href: './rk4.html', title: '古典的RK4' },
      ])}
      ${pageFooter('Laplace 変換は、初期値問題を s の代数に変え、逆変換で厳密解へ戻します。')}
      ${checkedProofs([{ statement: `初期値問題 ${tex(String.raw`x'' - 3x' + 2x = e^{3t}`)}、${tex('x(0) = 0')}、${tex("x'(0) = 0")} の解は、逆 Laplace 変換で時刻の関数に戻したものです。`, source: laplaceProof, moduleName: 'Ergion.Laplace', kind: '実数' }])}
    </main>
  </div>`;

mountSteppedFigure({
  config: { schema_version: 1, kind: 'laplace', t0: 0, dt: 0.015625, steps: 64 },
  label: 'Laplace 変換の例の厳密解',
});
