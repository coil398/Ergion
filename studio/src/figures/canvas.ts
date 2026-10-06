/** 図ライブラリの画面。高精細ディスプレイでも線と文字がぼけないようにする。 */

export interface CanvasSurface {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export function canvasContext(canvas: HTMLCanvasElement): CanvasSurface {
  const { width, height } = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D を取得できません。');
  context.scale(ratio, ratio);
  return { context, width, height };
}

export function clearFigure(canvas: HTMLCanvasElement) {
  const { context, width, height } = canvasContext(canvas);
  context.clearRect(0, 0, width, height);
}
