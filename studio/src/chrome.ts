import { themeControl } from './theme';

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
  | 'rk4'
  | 'newton'
  | 'velocity-step'
  | 'proof';

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
    <span class="status" id="status" role="status"><i></i><span>${status}</span></span>
    ${themeControl()}
  </header>`;
}

function pageLink(active: PageId, id: PageId, href: string, label: string): string {
  const current = active === id;
  return `<li><a class="rail-page${current ? ' active' : ''}" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
}

const mechanicsPages = new Set<PageId>(['mechanics', 'derivative', 'uniform', 'accelerated']);
const odePages = new Set<PageId>(['ode', 'integrate', 'separation', 'linear', 'homogeneous', 'exact', 'bernoulli', 'second-order', 'undetermined', 'variation', 'laplace', 'series', 'system']);
const numericalPages = new Set<PageId>(['velocity-step', 'euler', 'midpoint', 'rk4', 'newton']);
const proofPages = new Set<PageId>(['proof']);

function sectionDisclosure(id: string, label: string, open: boolean, current: boolean, pages: string): string {
  return `
      <div class="rail-section">
        <button type="button" class="rail-section-title${current ? ' active' : ''}" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${id}">${label}</button>
        <ul class="rail-pages" id="${id}"${open ? '' : ' hidden'}>
          ${pages}
        </ul>
      </div>`;
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button.rail-section-title');
  if (!(button instanceof HTMLButtonElement)) return;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
  if (panel) panel.hidden = !open;
});

/** 力学、微分方程式、数値計算、証明は、幅によらず開閉する節。いまのページの節だけが開いて始まる。 */
export function rail(active: PageId): string {
  return `
    <aside class="rail" aria-label="目次">
      ${sectionDisclosure('rail-mechanics', '力学', mechanicsPages.has(active), active === 'mechanics', `
          ${pageLink(active, 'derivative', './derivative.html', '位置の時間微分')}
          ${pageLink(active, 'uniform', './uniform.html', '等速直線運動')}
          ${pageLink(active, 'accelerated', './accelerated.html', '等加速度直線運動')}
      `)}
      ${sectionDisclosure('rail-ode', '微分方程式', odePages.has(active), active === 'ode', `
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
      `)}
      ${sectionDisclosure('rail-numerical', '数値計算', numericalPages.has(active), false, `
          ${pageLink(active, 'velocity-step', './velocity-step.html', '一定速度の増分')}
          ${pageLink(active, 'euler', './euler.html', 'Euler法')}
          ${pageLink(active, 'midpoint', './midpoint.html', '中点法')}
          ${pageLink(active, 'rk4', './rk4.html', '古典的RK4')}
          ${pageLink(active, 'newton', './newton.html', 'ニュートン法')}
      `)}
      ${sectionDisclosure('rail-proof', '証明', proofPages.has(active), active === 'proof', `
          ${pageLink(active, 'proof', './proof.html', '証明の一覧')}
      `)}
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>`;
}

export function pageFooter(note: string): string {
  return `<footer class="page-footer"><span>Ergion</span><span>${note}</span></footer>`;
}

export interface RelatedLink {
  href: string;
  title: string;
  description: string;
}

export function relatedPages(links: RelatedLink[]): string {
  const items = links
    .map(link => `<li><a class="doc-link" href="${link.href}">${link.title}</a>: ${link.description}</li>`)
    .join('');
  return `
      <section class="study panel" id="related" aria-labelledby="related-heading">
        <div class="panel-heading"><h2 id="related-heading">関連ページ</h2><span class="quiet-label">つながり</span></div>
        <div class="study-body">
          <ul class="solution">
            ${items}
          </ul>
        </div>
      </section>`;
}

