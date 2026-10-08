/** 長さとして読む線分。端点は呼び出し側が渡した座標で、積 vt はここでは計算しない。 */

import { drawLabel } from './labels';

export interface SegmentStyle {
  x1: number;
  x2: number;
  y: number;
  color: string;
  width: number;
  dash: number[];
  arrow?: boolean;
  caps?: 'both' | 'start' | 'end' | 'none';
  label?: string;
  labelColor?: string;
  labelY?: number;
  labelAlways?: boolean;
  labelMinPx?: number;
  clampX?: { min: number; max: number };
}

export function drawJoint(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.fillStyle = '#1c1915';
  context.beginPath();
  context.arc(x, y, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawWitness(
  context: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  color: string,
  dash: number[] = [],
) {
  if (!(y2 > y1 + 4)) return;
  context.save();
  context.globalAlpha = 0.55;
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.setLineDash(dash);
  context.beginPath();
  context.moveTo(x, y1);
  context.lineTo(x, y2);
  context.stroke();
  context.restore();
}

function cap(context: CanvasRenderingContext2D, x: number, y: number) {
  context.beginPath();
  context.moveTo(x, y - 5);
  context.lineTo(x, y + 5);
  context.stroke();
}

export function drawSegment(context: CanvasRenderingContext2D, segment: SegmentStyle) {
  const length = segment.x2 - segment.x1;
  const pixels = Math.abs(length);
  const sign = Math.sign(length) || 1;
  context.save();
  context.strokeStyle = segment.color;
  context.lineWidth = segment.width;
  context.lineCap = 'butt';
  if (pixels >= 1.5) {
    const arrow = Boolean(segment.arrow) && pixels >= 10;
    const end = arrow ? segment.x2 - sign * 8 : segment.x2;
    context.setLineDash(segment.dash);
    context.beginPath();
    context.moveTo(segment.x1, segment.y);
    context.lineTo(end, segment.y);
    context.stroke();
    context.setLineDash([]);
    const caps = segment.caps ?? 'both';
    if (caps === 'both' || caps === 'start') cap(context, segment.x1, segment.y);
    if (!arrow && (caps === 'both' || caps === 'end')) cap(context, segment.x2, segment.y);
    if (arrow) {
      context.fillStyle = segment.color;
      context.beginPath();
      context.moveTo(segment.x2, segment.y);
      context.lineTo(segment.x2 - sign * 8, segment.y - 4);
      context.lineTo(segment.x2 - sign * 8, segment.y + 4);
      context.closePath();
      context.fill();
    }
  }
  const minLabel = segment.labelMinPx ?? 28;
  if (segment.label && (segment.labelAlways || pixels >= minLabel)) {
    const anchor = pixels >= minLabel ? (segment.x1 + segment.x2) / 2 : segment.x2;
    const x = segment.clampX ? Math.min(segment.clampX.max, Math.max(segment.clampX.min, anchor)) : anchor;
    drawLabel(context, segment.label, x, segment.labelY ?? segment.y - 16, 'math', { color: segment.labelColor ?? segment.color });
  }
  context.restore();
}
