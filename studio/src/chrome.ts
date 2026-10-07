export type PageId = 'mechanics' | 'uniform' | 'accelerated';

/** rustdoc へのリンク。見える文字は日本語とし、型名やソースのパスは文に出さない。 */
export function simulationDoc(module: 'uniform' | 'constant_acceleration', name: string, label: string): string {
  const href = `${import.meta.env.BASE_URL}doc/ergion_lab/${module}/struct.${name}.html`;
  return `<a class="doc-link" href="${href}">${label}</a>`;
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

/** 力学は節。二つの運動はその下のページであり、節と横並びにしない。 */
export function rail(active: PageId): string {
  const sectionCurrent = active === 'mechanics' ? ' aria-current="page"' : '';
  return `
    <aside class="rail" aria-label="実験ナビゲーション">
      <span class="rail-heading">実験室</span>
      <div class="rail-section">
        <a class="rail-section-title${active === 'mechanics' ? ' active' : ''}" href="./"${sectionCurrent}>力学</a>
        <ul class="rail-pages">
          ${pageLink(active, 'uniform', './uniform.html', '等速直線運動')}
          ${pageLink(active, 'accelerated', './accelerated.html', '等加速度直線運動')}
        </ul>
      </div>
      <div class="rail-note"><span class="orbit-icon" aria-hidden="true">◎</span><p>小さな系から、<br>確かな計算へ。</p><span>直線上の一粒子</span></div>
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>`;
}

export function pageFooter(note: string): string {
  return `<footer class="page-footer"><span>Ergion / 計算と学習</span><span>${note}</span></footer>`;
}
