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
          <p>右辺が未知関数を含まないときの積分から、変数分離、1階線形、同次形、完全微分、ベルヌーイ、定数係数の2階、未定係数法、定数変化法、Laplace 変換、べき級数、連立1階、一定の速度での1ステップ、Euler 法、中点法、古典的な4次の Runge–Kutta 法、そして方程式の根を接線で求めるニュートン法まで、この節のページで順に見ます。ニュートン法は、微分方程式を時刻で進める方法ではありません。</p>
        </div>
      </section>
      <div class="chapter-list">
        <a class="chapter" href="./integrate.html">
          <h2>積分して解く</h2>
          <p>右辺が未知関数 ${tex('x')} によらないとき、両辺を時刻で積分します。得られる式は厳密解です。</p>
          <p class="equation">${tex('x(t) = x_0 + v t', true)}</p>
        </a>
        <a class="chapter" href="./separation.html">
          <h2>変数分離</h2>
          <p>右辺が位置に比例するとき、${tex('x \\neq 0')} として変数を分けて積分します。得られる式は厳密解です。</p>
          <p class="equation">${tex(String.raw`x(t) = x_0 e^{kt}`, true)}</p>
        </a>
        <a class="chapter" href="./linear.html">
          <h2>1階線形</h2>
          <p>係数が定数で ${tex('p \\neq 0')} のとき、積分因子 ${tex('e^{pt}')} を掛けて積分します。得られる式は厳密解です。</p>
          <p class="equation">${tex(String.raw`x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}`, true)}</p>
        </a>
        <a class="chapter" href="./homogeneous.html">
          <h2>同次形</h2>
          <p>右辺が ${tex('x/t')} だけのとき、${tex('u = x/t')} と置いて変数分離に戻します。得られる式は厳密解です。</p>
          <p class="equation">${tex(String.raw`x(t) = t(\ln t + C)`, true)}</p>
        </a>
        <a class="chapter" href="./exact.html">
          <h2>完全微分</h2>
          <p>${tex('\\partial M/\\partial y = \\partial N/\\partial x')} のとき、ポテンシャルが一定という陰関数が厳密解です。</p>
          <p class="equation">${tex(String.raw`x^2 + xy + y^2 = C`, true)}</p>
        </a>
        <a class="chapter" href="./bernoulli.html">
          <h2>ベルヌーイ</h2>
          <p>${tex('n \\neq 0, 1')} のとき、${tex('u = x^{1-n}')} と置いて1階線形に戻します。得られる式は厳密解です。</p>
          <p class="equation">${tex(String.raw`x' + px = q x^{n}`, true)}</p>
        </a>
        <a class="chapter" href="./second-order.html">
          <h2>定数係数の2階同次</h2>
          <p>特性方程式の根が、相異なる実数、重根、複素数のどれかで、一般解が厳密に決まります。</p>
          <p class="equation">${tex(String.raw`x'' + b x' + c x = 0`, true)}</p>
        </a>
        <a class="chapter" href="./undetermined.html">
          <h2>未定係数法</h2>
          <p>右辺が指数関数のとき、同じ形の特殊解を仮定して係数を決めます。得られる式は厳密解です。</p>
          <p class="equation">${tex(String.raw`x_p = K e^{3t}`, true)}</p>
        </a>
        <a class="chapter" href="./variation.html">
          <h2>定数変化法</h2>
          <p>右辺が ${tex('\\tan t')} のとき、同次解の定数を時刻の関数にして厳密解を作ります。</p>
          <p class="equation">${tex(String.raw`x'' + x = \tan t`, true)}</p>
        </a>
        <a class="chapter" href="./laplace.html">
          <h2>Laplace 変換</h2>
          <p>初期値問題を ${tex('s')} の代数方程式にし、逆変換で時刻の厳密解へ戻します。</p>
          <p class="equation">${tex(String.raw`X(s) = \frac{1}{(s-1)(s-2)(s-3)}`, true)}</p>
        </a>
        <a class="chapter" href="./series.html">
          <h2>べき級数</h2>
          <p>通常点で解をべき級数と仮定し、漸化式から係数を決めます。この例の和は厳密解です。</p>
          <p class="equation">${tex(String.raw`a_{m+2} = -\frac{a_m}{(m+1)(m+2)}`, true)}</p>
        </a>
        <a class="chapter" href="./system.html">
          <h2>連立1階</h2>
          <p>定数係数の2元連立を、固有値と固有ベクトルで厳密に解きます。</p>
          <p class="equation">${tex(String.raw`x' = x + y`, true)}</p>
        </a>
        <a class="chapter" href="./derivative.html">
          <h2>位置の時間微分</h2>
          <p>速度が一定のあいだ、位置は1ステップごとに ${tex(String.raw`v \Delta t`)} だけ進みます。この増分は厳密です。</p>
          <p class="equation">${tex(String.raw`x' = v`, true)}</p>
        </a>
        <a class="chapter" href="./euler.html">
          <h2>Euler法</h2>
          <p>右辺を区間の始点で一定とみなして1ステップ進めます。速度が一定ならば、増分は ${tex(String.raw`v \Delta t`)} と一致します。</p>
          <p class="equation">${tex(String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`, true)}</p>
        </a>
        <a class="chapter" href="./midpoint.html">
          <h2>中点法</h2>
          <p>始点の傾きで中点まで仮に進み、中点の傾きで1ステップ進めます。速度が一定ならば、増分は ${tex(String.raw`v \Delta t`)} と一致します。</p>
          <p class="equation">${tex(String.raw`x_{n+1} = x_n + \Delta t \, k_2`, true)}</p>
        </a>
        <a class="chapter" href="./rk4.html">
          <h2>古典的な4次の Runge–Kutta 法</h2>
          <p>始点、中点、終点の四つの傾きを重み付きで足します。速度が一定ならば、増分は ${tex(String.raw`v \Delta t`)} と一致します。</p>
          <p class="equation">${tex(String.raw`x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)`, true)}</p>
        </a>
        <a class="chapter" href="./newton.html">
          <h2>ニュートン法</h2>
          <p>方程式 ${tex('f(x) = 0')} を、接線の零点で更新します。これは微分方程式の時間ステップではありません。</p>
          <p class="equation">${tex(String.raw`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`, true)}</p>
        </a>
      </div>
      ${pageFooter('この節は、1階の解法、2階の解法、Laplace 変換、べき級数、連立、数値の1ステップ、そして根を求めるニュートン法です。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
