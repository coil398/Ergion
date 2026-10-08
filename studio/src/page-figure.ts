/**
 * ページの図。明るい配色と暗い配色の画像を置き、配色に合うほうだけを見せる。
 * 幅の狭い画面では、文字を縮めずに縦に組んだ画像を使う。
 */
export function pageFigure(id: string, alt: string): string {
  const base = `${import.meta.env.BASE_URL}figures/${id}/`;
  const narrow = '(max-width: 560px)';
  return `
      <figure class="page-figure panel" data-figure="${id}">
        <picture class="figure-light">
          <source media="${narrow}" srcset="${base}figure-narrow.png">
          <img src="${base}figure.png" alt="${alt}" loading="lazy" decoding="async">
        </picture>
        <picture class="figure-dark">
          <source media="${narrow}" srcset="${base}figure-dark-narrow.png">
          <img src="${base}figure-dark.png" alt="${alt}" loading="lazy" decoding="async">
        </picture>
      </figure>`;
}
