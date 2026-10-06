import './style.css';
import { appHeader, pageFooter, rail } from './chrome';

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
          <p class="description">Ergion のページは、ここから始まります。最初の部分は古典力学で、直線上の一つの粒子を扱います。いまページにしてあるのは、次の二つの運動です。これより後の部分は、まだページにしていません。</p>
        </div>
      </section>
      <div class="chapter-list">
        <a class="chapter" href="./uniform.html">
          <h2>等速直線運動</h2>
          <p>外力が働かず、加速度がゼロの運動です。速度 <span class="math">v</span> は時間によらず一定で、時刻 <span class="math">t</span> の位置は初期位置 <span class="math">x₀</span> を用いて次の式で表されます。ページでは、加速度がゼロであることからこの式へ至る手順と、一定の速度で進む粒子を見ます。</p>
          <p class="equation"><span class="math-x">x</span>(<span class="math-x">t</span>) = <span class="math-x">x₀</span> + <span class="math-x">v</span><span class="math-x">t</span></p>
        </a>
        <a class="chapter" href="./accelerated.html">
          <h2>等加速度直線運動</h2>
          <p>加速度 <span class="math">a</span> が、時刻にも位置にもよらず一定の運動です。速度は初期速度 <span class="math">v₀</span> から一定の割合で変わり、位置は初期位置 <span class="math">x₀</span> を用いて次の式で表されます。ページでは、一定の加速度からこの式へ至る手順と、速度が一定の割合で変わる様子を見ます。</p>
          <p class="equation"><span class="math-x">x</span>(<span class="math-x">t</span>) = <span class="math-x">x₀</span> + <span class="math-x">v₀</span><span class="math-x">t</span> + <span class="math-x">½</span><span class="math-x">a</span><span class="math-x">t²</span></p>
          <p class="equation equation-follow"><span class="math-x">v</span>(<span class="math-x">t</span>) = <span class="math-x">v₀</span> + <span class="math-x">a</span><span class="math-x">t</span></p>
        </a>
      </div>
      ${pageFooter('最初の部分は古典力学です。ページにしてあるのは、等速直線運動と等加速度直線運動です。これより後の部分は、まだページにしていません。')}
    </main>
  </div>`;

document.querySelector('#status')!.setAttribute('data-phase', 'ready');
