/**
 * Ergion の図ライブラリ。
 * 公開モジュール: canvas, axes, particle, segment, labels, series, motion。
 * ページはここを呼び、軸やグラフを別に描かない。
 */

export * as canvas from './canvas';
export * as axes from './axes';
export * as particle from './particle';
export * as segment from './segment';
export * as labels from './labels';
export * as series from './series';
export * as motion from './motion';

export { clearFigure } from './canvas';
export { drawErrorSeries, drawTimeSeries } from './series';
export { drawConstantAcceleration, drawUniformMotion } from './motion';
