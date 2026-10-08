import { themeControl } from './theme';

export type PageId = string;

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

/** ergion-core の科目のモジュールにある関数の説明へのリンク。見える文字は日本語だけにする。 */
export function coreDoc(module: string, fn: string, label: string): string {
  const href = `${import.meta.env.BASE_URL}doc/ergion_core/${module}/fn.${fn}.html`;
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

export interface RailSection {
  id: string;
  label: string;
  /** 節の目次のページ。ないときは、節の名前は開閉だけをする。 */
  index?: PageId;
  pages: [PageId, string][];
}

/** 節とページ。並びは学習の順である。 */
const allSections: RailSection[] = [
  { id: 'rail-mechanics', label: '力学', index: 'mechanics', pages: [
    ['derivative', '位置の時間微分'],
    ['uniform', '等速直線運動'],
    ['accelerated', '等加速度直線運動'],
    ['constant-force', '運動方程式と一定の力'],
    ['harmonic', '単振動'],
    ['damped', '減衰振動'],
    ['forced', '強制振動と共鳴'],
    ['two-body', '中心力場と2体問題'],
  ] },
  { id: 'rail-calculus', label: '微分積分', pages: [
    ['limits', '極限と連続'],
    ['derivative-definition', '微分の定義'],
    ['product-chain', '積の微分と合成関数の微分'],
    ['mean-value', '平均値の定理'],
    ['fundamental-theorem', '定積分と微分積分学の基本定理'],
    ['integration-techniques', '置換積分と部分積分'],
    ['taylor', 'Taylor 展開'],
    ['partial', '偏微分'],
    ['multiple-integral', '重積分'],
    ['numerical-differentiation', '数値微分'],
    ['numerical-integration', '数値積分'],
  ] },
  { id: 'rail-ode', label: '微分方程式', index: 'ode', pages: [
    ['integrate', '積分して解く'],
    ['separation', '変数分離'],
    ['linear', '1階線形'],
    ['homogeneous', '同次形'],
    ['exact', '完全微分'],
    ['bernoulli', 'ベルヌーイ'],
    ['second-order', '定数係数の2階同次'],
    ['undetermined', '未定係数法'],
    ['variation', '定数変化法'],
    ['laplace', 'Laplace 変換'],
    ['series', 'べき級数'],
    ['system', '連立1階'],
    ['sturm-liouville', 'Sturm–Liouville 問題'],
    ['chaos', '非線形力学系とカオス'],
    ['heat', '熱伝導方程式'],
    ['wave', '波動方程式'],
  ] },
  { id: 'rail-numerical', label: '数値計算', pages: [
    ['velocity-step', '一定速度の増分'],
    ['euler', 'Euler法'],
    ['midpoint', '中点法'],
    ['rk4', '古典的RK4'],
    ['newton', 'ニュートン法'],
  ] },
  { id: 'rail-proof', label: '証明', index: 'proof', pages: [
    ['proof', '証明の一覧'],
  ] },
  { id: 'rail-linalg', label: '線形代数', pages: [
    ['elimination', '連立1次方程式と消去法'],
    ['lu', 'LU 分解'],
    ['eigen', '固有値と固有ベクトル'],
    ['least-squares', '最小二乗法'],
  ] },
  { id: 'rail-statistics', label: '統計学', pages: [
    ['sample-stats', '標本・平均・分散'],
    ['limit-theorems', '大数の法則と中心極限定理'],
    ['regression', '線形回帰'],
    ['monte-carlo', 'Monte Carlo 法'],
    ['pca', '主成分分析'],
  ] },
  { id: 'rail-finance', label: '金融数学', pages: [
    ['compound', '連続複利と指数成長'],
    ['gbm', '幾何 Brownian 運動'],
    ['black-scholes', 'Black–Scholes 方程式'],
    ['mc-pricing', 'Monte Carlo 価格評価'],
  ] },
  { id: 'rail-em', label: '電磁気学', pages: [
    ['coulomb', 'Coulomb の法則と静電場'],
    ['potential', '静電ポテンシャルと電位'],
    ['gauss', 'Gauss の法則'],
    ['magnetostatics', '定常電流と静磁場'],
    ['lorentz', '磁場中の荷電粒子'],
    ['faraday', 'Faraday の電磁誘導の法則'],
    ['maxwell', 'Maxwell 方程式と電磁波'],
  ] },
  { id: 'rail-analytical', label: '解析力学', pages: [
    ['constraints', '拘束条件と一般化座標'],
    ['virtual-work', "仮想仕事の原理と d'Alembert の原理"],
    ['euler-lagrange', '最小作用の原理と Euler–Lagrange 方程式'],
    ['noether', '対称性と保存則'],
    ['hamilton', 'Legendre 変換と Hamilton の正準方程式'],
    ['liouville', '相空間と Liouville の定理'],
    ['poisson', '正準変換と Poisson 括弧'],
  ] },
  { id: 'rail-md', label: '分子動力学', pages: [
    ['lennard-jones', 'Lennard–Jones ポテンシャル'],
    ['periodic', '周期境界条件と最小イメージ法'],
    ['nve', 'NVE アンサンブルと速度 Verlet 法'],
    ['observables', '温度・圧力・動径分布関数'],
    ['nvt', 'NVT アンサンブルと熱浴法'],
    ['neighbor-list', '近接リスト法とセル分割法'],
    ['born-oppenheimer', 'Born–Oppenheimer 近似'],
    ['kohn-sham', '密度汎関数理論と Kohn–Sham 方程式'],
    ['hellmann-feynman', 'Hellmann–Feynman の定理'],
    ['first-principles', '第一原理分子動力学'],
  ] },
];

/** まだ公開しないページ。ビルドの環境変数 VITE_RAIL_ALL=1 のときだけ目次に出す。 */
const drafts = new Set<PageId>([
  'damped', 'forced', 'two-body', 'constant-force', 'harmonic',
  'limits', 'derivative-definition', 'product-chain', 'mean-value', 'fundamental-theorem', 'integration-techniques', 'taylor', 'partial', 'multiple-integral', 'numerical-differentiation', 'numerical-integration',
  'sturm-liouville', 'chaos', 'heat', 'wave',
  'elimination', 'lu', 'eigen', 'least-squares',
  'sample-stats', 'limit-theorems', 'regression', 'monte-carlo', 'pca',
  'compound', 'gbm', 'black-scholes', 'mc-pricing',
  'coulomb', 'potential', 'gauss', 'magnetostatics', 'lorentz', 'faraday', 'maxwell',
  'constraints', 'virtual-work', 'euler-lagrange', 'noether', 'hamilton', 'liouville', 'poisson',
  'lennard-jones', 'periodic', 'nve', 'observables', 'nvt', 'neighbor-list', 'born-oppenheimer', 'kohn-sham', 'hellmann-feynman', 'first-principles',
]);

const showDrafts = import.meta.env.VITE_RAIL_ALL === '1';

export const railSections: RailSection[] = allSections
  .map(section => ({ ...section, pages: section.pages.filter(([id]) => showDrafts || !drafts.has(id)) }))
  .filter(section => section.pages.length > 0);

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

/** 節は幅によらず開閉する。いまのページの節だけが開いて始まる。 */
export function rail(active: PageId): string {
  const sections = railSections.map(section => {
    const open = section.index === active || section.pages.some(([id]) => id === active);
    const links = section.pages.map(([id, label]) => pageLink(active, id, `./${id}.html`, label)).join('\n          ');
    return sectionDisclosure(section.id, section.label, open, section.index === active, links);
  }).join('');
  return `
    <aside class="rail" aria-label="目次">
      ${sections}
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
        <div class="panel-heading"><h2 id="related-heading">関連ページ</h2></div>
        <div class="study-body">
          <ul class="solution">
            ${items}
          </ul>
        </div>
      </section>`;
}

