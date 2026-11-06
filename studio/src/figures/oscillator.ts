/**
 * 壁につながれたばねと質点。位置はライブラリが返した値で、ばねの長さはその位置から決まる図の縮尺である。
 */

import { axisDomain, drawNumberLine, drawOrigin, mapLinear } from './axes';
import { canvasContext, figurePalette } from './canvas';
import { drawLabel } from './labels';
import { drawExactOutline, drawParticle } from './particle';

export interface SpringFrame {
  key: string;
  position: number;
  exactPosition: number;
  velocity: number;
  timeEnd: number;
  samples: { time: number; position: number; exactPosition: number }[];
  /** 外力 F(t) の値。渡すと、質点の上に外力の矢印を描く。 */
  drive?: number;
}

export function drawSpringMass(canvas: HTMLCanvasElement, frame: SpringFrame) {
  const surface = canvasContext(canvas);
  if (surface.width < 2 || surface.height < 2) return;
  const { context, width, height } = surface;
  const palette = figurePalette();
  const wallX = 28;
  const left = 96;
  const right = 36;
  const plotWidth = Math.max(width - left - right, 1);
  const values = frame.samples.flatMap(s => [s.position, s.exactPosition]);
  const reach = Math.max(1e-6, ...values.map(Math.abs), Math.abs(frame.position), Math.abs(frame.exactPosition));
  const domain = axisDomain(`${frame.key}:spring`, [], frame.timeEnd, [-reach, reach], 0.12, 0.5);
  const half = Math.max(Math.abs(domain.min), Math.abs(domain.max));
  const mapX = (value: number) => mapLinear(value, -half, half, left, plotWidth);
  const axisY = Math.round(Math.min(height * 0.62, height - 64));
  const tickY = Math.min(axisY + 40, height - 12);
  const originX = mapX(0);
  const x = mapX(frame.position);
  const exactX = mapX(frame.exactPosition);

  drawOrigin(context, originX, 20, axisY + 26, { text: 'x = 0', y: 12 });
  drawNumberLine(context, { y: axisY + 26, left, width: plotWidth, xMin: -half, xMax: half, tickY });

  context.save();
  context.strokeStyle = palette.textSecondary;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(wallX, axisY - 34);
  context.lineTo(wallX, axisY + 34);
  context.stroke();
  context.lineWidth = 1;
  for (let y = axisY - 30; y <= axisY + 30; y += 10) {
    context.beginPath();
    context.moveTo(wallX, y);
    context.lineTo(wallX - 8, y + 8);
    context.stroke();
  }
  const coils = 10;
  const start = wallX + 6;
  const end = x - 16;
  context.strokeStyle = palette.text;
  context.lineWidth = 1.6;
  context.beginPath();
  context.moveTo(wallX, axisY);
  context.lineTo(start, axisY);
  for (let i = 0; i <= coils; i += 1) {
    const px = start + (end - start) * (i + 0.5) / (coils + 1);
    const py = axisY + (i % 2 === 0 ? -10 : 10);
    context.lineTo(px, py);
  }
  context.lineTo(end, axisY);
  context.stroke();
  context.restore();
  drawLabel(context, 'k', (start + end) / 2, axisY - 24, 'math');

  drawExactOutline(context, exactX, axisY);
  const cueLength = Math.min(64, 14 + Math.abs(frame.velocity) * 18);
  drawParticle(context, {
    x,
    y: axisY,
    cue: Math.abs(frame.velocity) > 1e-9 ? { direction: frame.velocity, y: axisY - 40, length: cueLength } : undefined,
  });
  if (frame.drive !== undefined && Math.abs(frame.drive) > 1e-9) {
    const sign = Math.sign(frame.drive);
    const length = Math.min(60, 12 + Math.abs(frame.drive) * 30);
    const y = axisY + 0;
    const tip = x + sign * 18;
    const tail = tip + sign * length;
    context.save();
    context.strokeStyle = palette.text;
    context.fillStyle = palette.text;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(tail, y);
    context.lineTo(tip + sign * 6, y);
    context.stroke();
    context.beginPath();
    context.moveTo(tip, y);
    context.lineTo(tip + sign * 8, y - 4);
    context.lineTo(tip + sign * 8, y + 4);
    context.closePath();
    context.fill();
    context.restore();
    drawLabel(context, 'F(t)', (tip + tail) / 2, y + 18, 'math');
  }
  canvas.setAttribute('aria-label', '壁につながれたばねと質点。質点は数値解の位置、青緑の破線の輪は同じ時刻の厳密解の位置です。');
}
