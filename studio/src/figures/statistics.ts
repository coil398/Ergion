/**
 * 統計学のページで、ライブラリが返した図の値を drawPlot の点と線に並べ、数を本文の文字にする。
 * ここでは式を計算しない。
 */

import type { LessonFigure } from '../protocol';
import type { PlotDot, PlotLine } from './plot';

/** 返された一本の系列の各点を、同じ役割の点にする。散布図に使う。 */
export function seriesDots(figure: LessonFigure, name: string, radius = 2): PlotDot[] {
  const series = figure.series.find(item => item.name === name);
  if (!series) throw new Error(`図の値 ${name} がありません。`);
  return series.x.map((x, i) => ({ x, y: series.y[i], role: series.role, radius }));
}

/** 名前が prefix で始まる返された点を、すべて図の点にする。 */
export function pointsWith(figure: LessonFigure, prefix: string, radius = 4.5): PlotDot[] {
  return figure.points.filter(point => point.name.startsWith(prefix)).map(point => ({ x: point.x, y: point.y, role: point.role, radius }));
}

/** 名前が prefix で始まる返された線を、すべて図の線にする。 */
export function linesWith(figure: LessonFigure, prefix: string, width?: number): PlotLine[] {
  return figure.series.filter(item => item.name.startsWith(prefix)).map(item => ({ x: item.x, y: item.y, role: item.role, width }));
}

/** 数を小数 digits 桁の文字にする。負の数の記号は − を使う。 */
export function fixed(value: number | undefined, digits = 6): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  const text = value.toFixed(digits);
  return (Number(text) === 0 ? text.replace('-', '') : text).replace('-', '−');
}

/** ergion-core の科目のモジュールにある型の説明へのリンク。見える文字は日本語だけにする。 */
export function coreTypeDoc(module: string, name: string, label: string): string {
  const href = `${import.meta.env.BASE_URL}doc/ergion_core/${module}/struct.${name}.html`;
  return `<a class="doc-link" href="${href}">${label}</a>`;
}
