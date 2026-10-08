/** 軸、目盛り、原点。範囲は記録されたサンプルから決め、式は計算しない。 */

import { figurePalette } from './canvas';
import { drawLabel } from './labels';

export interface Domain {
  min: number;
  max: number;
}

export interface TimedValue {
  time: number;
  value: number;
}

export interface PlotFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface NumberLine {
  y: number;
  left: number;
  width: number;
  xMin: number;
  xMax: number;
  tickY: number;
}

interface Latch extends Domain {
  stable: boolean;
}

const latches = new Map<string, Latch>();

function recordedHorizon(samples: TimedValue[], timeEnd: number): number | undefined {
  if (samples.length < 2 || !Number.isFinite(timeEnd)) return undefined;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.time - first.time;
  if (!Number.isFinite(elapsed) || Math.abs(elapsed) <= 1e-12) return undefined;
  const slope = (last.value - first.value) / elapsed;
  const value = last.value + slope * (timeEnd - last.time);
  return Number.isFinite(value) ? value : undefined;
}

function padded(values: number[], padRatio: number, padMin: number): Domain {
  const finite = values.filter(value => Number.isFinite(value));
  if (finite.length === 0) return { min: -padMin, max: padMin };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;
  const pad = span > 0 ? span * padRatio : padMin;
  const next = { min: min - pad, max: max + pad };
  if (next.max > next.min) return next;
  return { min: min - padMin, max: max + padMin };
}

/** 軸の端。二点以上あるときは、記録された直線を計算時間の端まで延ばして固定する。 */
export function axisDomain(
  key: string,
  samples: TimedValue[],
  timeEnd: number,
  extras: number[],
  padRatio: number,
  padMin: number,
): Domain {
  const values = samples.map(sample => sample.value).concat(extras);
  const horizon = recordedHorizon(samples, timeEnd);
  if (horizon !== undefined) values.push(horizon);
  const next = padded(values, padRatio, padMin);
  const previous = latches.get(key);
  if (previous?.stable) {
    const fitted = {
      min: Math.min(previous.min, next.min),
      max: Math.max(previous.max, next.max),
      stable: true,
    };
    latches.set(key, fitted);
    return fitted;
  }
  latches.set(key, { ...next, stable: horizon !== undefined });
  return next;
}

export function mapLinear(value: number, min: number, max: number, start: number, length: number) {
  if (!(max > min) || !(length > 0)) return start;
  return start + (value - min) / (max - min) * length;
}

export function mapX(frame: PlotFrame, value: number) {
  return mapLinear(value, frame.xMin, frame.xMax, frame.left, frame.width);
}

export function mapY(frame: PlotFrame, value: number) {
  if (!(frame.yMax > frame.yMin) || !(frame.height > 0)) return frame.top;
  return frame.top + (frame.yMax - value) / (frame.yMax - frame.yMin) * frame.height;
}

export function drawOrigin(
  context: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  label?: { text: string; y: number },
) {
  context.save();
  context.setLineDash([3, 5]);
  context.strokeStyle = figurePalette().origin;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y1);
  context.lineTo(x, y2);
  context.stroke();
  context.restore();
  if (label) drawLabel(context, label.text, x, label.y, 'math', { color: figurePalette().textSecondary });
}

function interior(pixel: number, start: number, length: number) {
  return pixel > start + 2 && pixel < start + length - 2;
}

/** 目盛りの数。有効数字は3桁。10⁻³ 以上 10⁵ 未満は指数を使わずに書く。 */
export function formatTick(value: number): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e5) return String(Number(value.toPrecision(3)));
  return value.toPrecision(3);
}

/** 範囲に比べて桁が小さすぎる目盛りの値は 0 と書く。 */
function tick(value: number, span: number) {
  return Math.abs(value) < Math.abs(span) * 1e-9 ? 0 : value;
}

export function drawCartesianAxes(context: CanvasRenderingContext2D, frame: PlotFrame, zeroLabel?: string) {
  context.save();
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = frame.top + frame.height * index / 4;
    context.strokeStyle = figurePalette().borderSubtle;
    context.beginPath();
    context.moveTo(frame.left, y);
    context.lineTo(frame.left + frame.width, y);
    context.stroke();
    const yValue = tick(frame.yMax - (frame.yMax - frame.yMin) * index / 4, frame.yMax - frame.yMin);
    drawLabel(context, formatTick(yValue), frame.left - 8, y, 'tick', { align: 'right' });

    const x = frame.left + frame.width * index / 4;
    context.strokeStyle = figurePalette().borderSubtle;
    context.beginPath();
    context.moveTo(x, frame.top);
    context.lineTo(x, frame.top + frame.height);
    context.stroke();
    const xValue = tick(frame.xMin + (frame.xMax - frame.xMin) * index / 4, frame.xMax - frame.xMin);
    drawLabel(context, formatTick(xValue), x, frame.top + frame.height + 14, 'tick');
  }
  context.restore();

  const yZero = mapY(frame, 0);
  if (frame.yMin <= 0 && frame.yMax >= 0 && interior(yZero, frame.top, frame.height)) {
    context.save();
    context.setLineDash([3, 5]);
    context.strokeStyle = figurePalette().origin;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(frame.left, yZero);
    context.lineTo(frame.left + frame.width, yZero);
    context.stroke();
    context.restore();
    if (zeroLabel) drawLabel(context, zeroLabel, frame.left + 36, yZero - 12, 'math', { color: figurePalette().textSecondary });
  }
}

export function drawNumberLine(context: CanvasRenderingContext2D, line: NumberLine) {
  context.save();
  context.strokeStyle = figurePalette().border;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(line.left, line.y);
  context.lineTo(line.left + line.width, line.y);
  context.stroke();
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const value = line.xMin + (line.xMax - line.xMin) * index / 4;
    const x = mapLinear(value, line.xMin, line.xMax, line.left, line.width);
    context.strokeStyle = figurePalette().origin;
    context.beginPath();
    context.moveTo(x, line.y);
    context.lineTo(x, line.y + 6);
    context.stroke();
    drawLabel(context, formatTick(value), x, line.tickY, 'tick');
  }
  context.restore();
}
