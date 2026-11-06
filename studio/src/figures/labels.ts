/** 図の中の記号と目盛り数値。日本語の注記は Noto Sans JP で描く。 */

import { figurePalette } from './canvas';

export type LabelRole = 'math' | 'tick' | 'note';

const fonts: Record<LabelRole, string> = {
  math: 'italic 16px Georgia, "Times New Roman", serif',
  tick: '16px "Noto Sans JP", "Yu Gothic UI", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
  note: '16px "Noto Sans JP", "Yu Gothic UI", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
};

function roleColor(role: LabelRole): string {
  const palette = figurePalette();
  return role === 'math' ? palette.text : palette.textSecondary;
}

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
  context.fillStyle = options?.color ?? roleColor(role);
  context.textAlign = options?.align ?? 'center';
  context.textBaseline = 'middle';
  context.fillText(text, x, y);
  context.restore();
}
