/**
 * 単元のページの骨組み。本文は、式、解法の手順、図、数を代入した例、関連ページ、証明の順である。
 * 図の値は、ライブラリの lesson_figure か LessonSimulation が返したものだけを描く。
 */
import './style.css';
import init, { lesson_figure } from '../wasm/ergion_lab.js';
import wasmUrl from '../wasm/ergion_lab_bg.wasm?url';
import { appHeader, pageFooter, rail, relatedPages, type RelatedLink } from './chrome';
import type { PlotLine, PlotDot, PlotVector } from './figures/plot';
import { pageFigure } from './page-figure';
import type { LessonFigure } from './protocol';
import { transportPanel } from './session';
import { tex } from './tex';

export interface LessonSpec {
  id: string;
  section: { label: string; href?: string };
  title: string;
  description: string;
  /** ページの式。TeX のまま。 */
  equation: string[];
  equationLabel: string;
  equationNote: string;
  studyHeading: string;
  studyLabel: string;
  /** 解法の手順。各要素は一つの番号の中身。 */
  steps: string[];
  /** ページの図の画像の代替テキスト。 */
  figureAlt: string;
  /** 画像の下に置く、計算の図や再生の領域。 */
  figure: string;
  exampleHeading: string;
  example: string[];
  related: RelatedLink[];
  footer: string;
  /** 本当に証明のある単元だけが渡す。ページの最後に置く。 */
  proof?: string;
}

/** 解法の手順の中の、表示する式。 */
export function eq(source: string): string {
  return `<p class="solution-equation">${tex(source, true)}</p>`;
}

