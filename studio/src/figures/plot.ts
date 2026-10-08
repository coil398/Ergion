/**
 * 直交座標のグラフ。線、点、矢印、塗る多角形、棒を、ライブラリが返した値のまま描く。
 * 色は役割で決め、値は figurePalette() のトークンから取る。式はここで計算しない。
 */

import { drawCartesianAxes, mapX, mapY, type PlotFrame } from './axes';
import { mirrorOpening } from './opening-mirror';
import { canvasContext, figurePalette, type FigurePalette } from './canvas';
import { drawLabel } from './labels';

/**
 * 線の役割。numerical は数値解の実線、exact は厳密解の破線、difference は誤差の実線、
 * reference は補助の実線、muted は補助の破線、vector は向きの矢印。
 */
export type PlotRole = 'numerical' | 'exact' | 'difference' | 'reference' | 'muted' | 'vector' | 'text';

export interface PlotLine { x: number[]; y: number[]; role: PlotRole | string; label?: string; width?: number }
export interface PlotDot { x: number; y: number; role: PlotRole | string; label?: string; radius?: number; hollow?: boolean }
export interface PlotVector { x1: number; y1: number; x2: number; y2: number; role: PlotRole | string; label?: string }
export interface PlotBars { edges: number[]; heights: number[]; role?: PlotRole | string }

export interface PlotSpec {
  /** 同じ key の図は、軸の範囲を広げるだけで縮めない。再生中に軸が揺れないようにする。 */
  key?: string;
  label: string;
  lines?: PlotLine[];
  dots?: PlotDot[];
  vectors?: PlotVector[];
  polygons?: { x: number[]; y: number[] }[];
  bars?: PlotBars[];
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** 縦と横の1単位を同じ長さにする。軌道や場の図に使う。 */
  equalAspect?: boolean;
  zeroLabel?: string;
  /** 範囲に加える余白の割合。 */
  pad?: number;
  /** 縦軸の目盛りの数を対数で書くときの底。 */
  logY?: boolean;
}

interface Range { xMin: number; xMax: number; yMin: number; yMax: number }

const latched = new Map<string, Range>();

export function roleStyle(palette: FigurePalette, role: string): { color: string; dash: number[]; width: number } {
  switch (role) {
    case 'numerical': return { color: palette.numerical, dash: [], width: 2 };
    case 'exact': return { color: palette.exact, dash: [5, 4], width: 1.7 };
    case 'difference': return { color: palette.difference, dash: [], width: 2 };
    case 'muted': return { color: palette.origin, dash: [3, 5], width: 1.2 };
    case 'vector': return { color: palette.vector, dash: [], width: 2 };
    case 'text': return { color: palette.text, dash: [], width: 1.6 };
    default: return { color: palette.textSecondary, dash: [], width: 1.4 };
  }
}

function extent(spec: PlotSpec): Range {
  const xs: number[] = [];
  const ys: number[] = [];
  const add = (x: number, y: number) => {
    if (Number.isFinite(x)) xs.push(x);
    if (Number.isFinite(y)) ys.push(spec.logY ? Math.log10(Math.max(y, 1e-300)) : y);
  };
  for (const line of spec.lines ?? []) line.x.forEach((x, i) => add(x, line.y[i]));
  for (const dot of spec.dots ?? []) add(dot.x, dot.y);
  for (const v of spec.vectors ?? []) { add(v.x1, v.y1); add(v.x2, v.y2); }
  for (const p of spec.polygons ?? []) p.x.forEach((x, i) => add(x, p.y[i]));
  for (const b of spec.bars ?? []) {
    b.edges.forEach(x => add(x, Number.NaN));
    b.heights.forEach(y => add(Number.NaN, y));
    add(Number.NaN, 0);
  }
  const lo = (v: number[]) => v.reduce((a, b) => Math.min(a, b), Infinity);
  const hi = (v: number[]) => v.reduce((a, b) => Math.max(a, b), -Infinity);
  let range = { xMin: lo(xs), xMax: hi(xs), yMin: lo(ys), yMax: hi(ys) };
  if (!Number.isFinite(range.xMin)) range = { ...range, xMin: 0, xMax: 1 };
  if (!Number.isFinite(range.yMin)) range = { ...range, yMin: -1, yMax: 1 };
  const pad = spec.pad ?? 0.08;
  const grow = (min: number, max: number) => {
    const span = max - min;
    const p = span > 0 ? span * pad : Math.max(Math.abs(min) * 0.5, 0.5);
    return [min - p, max + p];
  };
  [range.xMin, range.xMax] = grow(range.xMin, range.xMax);
  [range.yMin, range.yMax] = grow(range.yMin, range.yMax);
  return {
    xMin: spec.xMin ?? range.xMin,
    xMax: spec.xMax ?? range.xMax,
    yMin: spec.yMin ?? range.yMin,
    yMax: spec.yMax ?? range.yMax,
  };
}

