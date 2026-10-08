import './style.css';
import { pageFigure } from './page-figure';
import { appHeader, pageFooter, rail, relatedPages } from './chrome';
import constantVelocityProof from '../../formal/lean/Ergion/ConstantVelocity.lean?raw';
import constantAccelerationProof from '../../formal/lean/Ergion/ConstantAcceleration.lean?raw';
import { checkedProofs } from './proof';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('説明')}
  <div class="workspace">
    ${rail('integrate')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb"><a href="./ode.html">微分方程式</a> <span>/</span> 積分して解く</p>
          <h1>積分して解く<span class="title-dot">.</span></h1>
          <p class="description">右辺が未知関数 ${tex('x')} を含まないとき、両辺を時刻で積分して解きます。ここで得る式は、どれも厳密解です。</p>
        </div>
        <div class="equation" aria-label="右辺が時刻だけの微分方程式。x プライムは f(t)">
          ${tex(String.raw`x' = f(t)`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">積分の手順</h2></div>
        <div class="study-body">
          <ol class="solution">
            <li>速度 ${tex('v')} が一定のとき、位置は ${tex(String.raw`x' = v`)} を満たします。時刻 0 から ${tex('t')} まで両辺を積分します。
              <p class="solution-equation">${tex(String.raw`\int_0^{t} x'(\tau)\,d\tau = \int_0^{t} v\,d\tau`, true)}</p>
              左辺は原始関数に上限と下限を代入した差です。
              <p class="solution-equation">${tex(String.raw`[x(\tau)]_0^{t} = x(t) - x(0)`, true)}</p>
              右辺は一定の速度を積分した値です。
              <p class="solution-equation">${tex(String.raw`v [\tau]_0^{t} = v(t - 0) = vt`, true)}</p>
              したがって次の等式が得られます。
              <p class="solution-equation">${tex('x(t) - x(0) = v t', true)}</p>
              初期位置を ${tex('x(0) = x_0')} と書き、移項すると、厳密解は次の式です。この運動は <a class="doc-link" href="./uniform.html">等速直線運動</a> です。
              <p class="solution-equation">${tex('x(t) = x_0 + v t', true)}</p>
            </li>
            <li>加速度 ${tex('a')} が一定のとき、速度は ${tex(String.raw`v' = a`)} を満たします。同じように時刻 0 から ${tex('t')} まで積分します。
              <p class="solution-equation">${tex(String.raw`\int_0^{t} v'(\tau)\,d\tau = \int_0^{t} a\,d\tau`, true)}</p>
              原始関数を評価します。
              <p class="solution-equation">${tex(String.raw`[v(\tau)]_0^{t} = v(t) - v(0)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`a [\tau]_0^{t} = at`, true)}</p>
              したがって
              <p class="solution-equation">${tex('v(t) - v(0) = a t', true)}</p>
              初期速度を ${tex('v(0) = v_0')} と書き、移項すると、速度の厳密解は次の式です。
              <p class="solution-equation">${tex('v(t) = v_0 + a t', true)}</p>
            </li>
            <li>位置の時間微分は、いま求めた速度です。${tex(String.raw`x' = v_0 + a t`)} を、再び時刻 0 から ${tex('t')} まで積分します。
              <p class="solution-equation">${tex(String.raw`\int_0^{t} x'(\tau)\,d\tau = \int_0^{t} (v_0 + a \tau)\,d\tau`, true)}</p>
              各項の原始関数を評価します。
              <p class="solution-equation">${tex(String.raw`[x(\tau)]_0^{t} = x(t) - x(0)`, true)}</p>
              <p class="solution-equation">${tex(String.raw`\left[v_0 \tau + \frac{1}{2} a \tau^{2}\right]_0^{t} = v_0 t + \frac{1}{2} a t^{2}`, true)}</p>
              したがって
              <p class="solution-equation">${tex(String.raw`x(t) - x(0) = v_0 t + \frac{1}{2} a t^2`, true)}</p>
              初期位置を ${tex('x(0) = x_0')} と書き、移項すると、位置の厳密解は次の式です。この運動は <a class="doc-link" href="./accelerated.html">等加速度直線運動</a> です。
              <p class="solution-equation">${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`, true)}</p>
            </li>
          </ol>
          <p>これらの式は、右辺を積分して得た厳密解です。数値の1ステップは、<a class="doc-link" href="./derivative.html">位置の時間微分</a>で見ます。</p>
        </div>
      </section>
      ${pageFigure('integrate', '右辺が未知関数を含まないとき、解は右辺を時刻で積分した値だけ増える。')}
      ${relatedPages([
        { href: './fundamental-theorem.html', title: '定積分と微分積分学の基本定理', description: '原始関数の差で定積分が求まる理由を示すページです。' },
        { href: './uniform.html', title: '等速直線運動', description: '速度が一定の方程式 x\' = v を積分して位置を求める例です。' },
        { href: './accelerated.html', title: '等加速度直線運動', description: '加速度 a を二度積分して速度と位置を求める例です。' },
        { href: './separation.html', title: '変数分離', description: '右辺が未知関数を含む場合に割ってから積分する解法です。' },
        { href: './euler.html', title: 'Euler法', description: '積分を時間刻みの積で逐次近似する数値解法です。' },
      ])}
      ${pageFooter('右辺が未知関数によらないとき、積分で得る位置と速度は厳密解です。')}
      ${checkedProofs([
        {
          statement: `速度が一定のとき、${tex('n')} 回の後は ${tex(String.raw`x_n = x_0 + n v \Delta t`)} です。時刻を ${tex(String.raw`t = n \Delta t`)} と置けば、これは ${tex('x(t) = x_0 + v t')} と同じ増分です。`,
          source: constantVelocityProof,
          moduleName: 'Ergion.ConstantVelocity',
          kind: '有理数',
        },
        {
          statement: `加速度 ${tex('a')} が一定のとき、速度は ${tex('v(t) = v_0 + a t')}、位置は ${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`)} です。`,
          source: constantAccelerationProof,
          moduleName: 'Ergion.ConstantAcceleration',
          kind: '実数',
        },
      ])}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
