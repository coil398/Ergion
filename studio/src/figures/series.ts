/** 時刻に対する数値解と解析解。点の値はスナップショットのまま描く。 */

import { axisDomain, drawCartesianAxes, mapX, mapY, type PlotFrame } from './axes';
import { canvasContext } from './canvas';
import { drawSamplePoint } from './particle';

export interface SeriesSample {
  time: number;
  numerical: number;
  exact: number;
}

export interface TimeSeriesFrame {
  key: string;
  kind: 'position' | 'velocity';
  timeEnd: number;
  time: number;
  current: number;
  samples: SeriesSample[];
}

const numericalColor = '#6552b8';
const exactColor = '#167b87';

function stroke(context: CanvasRenderingContext2D, frame: PlotFrame, samples: SeriesSample[], value: (sample: SeriesSample) => number) {
  context.beginPath();
  let started = false;
  for (const sample of samples) {
    const x = mapX(frame, sample.time);
    const y = mapY(frame, value(sample));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (started) context.lineTo(x, y);
    else {
      context.moveTo(x, y);
      started = true;
    }
  }
  if (started) context.stroke();
}

export function drawTimeSeries(canvas: HTMLCanvasElement, frame: TimeSeriesFrame) {
  const surface = canvasContext(canvas);
  if (surface.width < 2 || surface.height < 2) return;
  const { context, width, height } = surface;
  const left = 88;
  const top = 18;
  const right = 16;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  if (plotWidth < 1 || plotHeight < 1) return;

  const lastTime = frame.samples.reduce((max, sample) => Math.max(max, sample.time), 0);
  const timeEnd = Number.isFinite(frame.timeEnd) && frame.timeEnd > 0 ? frame.timeEnd : lastTime;
  const xMax = Math.max(timeEnd, lastTime, 1e-6);
  const timed = frame.samples.map(sample => ({ time: sample.time, value: sample.numerical }));
  const seed = frame.samples[0]?.numerical ?? frame.current;
  const padMin = frame.kind === 'velocity' ? Math.max(Math.abs(seed) * 0.5, 0.5) : 0.5;
  const padRatio = frame.kind === 'velocity' ? 0.5 : 0.15;
  const yDomain = axisDomain(
    frame.key,
    timed,
    xMax,
    [frame.current, ...frame.samples.map(sample => sample.exact)],
    padRatio,
    padMin,
  );
  const plot: PlotFrame = {
    left,
    top,
    width: plotWidth,
    height: plotHeight,
    xMin: 0,
    xMax,
    yMin: yDomain.min,
    yMax: yDomain.max,
  };
  const prefix = frame.kind === 'velocity' ? '速度と時間のグラフ' : '位置と時間のグラフ';
  const zeroLabel = frame.kind === 'velocity' ? 'v = 0' : 'x = 0';
  canvas.setAttribute('aria-label', `${prefix}。縦軸 ${plot.yMin.toPrecision(3)} から ${plot.yMax.toPrecision(3)}。現在値 ${frame.current}`);

  drawCartesianAxes(context, plot, zeroLabel);
  context.save();
  context.beginPath();
  context.rect(plot.left, plot.top, plot.width, plot.height);
  context.clip();
  context.lineJoin = 'round';
  context.strokeStyle = numericalColor;
  context.lineWidth = 2;
  context.setLineDash([]);
  stroke(context, plot, frame.samples, sample => sample.numerical);
  context.strokeStyle = exactColor;
  context.lineWidth = 1.7;
  context.setLineDash([5, 4]);
  stroke(context, plot, frame.samples, sample => sample.exact);
  context.restore();
  drawSamplePoint(context, mapX(plot, frame.time), mapY(plot, frame.current));
}
