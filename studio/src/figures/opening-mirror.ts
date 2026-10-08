/**
 * ページ先頭の図。本文の最初のグラフを、同じ画素で上の図へ写す。
 * シーンの粒子、コードの図、誤差だけの図は写さない。
 */

const ERROR_CHART = /(^|-)(error|phase-chart)$/;

export function mirrorOpening(source: HTMLCanvasElement): void {
  if (source.id === 'opening-chart' || source.id === 'code-chart') return;
  if (source.closest('.scene')) return;
  if (ERROR_CHART.test(source.id)) return;
  if (source.width < 2 || source.height < 2) return;
  const opening = document.querySelector<HTMLCanvasElement>('#opening-chart');
  if (!opening) return;
  const lead = source.dataset.lead === 'true';
  const locked = opening.dataset.source;
  if (locked && locked !== 'fallback' && locked !== source.id && !lead) return;
  const context = opening.getContext('2d');
  if (!context) return;
  if (opening.width !== source.width || opening.height !== source.height) {
    opening.width = source.width;
    opening.height = source.height;
  }
  context.clearRect(0, 0, opening.width, opening.height);
  context.drawImage(source, 0, 0);
  opening.dataset.source = source.id;
}
