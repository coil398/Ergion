/** 図の中の記号と目盛り数値。日本語の注記は Noto Sans JP で描く。 */

export type LabelRole = 'math' | 'tick' | 'note';

const fonts: Record<LabelRole, string> = {
  math: 'italic 13px Georgia, "Times New Roman", serif',
  tick: '10px sans-serif',
  note: '11px "Noto Sans JP", "Yu Gothic UI", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
};

const colors: Record<LabelRole, string> = {
  math: '#25243c',
  tick: '#817e96',
  note: '#5d5873',
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
