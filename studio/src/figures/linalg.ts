/**
 * 線形代数のページの図と数の書式。行列はライブラリが返した行優先の数の並びで受け取り、ここでは計算しない。
 * 色は figurePalette() のトークンから取る。
 */

import { canvasContext, figurePalette } from './canvas';
import { drawLabel } from './labels';

/** 数を TeX の文字にする。有効数字 digits 桁。極端に大きいか小さい数は 10 の累乗で書く。 */
export function texNumber(value: number, digits = 6): string {
  if (value === 0 || Object.is(value, -0)) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 1e6 || magnitude < 1e-4) {
    const [mantissa, exponent] = value.toExponential(digits - 1).split('e');
    const m = String(Number(mantissa));
    const e = Number(exponent);
    return m === '1' ? `10^{${e}}` : m === '-1' ? `-10^{${e}}` : `${m} \\times 10^{${e}}`;
  }
  return String(Number(value.toPrecision(digits)));
}

/** 数を本文の計器の文字にする。負の数の記号は − を使う。 */
export function plainNumber(value: number, digits = 6): string {
  if (value === 0 || Object.is(value, -0)) return '0';
  const magnitude = Math.abs(value);
  const text = magnitude >= 1e6 || magnitude < 1e-4
    ? value.toExponential(digits - 1).replace(/\.?0+e/, 'e')
    : String(Number(value.toPrecision(digits)));
  return text.replace('-', '−');
}

/** 返された数をそのまま（最短の10進表記で）本文に書く。丸めの結果を見せるときに使う。 */
export function fullNumber(value: number): string {
  return String(value === 0 ? 0 : value).replace('-', '−');
}

/** 行優先の数の並びを pmatrix にする。 */
export function texMatrix(values: number[], rows: number, cols: number, digits = 6): string {
  const lines: string[] = [];
  for (let i = 0; i < rows; i += 1) {
    lines.push(values.slice(i * cols, (i + 1) * cols).map(v => texNumber(v, digits)).join(' & '));
  }
  return String.raw`\begin{pmatrix} ${lines.join(String.raw` \\ `)} \end{pmatrix}`;
}

/** 行優先の rows × (cols + 1) の並びを、縦線で区切った拡大係数行列にする。 */
export function texAugmented(values: number[], rows: number, cols: number, digits = 6): string {
  const lines: string[] = [];
  for (let i = 0; i < rows; i += 1) {
    lines.push(values.slice(i * (cols + 1), (i + 1) * (cols + 1)).map(v => texNumber(v, digits)).join(' & '));
  }
  return String.raw`\left(\begin{array}{${'r'.repeat(cols)}|r} ${lines.join(String.raw` \\ `)} \end{array}\right)`;
}

/** 列ベクトル。 */
export function texVector(values: number[], digits = 6): string {
  return texMatrix(values, values.length, 1, digits);
}

export interface MatrixBlock {
  /** 行列の上に Georgia で書く記号。 */
  label: string;
  rows: number;
  cols: number;
  values: number[];
}

const cellWidth = 66;
const cellHeight = 34;
const labelHeight = 28;
const joinerWidth = 34;

/**
 * 行列を升目で描く。0 でない成分の升は式の地で塗り、数値解の色で縁取る。0 の升は細い線だけ。
 * joiners は行列のあいだの記号（= や ·）。幅に収まらないときは、記号の前で行を折り返す。
 * canvas の高さは並びに合わせて決める。
 */
export function drawMatrixBlocks(canvas: HTMLCanvasElement, blocks: MatrixBlock[], joiners: string[], label: string) {
  const available = canvas.getBoundingClientRect().width;
  const widths = blocks.map(block => block.cols * cellWidth);
  const lines: number[][] = [[]];
  let used = 0;
  blocks.forEach((_, index) => {
    const extra = (lines[lines.length - 1].length > 0 ? joinerWidth : 0) + widths[index];
    if (lines[lines.length - 1].length > 0 && used + extra > available - 8) {
      lines.push([]);
      used = 0;
    }
    used += (lines[lines.length - 1].length > 0 ? joinerWidth : 0) + widths[index];
    lines[lines.length - 1].push(index);
  });
  const lineHeights = lines.map(line => labelHeight + Math.max(...line.map(i => blocks[i].rows)) * cellHeight + 18);
  canvas.style.height = `${Math.max(lineHeights.reduce((a, b) => a + b, 0) + 8, 120)}px`;
  const { context, width, height } = canvasContext(canvas);
  context.clearRect(0, 0, width, height);
  const palette = figurePalette();
  canvas.setAttribute('aria-label', label);

  let top = 8;
  lines.forEach((line, lineIndex) => {
    const total = line.reduce((sum, i, k) => sum + widths[i] + (k > 0 ? joinerWidth : 0), 0);
    let x = Math.max((width - total) / 2, 4);
    const rows = Math.max(...line.map(i => blocks[i].rows));
    line.forEach((index, k) => {
      const block = blocks[index];
      if (index > 0) {
        const joiner = joiners[index - 1] ?? '';
        const midY = top + labelHeight + rows * cellHeight / 2;
        if (k > 0) {
          drawLabel(context, joiner, x + joinerWidth / 2, midY, 'math');
          x += joinerWidth;
        } else {
          drawLabel(context, joiner, Math.max(x - joinerWidth / 2, 10), midY, 'math');
        }
      }
      drawLabel(context, block.label, x + widths[index] / 2, top + 12, 'math');
      for (let i = 0; i < block.rows; i += 1) {
        for (let j = 0; j < block.cols; j += 1) {
          const value = block.values[i * block.cols + j];
          const cx = Math.round(x + j * cellWidth) + 0.5;
          const cy = Math.round(top + labelHeight + i * cellHeight) + 0.5;
          const nonzero = value !== 0;
          if (nonzero) {
            context.fillStyle = palette.tint;
            context.fillRect(cx, cy, cellWidth - 1, cellHeight - 1);
          }
          context.strokeStyle = nonzero ? palette.numerical : palette.borderSubtle;
          context.lineWidth = 1;
          context.strokeRect(cx + 1, cy + 1, cellWidth - 3, cellHeight - 3);
          drawLabel(context, plainNumber(value, 3), cx + cellWidth / 2, cy + cellHeight / 2, 'tick', { color: nonzero ? palette.text : palette.textSecondary });
        }
      }
      x += widths[index];
    });
    top += lineHeights[lineIndex];
  });
}
