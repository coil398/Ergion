/** 図の中の記号と目盛り数値。日本語の注記は Noto Sans JP で描く。 */

export type LabelRole = 'math' | 'tick' | 'note';

const fonts: Record<LabelRole, string> = {
  math: 'italic 16px Georgia, "Times New Roman", serif',
  tick: '16px "Noto Sans JP", "Yu Gothic UI", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
  note: '16px "Noto Sans JP", "Yu Gothic UI", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
};

const colors: Record<LabelRole, string> = {
  math: '#1c1915',
  tick: '#4a453c',
  note: '#4a453c',
};

export function drawLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  role: LabelRole,
  options?: { align?: CanvasTextAlign; color?: string },
) {
  context.save();
  context.font = fonts[role];
  context.fillStyle = options?.color ?? colors[role];
  context.textAlign = options?.align ?? 'center';
  context.textBaseline = 'middle';
  context.fillText(text, x, y);
  context.restore();
}
