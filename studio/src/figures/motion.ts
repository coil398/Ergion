/**
 * 等速直線運動の図。x = x₀ + vt を、初期位置の線分と、そこから伸びる変位 vt で見せる。
 * 位置は UniformSimulation のスナップショットをそのまま使う。
 */

import { axisDomain, drawNumberLine, drawOrigin, mapLinear } from './axes';
import { canvasContext } from './canvas';
import { drawExactOutline, drawParticle } from './particle';
import { drawJoint, drawSegment, drawWitness } from './segment';

export interface MotionSample {
  time: number;
  position: number;
  exactPosition: number;
}

export interface UniformMotionFrame {
  key: string;
  x0: number;
  position: number;
  exactPosition: number;
  velocity: number;
  timeEnd: number;
  samples: MotionSample[];
}

function bands(height: number) {
  const axisY = Math.round(Math.min(height * 0.72, height - 52));
  const bracketY = Math.round(height * 0.5);
  const exactY = bracketY - 14;
  return {
    cueY: Math.max(16, Math.round(height * 0.11)),
    labelY: exactY - 18,
    exactY,
    bracketY,
    axisY,
    tickY: Math.min(axisY + 34, height - 12),
  };
}

export function drawUniformMotion(canvas: HTMLCanvasElement, frame: UniformMotionFrame) {
  const surface = canvasContext(canvas);
  if (surface.width < 2 || surface.height < 2) return;
  const { context, width, height } = surface;
  const left = 46;
  const right = 40;
  const plotWidth = Math.max(width - left - right, 1);
  const samples = frame.samples.map(sample => ({ time: sample.time, value: sample.position }));
  const exactValues = frame.samples.map(sample => sample.exactPosition);
  const domain = axisDomain(
    `${frame.key}:scene`,
    samples,
    frame.timeEnd,
    [0, frame.x0, frame.position, frame.exactPosition, ...exactValues],
    0.16,
    0.8,
  );
  const mapX = (value: number) => mapLinear(value, domain.min, domain.max, left, plotWidth);
  const { cueY, labelY, exactY, bracketY, axisY, tickY } = bands(height);
  const originX = mapX(0);
  const jointX = mapX(frame.x0);
  const positionX = mapX(frame.position);
  const exactX = mapX(frame.exactPosition);
  const clampX = { min: 16, max: width - 16 };
  const x0Pixels = Math.abs(jointX - originX);
  const x0LabelX = x0Pixels >= 28 ? (originX + jointX) / 2 : jointX;
  const vtMid = (jointX + positionX) / 2;
  const vtPixels = Math.abs(positionX - jointX);
  const vtLabel = vtPixels >= 36 && Math.abs(vtMid - x0LabelX) >= 32 ? 'vt' : undefined;

  if (domain.min <= 0 && domain.max >= 0) {
    const crowded = Math.abs(x0LabelX - originX) < 42 || Math.abs(positionX - originX) < 36;
    const label = crowded ? undefined : { text: 'x = 0', y: cueY };
    const lineTop = Math.abs(positionX - originX) < 36 ? labelY + 12 : cueY + 12;
    drawOrigin(context, originX, lineTop, axisY + 8, label);
  }
  drawNumberLine(context, { y: axisY, left, width: plotWidth, xMin: domain.min, xMax: domain.max, tickY });

  drawSegment(context, {
    x1: jointX,
    x2: exactX,
    y: exactY,
    color: '#167b87',
    width: 1.7,
    dash: [5, 4],
    caps: 'both',
  });
  drawSegment(context, {
    x1: originX,
    x2: jointX,
    y: bracketY,
    color: '#5d5873',
    width: 1.6,
    dash: [],
    caps: 'start',
    label: 'x₀',
    labelColor: '#5d5873',
    labelY,
    labelAlways: true,
    clampX,
  });
  drawSegment(context, {
    x1: jointX,
    x2: positionX,
    y: bracketY,
    color: '#6552b8',
    width: 2.5,
    dash: [],
    caps: 'none',
    arrow: true,
    label: vtLabel,
    labelColor: '#6552b8',
    labelY,
    labelMinPx: 36,
    clampX,
  });
  drawJoint(context, jointX, bracketY);

  if (axisY - 16 > bracketY + 6) drawWitness(context, positionX, bracketY + 6, axisY - 16, '#6552b8');
  if (Math.abs(positionX - exactX) > 6 && axisY - 22 > exactY + 6) {
    drawWitness(context, exactX, exactY + 6, axisY - 22, '#167b87');
  }

  drawExactOutline(context, exactX, axisY);
  drawParticle(context, {
    x: positionX,
    y: axisY,
    cue: Math.abs(frame.velocity) > 1e-6 ? { direction: frame.velocity, y: cueY } : undefined,
  });

  canvas.setAttribute('aria-label', '直線上を進む粒子。初期位置に変位 vt を加えた位置を示します。数値解は紫の実線、解析解は青緑の破線。');
}
