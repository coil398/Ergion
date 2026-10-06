export type PageId = 'mechanics' | 'uniform' | 'accelerated';

const pages: { id: PageId; href: string; label: string }[] = [
  { id: 'mechanics', href: './', label: '力学' },
  { id: 'uniform', href: './uniform.html', label: '等速直線運動' },
  { id: 'accelerated', href: './accelerated.html', label: '等加速度直線運動' },
];

export function appHeader(status: string): string {
  return `
  <header class="app-header">
    <a class="brand" href="./" aria-label="Ergion Studio ホーム"><span class="brand-mark" aria-hidden="true">e</span><span>Ergion <span class="brand-sub">Studio</span></span></a>
    <span class="header-caption">数値を、動かして確かめる。</span>
    <span class="status" id="status" role="status"><i></i><span>${status}</span></span>
  </header>`;
}

export function rail(active: PageId): string {
  const items = pages.map(page => {
    const current = page.id === active;
    return `<a class="rail-item${current ? ' active' : ''}" href="${page.href}"${current ? ' aria-current="page"' : ''}><span aria-hidden="true">→</span> ${page.label}</a>`;
  }).join('');
  return `
    <aside class="rail" aria-label="実験ナビゲーション">
      <span class="rail-heading">力学</span>
      ${items}
      <div class="rail-note"><span class="orbit-icon" aria-hidden="true">◎</span><p>小さな系から、<br>確かな計算へ。</p><span>直線上の一粒子</span></div>
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>`;
}

export function pageFooter(note: string): string {
  return `<footer class="page-footer"><span>Ergion / 計算と学習</span><span>${note}</span></footer>`;
}
