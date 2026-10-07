export type PageId =
  | 'mechanics'
  | 'uniform'
  | 'accelerated'
  | 'derivative'
  | 'ode'
  | 'integrate'
  | 'separation'
  | 'linear'
  | 'homogeneous'
  | 'exact'
  | 'bernoulli'
  | 'second-order'
  | 'undetermined'
  | 'variation'
  | 'laplace'
  | 'series'
  | 'system'
  | 'euler'
  | 'midpoint'
  | 'rk4';

/** rustdoc へのリンク。見える文字は日本語とし、型名やソースのパスは文に出さない。 */
export function simulationDoc(module: 'uniform' | 'constant_acceleration', name: string, label: string): string {
  const href = `${import.meta.env.BASE_URL}doc/ergion_lab/${module}/struct.${name}.html`;
  return `<a class="doc-link" href="${href}">${label}</a>`;
}

/** コアの1ステップの説明へのリンク。見える文字は日本語だけにする。 */
export function coreStepDoc(fn: string, label: string): string {
  const href = `${import.meta.env.BASE_URL}doc/ergion_core/fn.${fn}.html`;
  return `<a class="doc-link" href="${href}">${label}</a>`;
}

/** \(x' = v\) の1ステップの説明へのリンク。見える文字は日本語だけにする。 */
export function stepDoc(label: string): string {
  return coreStepDoc('x_prime_eq_v_step', label);
}

export function appHeader(status: string): string {
  return `
  <header class="app-header">
    <a class="brand" href="./" aria-label="Ergion Studio ホーム"><span class="brand-mark" aria-hidden="true">e</span><span>Ergion <span class="brand-sub">Studio</span></span></a>
    <span class="header-caption">数値を、動かして確かめる。</span>
    <span class="status" id="status" role="status"><i></i><span>${status}</span></span>
  </header>`;
}

function pageLink(active: PageId, id: PageId, href: string, label: string): string {
  const current = active === id;
  return `<li><a class="rail-page${current ? ' active' : ''}" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
}

/** 力学と微分方程式は並ぶ節。各ページはその節の下に縦に置く。 */
export function rail(active: PageId): string {
  const mechanicsCurrent = active === 'mechanics' ? ' aria-current="page"' : '';
  const odeCurrent = active === 'ode' ? ' aria-current="page"' : '';
  return `
    <aside class="rail" aria-label="実験ナビゲーション">
      <span class="rail-heading">実験室</span>
      <div class="rail-section">
        <a class="rail-section-title${active === 'mechanics' ? ' active' : ''}" href="./"${mechanicsCurrent}>力学</a>
        <ul class="rail-pages">
          ${pageLink(active, 'derivative', './derivative.html', '位置の時間微分')}
          ${pageLink(active, 'uniform', './uniform.html', '等速直線運動')}
          ${pageLink(active, 'accelerated', './accelerated.html', '等加速度直線運動')}
        </ul>
      </div>
      <div class="rail-section">
        <a class="rail-section-title${active === 'ode' ? ' active' : ''}" href="./ode.html"${odeCurrent}>微分方程式</a>
        <ul class="rail-pages">
          ${pageLink(active, 'integrate', './integrate.html', '積分して解く')}
          ${pageLink(active, 'separation', './separation.html', '変数分離')}
          ${pageLink(active, 'linear', './linear.html', '1階線形')}
          ${pageLink(active, 'homogeneous', './homogeneous.html', '同次形')}
          ${pageLink(active, 'exact', './exact.html', '完全微分')}
          ${pageLink(active, 'bernoulli', './bernoulli.html', 'ベルヌーイ')}
          ${pageLink(active, 'second-order', './second-order.html', '定数係数の2階同次')}
          ${pageLink(active, 'undetermined', './undetermined.html', '未定係数法')}
          ${pageLink(active, 'variation', './variation.html', '定数変化法')}
          ${pageLink(active, 'laplace', './laplace.html', 'Laplace 変換')}
          ${pageLink(active, 'series', './series.html', 'べき級数')}
          ${pageLink(active, 'system', './system.html', '連立1階')}
          ${pageLink(active, 'derivative', './derivative.html', '位置の時間微分')}
          ${pageLink(active, 'euler', './euler.html', 'Euler法')}
          ${pageLink(active, 'midpoint', './midpoint.html', '中点法')}
          ${pageLink(active, 'rk4', './rk4.html', '古典的RK4')}
        </ul>
      </div>
      <div class="rail-note"><span class="orbit-icon" aria-hidden="true">◎</span><p>小さな系から、<br>確かな計算へ。</p><span>直線上の一粒子</span></div>
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>`;
}

export function pageFooter(note: string): string {
  return `<footer class="page-footer"><span>Ergion / 計算と学習</span><span>${note}</span></footer>`;
}
