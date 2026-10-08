import constantVelocityProof from '../../formal/lean/Ergion/ConstantVelocity.lean?raw';

function escapeHtml(source: string): string {
  return source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export type ProofKind = '有理数' | '実数';

export type ProofItem = {
  statement: string;
  source: string;
  moduleName: string;
  kind: ProofKind;
};

export function moduleHref(moduleName: string): string {
  const file = moduleName.slice('Ergion.'.length);
  return `https://github.com/coil398/Ergion/blob/main/formal/lean/Ergion/${file}.lean`;
}

/** lake build が通した証明。画面は Lean を実行しない。 */
export function checkedProofs(items: ProofItem[]): string {
  const kinds = new Set(items.map((item) => item.kind));
  const label = kinds.size === 1 ? [...kinds][0] : '確認済';
  const blocks = items.map((item) => {
    const link = `<a class="doc-link" href="${moduleHref(item.moduleName)}">${item.moduleName}</a>`;
    return `
        <ol class="solution"><li>${item.statement}</li></ol>
        <p>この等式は${item.kind}の上で確かめてあります。画面の計算が使う倍精度の f64 の丸めは、ここでは証明していません。証明の名前は ${link} です。下は、その証明そのものです。</p>
        <pre class="proof-source">${escapeHtml(item.source)}</pre>`;
  }).join('');
  return `
    <section class="study panel proof" aria-labelledby="proof-heading">
      <div class="panel-heading"><h2 id="proof-heading">証明</h2><span class="quiet-label">${label}</span></div>
      <div class="study-body">
        ${blocks}
      </div>
    </section>`;
}

/** 有理数の上で lake build が通した一定速度の証明。 */
export function checkedVelocityProof(statement: string): string {
  return checkedProofs([{
    statement,
    source: constantVelocityProof,
    moduleName: 'Ergion.ConstantVelocity',
    kind: '有理数',
  }]);
}
