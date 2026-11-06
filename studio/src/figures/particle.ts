/** 動く粒子、解析解の輪郭、現在位置の点、速度の短い向き。 */

import { figurePalette } from './canvas';
import { drawLabel } from './labels';

export function drawExactOutline(context: CanvasRenderingContext2D, x: number, y: number, radius = 22) {
  context.save();
  context.strokeStyle = figurePalette().exact;
  context.lineWidth = 1.5;
  context.setLineDash([3, 3]);
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

export function drawSamplePoint(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.fillStyle = figurePalette().numerical;
  context.beginPath();
  context.arc(x, y, 3.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawParticle(
  context: CanvasRenderingContext2D,
  particle: { x: number; y: number; radius?: number; cue?: { direction: number; y: number; length?: number } },
) {
  const radius = particle.radius ?? 16;
  const palette = figurePalette();
  context.save();
  context.fillStyle = palette.numerical;
  context.beginPath();
  context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
  context.fill();
  drawLabel(context, 'm', particle.x, particle.y + 0.5, 'math', { color: palette.paper });
  const direction = particle.cue?.direction ?? 0;
  if (particle.cue && direction !== 0) {
    const sign = Math.sign(direction);
    const y = particle.cue.y;
    const from = particle.x;
    const to = particle.x + sign * (particle.cue.length ?? 20);
    context.strokeStyle = palette.vector;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(from, y);
    context.lineTo(to, y);
    context.stroke();
    context.fillStyle = palette.vector;
    context.beginPath();
    context.moveTo(to, y);
    context.lineTo(to - sign * 6, y - 3.5);
    context.lineTo(to - sign * 6, y + 3.5);
    context.closePath();
    context.fill();
    drawLabel(context, 'v', (from + to) / 2, y - 11, 'math', { color: palette.vector });
  }
  context.restore();
}
