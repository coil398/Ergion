import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('説明')}
  <div class="workspace">
    ${rail('proof')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb">証明 <span>/</span> 有理数での確かめ</p>
          <h1>有理数での確かめ<span class="title-dot">.</span></h1>
          <p class="description">この画面は証明を実行しません。確かめは、ページを公開する前に、有理数の等式を lake build で検査することです。</p>
        </div>
        <div class="equation" aria-label="一定速度の n ステップ。位置は出発点に n v Δt を足す">
          ${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}
          <span class="equation-note">有理数の上で厳密</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">何を検査するか</h2><span class="quiet-label">公開の前</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>速度 ${tex('v')} が一定のとき、方程式は ${tex(String.raw`x' = v`)} です。1ステップは ${tex(String.raw`x \mapsto x + v \Delta t`)} であり、同じ刻みを ${tex('n')} 回繰り返すと次の位置になります。
              <p class="solution-equation">${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}</p>
            </li>
            <li>位置、速度、時間刻みは有理数で、回数 ${tex('n')} は 0 以上の整数です。この等式の検査は lake build です。検査が失敗すると、ページの公開は止まります。</li>
            <li>この画面の中では Lean を動かしていません。表示は、検査される文章を読むためのものです。粒子を進める計算が使う倍精度の f64 の丸めは、証明していません。</li>
          </ol>
          <p>証明の名前は <a class="doc-link" href="https://github.com/coil398/Ergion/blob/main/formal/lean/Ergion/ConstantVelocity.lean">Ergion.ConstantVelocity</a> です。式と証明の文章は <a class="doc-link" href="./velocity-step.html">一定速度の増分</a> に置いてあります。</p>
        </div>
      </section>
      ${pageFooter('証明の検査は公開前の lake build であり、この画面は Lean を実行しません。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
