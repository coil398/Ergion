import './style.css';
import { appHeader, pageFooter, rail, relatedPages } from './chrome';
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
          <p class="breadcrumb">力学</p>
          <h1>力学</h1>
          <p class="description">直線上の一つの粒子の運動から始め、一定の力、ばねの復元力、速度に比例する抵抗、周期的な外力を順に加え、最後に平面上で引き合う2体の運動を扱います。</p>
        </div>
      </section>
      <div class="chapter-list">
        <a class="chapter" href="./derivative.html">
          <h2>位置の時間微分</h2>
          <p>位置の時間微分は速度です。1ステップのあいだ速度が一定ならば、位置はその速度と時間刻みの積だけ進みます。</p>
          <p class="equation">${tex(String.raw`x' = v`, true)}</p>
        </a>
        <a class="chapter" href="./uniform.html">
          <h2>等速直線運動</h2>
          <p>外力が働かず、加速度がゼロの運動です。速度 ${tex('v')} は時間によらず一定で、時刻 ${tex('t')} の位置は初期位置 ${tex('x_0')} を用いて次の式で表されます。</p>
          <p class="equation">${tex('x(t) = x_0 + v t', true)}</p>
        </a>
        <a class="chapter" href="./accelerated.html">
          <h2>等加速度直線運動</h2>
          <p>加速度 ${tex('a')} が、時刻にも位置にもよらず一定の運動です。速度は初期速度 ${tex('v_0')} から一定の割合で変わり、位置は初期位置 ${tex('x_0')} を用いて次の式で表されます。</p>
          <p class="equation">${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`, true)}</p>
          <p class="equation equation-follow">${tex('v(t) = v_0 + a t', true)}</p>
        </a>
        <a class="chapter" href="./constant-force.html">
          <h2>運動方程式と一定の力</h2>
          <p>質量 ${tex('m')} の質点に一定の力 ${tex('F')} が働くとき、加速度は ${tex('F/m')} で一定です。運動方程式から、速度と位置の厳密解が決まります。</p>
          <p class="equation">${tex(String.raw`m x'' = F`, true)}</p>
        </a>
        <a class="chapter" href="./harmonic.html">
          <h2>単振動</h2>
          <p>変位に比例する復元力だけを受ける質点は、固有角振動数 ${tex(String.raw`\omega = \sqrt{k/m}`)} で往復します。特性方程式から厳密解が決まり、力学的エネルギーは一定です。</p>
          <p class="equation">${tex(String.raw`m x'' = -k x`, true)}</p>
        </a>
        <a class="chapter" href="./damped.html">
          <h2>減衰振動</h2>
          <p>速度に比例する抵抗 ${tex(String.raw`-\gamma x'`)} が加わると、振れ幅は指数関数的に小さくなります。減衰には三つの場合があり、エネルギーは散逸します。</p>
          <p class="equation">${tex(String.raw`m x'' + \gamma x' + k x = 0`, true)}</p>
        </a>
        <a class="chapter" href="./forced.html">
          <h2>強制振動と共鳴</h2>
          <p>周期的な外力を加えると、十分時間がたった後の振動は外力と同じ角振動数になります。定常振幅と位相の遅れは、外力の角振動数に対する共鳴曲線を定めます。</p>
          <p class="equation">${tex(String.raw`m x'' + \gamma x' + k x = F_0 \cos\omega t`, true)}</p>
        </a>
        <a class="chapter" href="./two-body.html">
          <h2>中心力場と2体問題</h2>
          <p>互いに逆2乗の引力を及ぼし合う2質点は、重心と相対位置に分けて解けます。相対運動の軌道は円錐曲線で、面積速度は一定です。</p>
          <p class="equation">${tex(String.raw`\mu \mathbf{r}'' = -\frac{G m_1 m_2}{r^2}\hat{\mathbf{r}}`, true)}</p>
        </a>
      </div>
      ${relatedPages([
        { href: './velocity-step.html', title: '一定速度の増分' },
        { href: './integrate.html', title: '積分して解く' },
        { href: './euler.html', title: 'Euler法' },
        { href: './ode.html', title: '微分方程式' },
      ])}
      ${pageFooter('')}
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
