import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('説明')}
  <div class="workspace">
    ${rail('ode')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb">実験室 <span>/</span> 微分方程式</p>
          <h1>微分方程式<span class="title-dot">.</span></h1>
          <p class="description">未知の関数と、その導関数との関係を、微分方程式と呼びます。ここでは独立変数を時刻 ${tex('t')}、未知関数を ${tex('x(t)')} とします。</p>
        </div>
        <div class="equation" aria-label="微分方程式。x プライムは f(x, t)">
          ${tex(String.raw`x' = f(x, t)`, true)}
          <span class="equation-note">一階の微分方程式</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">解とは何か</h2><span class="quiet-label">式を満たす関数</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>右辺 ${tex('f(x, t)')} は、位置 ${tex('x')} と時刻 ${tex('t')} から、その瞬間の変化率を決める関数です。</li>
            <li>関数 ${tex('x(t)')} をこの微分方程式の解と呼びます。解であるためには、各時刻で ${tex('x(t)')} を微分した値が、右辺にその関数と時刻を入れた値と一致しなければなりません。
              <p class="solution-equation">${tex(String.raw`\frac{d}{dt} x(t) = f(x(t), t)`, true)}</p>
            </li>
            <li>速度 ${tex('v')} が時刻にも位置にもよらず一定ならば、位置は ${tex(String.raw`x' = v`)} を満たします。この運動は <a class="doc-link" href="./uniform.html">等速直線運動</a> です。</li>
            <li>加速度 ${tex('a')} が一定ならば、速度は ${tex(String.raw`v' = a`)} を満たします。この運動は <a class="doc-link" href="./accelerated.html">等加速度直線運動</a> です。</li>
          </ol>
          <p>右辺が未知関数 ${tex('x')} を含まないときの積分、一定の速度での1ステップ、そして Euler 法の1ステップは、この節のページで順に見ます。</p>
        </div>
      </section>
      <div class="chapter-list">
        <a class="chapter" href="./integrate.html">
          <h2>積分して解く</h2>
          <p>右辺が未知関数 ${tex('x')} によらないとき、両辺を時刻で積分します。得られる式は厳密解です。</p>
          <p class="equation">${tex('x(t) = x_0 + v t', true)}</p>
        </a>
        <a class="chapter" href="./derivative.html">
          <h2>位置の時間微分</h2>
          <p>速度が一定のあいだ、位置は1ステップごとに ${tex(String.raw`v \Delta t`)} だけ進みます。この増分は厳密です。</p>
          <p class="equation">${tex(String.raw`x' = v`, true)}</p>
        </a>
        <a class="chapter" href="./euler.html">
          <h2>Euler法</h2>
          <p>右辺を区間の始点の値で一定とみなし、1ステップ進めます。速度が一定ならば、そのステップは厳密な増分と一致します。</p>
          <p class="equation">${tex(String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`, true)}</p>
        </a>
      </div>
      ${pageFooter('この節は、微分方程式の意味、積分による厳密解、そして数値の1ステップです。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