function stroke(context: CanvasRenderingContext2D, frame: PlotFrame, xs: number[], ys: number[], logY?: boolean) {
  context.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i += 1) {
    const y = logY ? Math.log10(Math.max(ys[i], 1e-300)) : ys[i];
    const px = mapX(frame, xs[i]);
    const py = mapY(frame, y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) { started = false; continue; }
    if (started) context.lineTo(px, py);
    else { context.moveTo(px, py); started = true; }
  }
  context.stroke();
}

function arrowHead(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(x2 - 9 * Math.cos(angle - 0.42), y2 - 9 * Math.sin(angle - 0.42));
  context.lineTo(x2 - 9 * Math.cos(angle + 0.42), y2 - 9 * Math.sin(angle + 0.42));
  context.closePath();
  context.fill();
}

/** 直交座標のグラフを描く。値はすべて呼び出し側が渡したライブラリの値。 */
export function drawPlot(canvas: HTMLCanvasElement, spec: PlotSpec) {
  const surface = canvasContext(canvas);
  if (surface.width < 2 || surface.height < 2) return;
  const { context, width, height } = surface;
  const palette = figurePalette();
  const left = 88;
  const top = 18;
  const right = 16;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  if (plotWidth < 1 || plotHeight < 1) return;

  let range = extent(spec);
  if (spec.key) {
    const previous = latched.get(spec.key);
    if (previous) {
      range = {
        xMin: spec.xMin ?? Math.min(previous.xMin, range.xMin),
        xMax: spec.xMax ?? Math.max(previous.xMax, range.xMax),
        yMin: spec.yMin ?? Math.min(previous.yMin, range.yMin),
        yMax: spec.yMax ?? Math.max(previous.yMax, range.yMax),
      };
    }
    latched.set(spec.key, range);
  }
  if (spec.equalAspect) {
    const perX = (range.xMax - range.xMin) / plotWidth;
    const perY = (range.yMax - range.yMin) / plotHeight;
    if (perX > perY) {
      const mid = (range.yMin + range.yMax) / 2;
      const half = perX * plotHeight / 2;
      range = { ...range, yMin: mid - half, yMax: mid + half };
    } else {
      const mid = (range.xMin + range.xMax) / 2;
      const half = perY * plotWidth / 2;
      range = { ...range, xMin: mid - half, xMax: mid + half };
    }
  }
  const frame: PlotFrame = { left, top, width: plotWidth, height: plotHeight, ...range };
  canvas.setAttribute('aria-label', `${spec.label}。横軸 ${frame.xMin.toPrecision(3)} から ${frame.xMax.toPrecision(3)}、縦軸 ${spec.logY ? '10 の ' : ''}${frame.yMin.toPrecision(3)} から ${frame.yMax.toPrecision(3)}${spec.logY ? ' 乗' : ''}。`);
  drawCartesianAxes(context, frame, spec.zeroLabel);

  context.save();
  context.beginPath();
  context.rect(left, top, plotWidth, plotHeight);
  context.clip();
  context.lineJoin = 'round';
  context.lineCap = 'round';
  for (const polygon of spec.polygons ?? []) {
    context.fillStyle = palette.tint;
    context.beginPath();
    polygon.x.forEach((x, i) => {
      const px = mapX(frame, x);
      const py = mapY(frame, polygon.y[i]);
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.closePath();
    context.fill();
  }
  for (const bars of spec.bars ?? []) {
    const style = roleStyle(palette, bars.role ?? 'numerical');
    for (let i = 0; i < bars.heights.length; i += 1) {
      const x0 = mapX(frame, bars.edges[2 * i]);
      const x1 = mapX(frame, bars.edges[2 * i + 1]);
      const y0 = mapY(frame, 0);
      const y1 = mapY(frame, bars.heights[i]);
      context.fillStyle = palette.tint;
      context.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      context.strokeStyle = style.color;
      context.lineWidth = 1;
      context.setLineDash([]);
      context.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    }
  }
  for (const line of spec.lines ?? []) {
    const style = roleStyle(palette, line.role);
    context.strokeStyle = style.color;
    context.lineWidth = line.width ?? style.width;
    context.setLineDash(style.dash);
    stroke(context, frame, line.x, line.y, spec.logY);
  }
  context.setLineDash([]);
  for (const v of spec.vectors ?? []) {
    const style = roleStyle(palette, v.role);
    const x1 = mapX(frame, v.x1);
    const y1 = mapY(frame, spec.logY ? Math.log10(v.y1) : v.y1);
    const x2 = mapX(frame, v.x2);
    const y2 = mapY(frame, spec.logY ? Math.log10(v.y2) : v.y2);
    if (Math.hypot(x2 - x1, y2 - y1) < 2) continue;
    context.strokeStyle = style.color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    arrowHead(context, x1, y1, x2, y2, style.color);
  }
  for (const dot of spec.dots ?? []) {
    const style = roleStyle(palette, dot.role);
    const x = mapX(frame, dot.x);
    const y = mapY(frame, spec.logY ? Math.log10(dot.y) : dot.y);
    context.beginPath();
    context.arc(x, y, dot.radius ?? 4, 0, Math.PI * 2);
    if (dot.hollow) {
      context.strokeStyle = style.color;
      context.lineWidth = 1.6;
      context.setLineDash(dot.role === 'exact' ? [3, 3] : []);
      context.stroke();
      context.setLineDash([]);
    } else {
      context.fillStyle = style.color;
      context.fill();
    }
  }
  context.restore();

  const labelled = [
    ...(spec.lines ?? []).filter(l => l.label && l.x.length > 0).map(l => ({ x: l.x[l.x.length - 1], y: l.y[l.y.length - 1], label: l.label!, role: l.role })),
    ...(spec.dots ?? []).filter(d => d.label).map(d => ({ x: d.x, y: d.y, label: d.label!, role: d.role })),
    ...(spec.vectors ?? []).filter(v => v.label).map(v => ({ x: v.x2, y: v.y2, label: v.label!, role: v.role })),
  ];
  for (const item of labelled) {
    const px = mapX(frame, item.x);
    const py = mapY(frame, spec.logY ? Math.log10(item.y) : item.y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    const alignRight = px > left + plotWidth * 0.8;
    const x = Math.min(Math.max(px + (alignRight ? -8 : 8), left + 4), left + plotWidth - 4);
    const y = Math.min(Math.max(py - 12, top + 10), top + plotHeight - 10);
    drawLabel(context, item.label, x, y, 'math', { align: alignRight ? 'right' : 'left', color: roleStyle(palette, item.role).color === palette.textSecondary ? palette.text : roleStyle(palette, item.role).color });
  }
  mirrorOpening(canvas);
}
