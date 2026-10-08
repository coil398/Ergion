/**
 * ページの図。式の直後に軸のあるグラフを置く。
 * 画素はページのグラフを写し、配色は図のトークンに従う。
 */
export function pageFigure(_id: string, alt: string): string {
  return `
      <figure class="page-figure panel">
        <canvas id="opening-chart" style="height:280px" aria-label="${alt}" role="img"></canvas>
      </figure>`;
}
