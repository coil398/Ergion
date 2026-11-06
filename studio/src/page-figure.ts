/**
 * ページの冒頭の図。見出しと一文のあと、長い導出の前に置く。
 * 明るい配色は figures/<id>/figure.png、暗い配色は figures/<id>/figure-dark.png。
 * 画像はそのページのグラフを、表示する大きさで、縦横比を保って描く。目次のように元のグラフがないページでは呼ばない。空の軸だけを、ページの id と無関係に出さない。
 * 代替テキストはその図の主張一文で、図の下に説明は置かない。
 */
function attribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function pageFigure(id: string, alt: string): string {
  const claim = attribute(alt);
  const base = import.meta.env.BASE_URL;
  return `
      <figure class="page-figure panel">
        <img class="page-figure-light" src="${base}figures/${id}/figure.png" alt="${claim}">
        <img class="page-figure-dark" src="${base}figures/${id}/figure-dark.png" alt="${claim}">
      </figure>`;
}
