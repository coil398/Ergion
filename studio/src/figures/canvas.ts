/** 図ライブラリの画面。高精細ディスプレイでも線と文字がぼけないようにする。 */

export interface CanvasSurface {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/** 図の色。ページと同じ CSS のトークンを読み、明るい配色と暗い配色で同じ役割の色を使う。 */
export interface FigurePalette {
  text: string;
  textSecondary: string;
  paper: string;
  border: string;
  borderSubtle: string;
  origin: string;
  numerical: string;
  exact: string;
  vector: string;
  difference: string;
  tint: string;
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let cached: { key: string; palette: FigurePalette } | undefined;

export function figurePalette(): FigurePalette {
  const key = `${document.documentElement.dataset.theme ?? ''}:${darkQuery.matches}`;
  if (cached?.key === key) return cached.palette;
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const palette: FigurePalette = {
    text: token('--color-text'),
    textSecondary: token('--color-text-secondary'),
    paper: token('--color-paper'),
    border: token('--color-border'),
    borderSubtle: token('--color-border-subtle'),
    origin: token('--color-origin'),
    numerical: token('--color-primary'),
    exact: token('--color-analytical'),
    vector: token('--color-vector'),
    difference: token('--color-difference'),
    tint: token('--color-primary-tint'),
  };
  cached = { key, palette };
  return palette;
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
