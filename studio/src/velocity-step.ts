import './style.css';
import { appHeader, pageFooter, rail } from './chrome';
import { checkedVelocityProof } from './proof';
import { tex } from './tex';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  ${appHeader('説明')}
  <div class="workspace">
    ${rail('velocity-step')}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb">数値計算 <span>/</span> 一定速度の増分</p>
          <h1>一定速度の増分<span class="title-dot">.</span></h1>
          <p class="description">速度 ${tex('v')} が一定のとき、${tex(String.raw`x' = v`)} の1ステップは位置に ${tex(String.raw`v \Delta t`)} を足します。同じ刻みを ${tex('n')} 回繰り返すと、増分は ${tex(String.raw`n v \Delta t`)} です。この等式は有理数の上で厳密です。</p>
        </div>
        <div class="equation" aria-label="一定速度の1ステップ。位置は速度と時間刻みの積だけ進む">
          ${tex(String.raw`x \mapsto x + v \Delta t`, true)}
          <span class="equation-note">有理数の上で厳密</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">仮定と、証明したこと</h2><span class="quiet-label">有理数</span></div>
        <div class="study-body">
          <ol class="solution">
            <li>位置を ${tex('x')}、速度を ${tex('v')}、1ステップの時間刻みを ${tex(String.raw`\Delta t`)}、回数を ${tex('n')} とします。${tex('v')} はステップごとに変わりません。${tex('x')}、${tex('v')}、${tex(String.raw`\Delta t`)} は有理数で、${tex('n')} は 0 以上の整数です。方程式は ${tex(String.raw`x' = v`)} です。
              <p class="solution-equation">${tex(String.raw`x' = v`, true)}</p>
            </li>
            <li>1ステップは、今の位置に ${tex(String.raw`v \Delta t`)} を足すことと定めます。証明したのは、その結果が次の位置になることです。
              <p class="solution-equation">${tex(String.raw`x \mapsto x + v \Delta t`, true)}</p>
            </li>
            <li>同じステップを ${tex('n')} 回繰り返すと、位置は出発点 ${tex('x_0')} から ${tex(String.raw`n v \Delta t`)} だけ進みます。${tex('n = 0')} のときは、位置は ${tex('x_0')} のままです。
              <p class="solution-equation">${tex(String.raw`x_n = x_0 + n v \Delta t`, true)}</p>
            </li>
          </ol>
          <p>この証明は有理数の等式です。丸めは入っていません。画面で粒子を進める計算は <a class="doc-link" href="./derivative.html">位置の時間微分</a> にあり、数は倍精度の f64 です。有理数の等式は、その丸めを証明していません。証明は <a class="doc-link" href="https://github.com/coil398/Ergion/blob/main/formal/lean/Ergion/ConstantVelocity.lean">Ergion.ConstantVelocity</a> にあります。</p>
        </div>
      </section>
      ${checkedVelocityProof(`1ステップは ${tex(String.raw`x \mapsto x + v \Delta t`)} であり、${tex('n')} 回の後は ${tex(String.raw`x_n = x_0 + n v \Delta t`)} です。`)}
      ${pageFooter('一定速度の増分は、有理数の上で x + n v Δt です。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
