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

/** lake build が通した証明。画面は Lean を実行しない。領域は番号のついた命題と原文だけ。 */
export function checkedProofs(items: ProofItem[]): string {
  const blocks = items.map((item) => `
        <ol class="solution"><li>${item.statement}</li></ol>
        <pre class="proof-source">${escapeHtml(item.source)}</pre>`).join('');
  return `
    <section class="study panel proof" aria-labelledby="proof-heading">
      <div class="panel-heading"><h2 id="proof-heading">証明</h2></div>
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