/** 単元のページを #app に置く。 */
export function renderLesson(spec: LessonSpec) {
  const crumb = spec.section.href ? `<a href="${spec.section.href}">${spec.section.label}</a>` : spec.section.label;
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
  ${appHeader('計算環境を準備中')}
  <div class="workspace">
    ${rail(spec.id)}
    <main id="lesson">
      <section class="intro">
        <div>
          <p class="breadcrumb">${crumb} <span>/</span> ${spec.title}</p>
          <h1>${spec.title}<span class="title-dot">.</span></h1>
          <p class="description">${spec.description}</p>
        </div>
        <div class="equation" aria-label="${spec.equationLabel}">
          ${spec.equation.map(source => tex(source, true)).join('\n          ')}
          <span class="equation-note">${spec.equationNote}</span>
        </div>
      </section>
      <section class="study panel" id="study" aria-labelledby="study-heading">
        <div class="panel-heading"><h2 id="study-heading">${spec.studyHeading}</h2><span class="quiet-label">${spec.studyLabel}</span></div>
        <div class="study-body">
          <ol class="solution">
            ${spec.steps.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </section>
      ${pageFigure(spec.id, spec.figureAlt)}
      ${spec.figure}
      <section class="study panel" id="example" aria-labelledby="example-heading">
        <div class="study-body">
          <h2 id="example-heading">${spec.exampleHeading}</h2>
          <ol class="solution">
            ${spec.example.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </section>
      ${relatedPages(spec.related)}
      ${pageFooter(spec.footer)}
      ${spec.proof ?? ''}
    </main>
  </div>`;
}

/** 文章で書いた証明。番号のついた命題と、その証明の手順。ページの最後の領域。 */
export function writtenProof(items: { statement: string; proof: string[] }[]): string {
  const blocks = items.map(item => `
        <ol class="solution"><li>${item.statement}</li></ol>
        <ol class="solution proof-steps">
          ${item.proof.map(step => `<li>${step}</li>`).join('\n          ')}
        </ol>`).join('');
  return `
    <section class="study panel proof" aria-labelledby="proof-heading">
      <div class="panel-heading"><h2 id="proof-heading">証明</h2></div>
      <div class="study-body">
        ${blocks}
      </div>
    </section>`;
}

let loaded: Promise<unknown> | undefined;

/** ライブラリの lesson_figure を呼び、図の値を受け取る。式はここで計算しない。 */
export async function lessonFigure(kind: string, params: Record<string, number | string> = {}): Promise<LessonFigure> {
  loaded ??= init({ module_or_path: wasmUrl });
  await loaded;
  return JSON.parse(lesson_figure(JSON.stringify({ kind, params }))) as LessonFigure;
}

/** ヘッダーの計算状態の表示。 */
export function setStatus(phase: 'loading' | 'finished' | 'error', text?: string) {
  const status = document.querySelector<HTMLElement>('#status');
  if (!status) return;
  status.dataset.phase = phase;
  status.querySelector('span')!.textContent = text ?? (phase === 'finished' ? '計算完了' : phase === 'error' ? '条件を確認してください' : '計算環境を準備中');
}

/** 返された線を、図の線にする。役割はライブラリが決めたまま。 */
export function line(figure: LessonFigure, name: string, label?: string): PlotLine {
  const series = figure.series.find(item => item.name === name);
  if (!series) throw new Error(`図の値 ${name} がありません。`);
  return { x: series.x, y: series.y, role: series.role, label };
}

/** 返された点を、図の点にする。 */
export function dot(figure: LessonFigure, name: string, label?: string, hollow = false): PlotDot {
  const point = figure.points.find(item => item.name === name);
  if (!point) throw new Error(`図の値 ${name} がありません。`);
  return { x: point.x, y: point.y, role: point.role, label, hollow };
}

/** 返された矢印を、図の矢印にする。 */
export function vectors(figure: LessonFigure, prefix = ''): PlotVector[] {
  return figure.arrows.filter(item => item.name.startsWith(prefix)).map(item => ({ ...item }));
}

export interface Field {
  name: string;
  label: string;
  /** 記号の TeX。 */
  symbol?: string;
  value: number;
  min?: number;
  max?: number;
  step?: string;
}

/** 計器の名前。左から、数値の値、二つめの数値の値、厳密解の値、差。 */
export interface Readouts {
  position: string;
  velocity: string;
  exact: string;
  error: string;
}

function input(field: Field): string {
  const symbol = field.symbol ? ` <span class="field-symbol">${tex(field.symbol)}</span>` : '';
  return `<label>${field.label}${symbol}<input name="${field.name}" type="number" min="${field.min ?? -1000000000000}" max="${field.max ?? 1000000000000}" step="${field.step ?? 'any'}" required value="${field.value}"></label>`;
}

function pairs(fields: Field[]): string {
  const rows: string[] = [];
  for (let i = 0; i < fields.length; i += 2) {
    const pair = fields.slice(i, i + 2);
    rows.push(pair.length === 2 ? `<div class="field-pair">${pair.map(input).join('')}</div>` : `<div class="field-single">${input(pair[0])}</div>`);
  }
  return rows.join('\n              ');
}

/**
 * 再生する単元の計算条件、図、計器、実行操作。要素の id は mountSession が読む名前である。
 * tabs は数値解法のタブの HTML、code はコードの開閉の HTML。
 */
export function experimentPanel(options: {
  fields: Field[];
  fieldsetLabel: string;
  dt: number;
  steps: number;
  sceneHeading: string;
  sceneCaption: string;
  sceneLabel: string;
  sceneHeight?: number;
  readouts: Readouts;
  plotsHeading: string;
  legend?: string;
  tabs?: string;
  plots: string;
  code?: string;
}): string {
  const legend = options.legend ?? '<span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>厳密解</span><span><i class="difference"></i>誤差</span>';
  return `
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2><span class="quiet-label">換算単位</span></div>
          <form id="config-form">
            <fieldset><legend>${options.fieldsetLabel}</legend>
              ${pairs(options.fields)}
            </fieldset>
            <fieldset><legend>時間発展</legend>
              <div class="field-pair">
                <label>時間刻み <span class="field-symbol">${tex(String.raw`\Delta t`)}</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="${options.dt}"></label>
                <label>ステップ数<input name="steps" type="number" min="1" max="1000000" step="1" required value="${options.steps}"></label>
              </div>
              <p class="field-hint" id="time-hint">計算時間 ${(options.dt * options.steps).toFixed(2)}</p>
            </fieldset>
            <button class="button secondary apply" id="apply" type="submit" disabled>条件を適用してリセット</button>
            <p class="form-note" id="form-note">現在の条件で実行できます。</p>
          </form>
          <div class="config-files"><button id="export" class="text-button" type="button">設定を保存 ↓</button><label class="text-button file-label">設定を読み込む<input id="import" type="file" accept=".json,application/json"></label></div>
          <p class="file-note">途中の計算状態は保存しません。</p>
        </section>
        <div class="results">
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">${options.sceneHeading}</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <p class="scene-caption">${options.sceneCaption}</p>
            <canvas id="scene" style="height:${options.sceneHeight ?? 260}px" aria-label="${options.sceneLabel}" role="img"></canvas>
            <div class="readouts"><div><span>${options.readouts.position}</span><output id="position">—</output></div><div><span>${options.readouts.velocity}</span><output id="velocity">—</output></div><div><span>${options.readouts.exact}</span><output id="exact-position">—</output></div><div><span>${options.readouts.error}</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">${options.plotsHeading}</h2><div class="legend">${legend}</div></div>
            ${options.tabs ?? ''}
            ${options.plots}
            <div class="plot-footer"><span id="comparison">厳密解との差を計算します。</span></div>
          </section>
          ${transportPanel()}
          ${options.code ?? ''}
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>`;
}

/** フォームの値を、既定値と同じ項目の計算条件として読む。文字列の項目は既定値のまま。 */
export function formReader<C extends Record<string, number | string>>(defaults: C) {
  const form = () => document.querySelector<HTMLFormElement>('#config-form')!;
  return {
    read(): C {
      const data = new FormData(form());
      const next: Record<string, number | string> = {};
      for (const [key, value] of Object.entries(defaults)) {
        next[key] = typeof value === 'string' || key === 'schema_version' ? value : Number(data.get(key));
      }
      return next as C;
    },
    fill(value: C) {
      for (const [key, item] of Object.entries(value)) {
        const field = form().elements.namedItem(key) as HTMLInputElement | null;
        if (field) field.value = String(item);
      }
    },
  };
}
