import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import constantVelocityProof from '../../formal/lean/Ergion/ConstantVelocity.lean?raw';
import constantAccelerationProof from '../../formal/lean/Ergion/ConstantAcceleration.lean?raw';
import { checkedProofs } from './proof';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('目次')}
  <div class="workspace">
    ${rail('mechanics')}
    <main id="contents">
      <section class="intro">
        <div>
          <p class="breadcrumb">実験室 <span>/</span> 力学</p>
          <h1>力学<span class="title-dot">.</span></h1>
          <p class="description">力学では、直線上の一つの粒子を扱います。位置の時間微分と、それを使う二つの運動を置いてあります。方程式を解く手順は<a href="./ode.html">微分方程式</a>の節、数値の進め方は数値計算の節に置いてあります。</p>
        </div>
      </section>
      <div class="chapter-list">
        <a class="chapter" href="./derivative.html">
          <h2>位置の時間微分</h2>
          <p>位置の時間微分は速度です。1ステップのあいだ速度が一定ならば、位置はその速度と時間刻みの積だけ進みます。ページでは、この式へ至る手順と、1ステップずつ進む粒子を見ます。</p>
          <p class="equation">${tex(String.raw`x' = v`, true)}</p>
        </a>
        <a class="chapter" href="./uniform.html">
          <h2>等速直線運動</h2>
          <p>外力が働かず、加速度がゼロの運動です。速度 ${tex('v')} は時間によらず一定で、時刻 ${tex('t')} の位置は初期位置 ${tex('x_0')} を用いて次の式で表されます。ページでは、加速度がゼロであることからこの式へ至る手順と、一定の速度で進む粒子を見ます。</p>
          <p class="equation">${tex('x(t) = x_0 + v t', true)}</p>
        </a>
        <a class="chapter" href="./accelerated.html">
          <h2>等加速度直線運動</h2>
          <p>加速度 ${tex('a')} が、時刻にも位置にもよらず一定の運動です。速度は初期速度 ${tex('v_0')} から一定の割合で変わり、位置は初期位置 ${tex('x_0')} を用いて次の式で表されます。ページでは、一定の加速度からこの式へ至る手順と、速度が一定の割合で変わる様子を見ます。</p>
          <p class="equation">${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`, true)}</p>
          <p class="equation equation-follow">${tex('v(t) = v_0 + a t', true)}</p>
        </a>
      </div>
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
      ${pageFooter('力学のページは、位置の時間微分、等速直線運動、等加速度直線運動です。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
