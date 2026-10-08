import constantVelocityProof from '../../formal/lean/Ergion/ConstantVelocity.lean?raw';

function escapeHtml(source: string): string {
  return source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const moduleLink = '<a class="doc-link" href="https://github.com/coil398/Ergion/blob/main/formal/lean/Ergion/ConstantVelocity.lean">Ergion.ConstantVelocity</a>';

/** 有理数の上で lake build が通した一定速度の証明。画面は Lean を実行しない。 */
export function checkedVelocityProof(statement: string, pending?: string): string {
  const pendingNote = pending ? `<p>${pending}</p>` : '';
  return `
    <section class="study panel proof" aria-labelledby="proof-heading">
      <div class="panel-heading"><h2 id="proof-heading">証明</h2><span class="quiet-label">有理数</span></div>
      <div class="study-body">
        <ol class="solution"><li>${statement}</li></ol>
        <p>この等式は有理数の上で確かめてあります。画面の計算が使う倍精度の f64 の丸めは、ここでは証明していません。証明の名前は ${moduleLink} です。下は、その証明そのものです。</p>
        ${pendingNote}
        <pre class="proof-source">${escapeHtml(constantVelocityProof)}</pre>
      </div>
    </section>`;
}

/** まだ lake build に載っていない主張。sorry は証明として出さない。 */
export function uncheckedProof(statement: string): string {
  return `
    <section class="study panel proof" aria-labelledby="proof-heading">
      <div class="panel-heading"><h2 id="proof-heading">証明</h2><span class="quiet-label">未確認</span></div>
      <div class="study-body">
        <ol class="solution"><li>${statement}</li></ol>
        <p>このページの証明は、まだ確かめていません。</p>
      </div>
    </section>`;
}
