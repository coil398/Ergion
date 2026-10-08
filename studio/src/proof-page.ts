import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import { moduleHref } from './proof';
import { tex } from './tex';

const proofs: { statement: string; moduleName: string; href: string; label: string; kind: string }[] = [
  {
    statement: `速度が一定のとき、1ステップは ${tex(String.raw`x \mapsto x + v \Delta t`)} であり、${tex('n')} 回の後は ${tex(String.raw`x_n = x_0 + n v \Delta t`)} です。`,
    moduleName: 'Ergion.ConstantVelocity',
    href: './velocity-step.html',
    label: '一定速度の増分',
    kind: '有理数',
  },
  {
    statement: `加速度 ${tex('a')} が一定のとき、速度は ${tex('v(t) = v_0 + a t')}、位置は ${tex(String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`)} です。`,
    moduleName: 'Ergion.ConstantAcceleration',
    href: './accelerated.html',
    label: '等加速度直線運動',
    kind: '実数',
  },
  {
    statement: `関数 ${tex('x(t)')} が解であるとは、各時刻で ${tex(String.raw`\frac{d}{dt} x(t) = f(x(t), t)`)} が成り立つことです。`,
    moduleName: 'Ergion.Solution',
    href: './ode.html',
    label: '微分方程式',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x' = kx`)} の厳密解は ${tex(String.raw`x(t) = x_0 e^{kt}`)} です。`,
    moduleName: 'Ergion.Separation',
    href: './separation.html',
    label: '変数分離',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x' + px = q`)} で ${tex('p')} が 0 でないとき、厳密解は ${tex(String.raw`x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}`)} です。`,
    moduleName: 'Ergion.FirstOrderLinear',
    href: './linear.html',
    label: '1階線形',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x' = 1 + \frac{x}{t}`)} の、${tex('t > 0')} における厳密解は ${tex(String.raw`x(t) = t(\ln t + C)`)} です。`,
    moduleName: 'Ergion.Homogeneous',
    href: './homogeneous.html',
    label: '同次形',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`(2x + y)\,dx + (x + 2y)\,dy = 0`)} の陰関数の厳密解は ${tex(String.raw`x^2 + xy + y^2 = C`)} です。`,
    moduleName: 'Ergion.Exact',
    href: './exact.html',
    label: '完全微分',
    kind: '実数',
  },
  {
    statement: `${tex('n')} が 0 でも 1 でもないとき、${tex(String.raw`u = x^{1-n}`)} と置くと ${tex(String.raw`x' + px = q x^{n}`)} は1階線形になります。`,
    moduleName: 'Ergion.Bernoulli',
    href: './bernoulli.html',
    label: 'ベルヌーイ',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x'' + b x' + c x = 0`)} の一般解は、特性根が相異なる実数、重根、複素数のどれかで書けます。`,
    moduleName: 'Ergion.SecondOrder',
    href: './second-order.html',
    label: '定数係数の2階同次',
    kind: '実数',
  },
  {
    statement: `右辺が ${tex(String.raw`e^{3t}`)} のとき、特殊解を ${tex(String.raw`x_p = K e^{3t}`)} と仮定して ${tex(String.raw`x'' - 3x' + 2x = e^{3t}`)} を解きます。`,
    moduleName: 'Ergion.Undetermined',
    href: './undetermined.html',
    label: '未定係数法',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x'' + x = \tan t`)} は、同次解の定数を時刻の関数にして解きます。`,
    moduleName: 'Ergion.Variation',
    href: './variation.html',
    label: '定数変化法',
    kind: '実数',
  },
  {
    statement: `初期値問題 ${tex(String.raw`x'' - 3x' + 2x = e^{3t}`)}、${tex('x(0) = 0')}、${tex("x'(0) = 0")} の解は、逆 Laplace 変換で時刻の関数に戻したものです。`,
    moduleName: 'Ergion.Laplace',
    href: './laplace.html',
    label: 'Laplace 変換',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x'' + x = 0`)} のべき級数は、係数の漸化式 ${tex(String.raw`a_{m+2} = -\frac{a_m}{(m+1)(m+2)}`)} を満たし、和は ${tex(String.raw`\cos t`)} です。`,
    moduleName: 'Ergion.PowerSeries',
    href: './series.html',
    label: 'べき級数',
    kind: '実数',
  },
  {
    statement: `${tex(String.raw`x' = x + y`)} と ${tex(String.raw`y' = 4x + y`)} の解は、相異なる実固有値ごとの指数関数と固有ベクトルの積の和です。`,
    moduleName: 'Ergion.LinearSystem',
    href: './system.html',
    label: '連立1階',
    kind: '実数',
  },
];

const items = proofs.map((proof, index) => `
            <li>${proof.statement}${index === 0 ? `<p class="solution-equation">${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}</p>` : ''} これは${proof.kind}の上の等式です。証明の名前は <a class="doc-link" href="${moduleHref(proof.moduleName)}">${proof.moduleName}</a> です。式と証明の文章は <a class="doc-link" href="${proof.href}">${proof.label}</a> に置いてあります。</li>`).join('');

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('説明')}
  <div class="workspace">
    ${rail('proof')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb">証明 <span>/</span> 証明の一覧</p>
          <h1>証明の一覧<span class="title-dot">.</span></h1>
          <p class="description">この画面は証明を実行しません。確かめは、ページを公開する前に lake build で検査することです。検査が失敗すると、ページの公開は止まります。</p>
        </div>
        <div class="equation" aria-label="一定速度の n ステップ。位置は出発点に n v Δt を足す">
          ${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">確かめた等式</h2><span class="quiet-label">公開の前</span></div>
        <div class="study-body">
          <ol class="solution">
            ${items}
          </ol>
        </div>
      </section>
      ${pageFooter('証明の検査は公開前の lake build であり、この画面は Lean を実行しません。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
