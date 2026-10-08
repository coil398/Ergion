import { renderSample, type CodeMethod, type CodeProblem } from './code-sample';

export type { CodeMethod, CodeProblem };
import { drawPlot } from './figures/plot';
import { runPython, runTypeScript } from './step-run';

/** 開閉だけを入れる。ページをまたいで同じキーを使う。 */
export const CODE_KEY = 'ergion-code';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function languageBlock(name: string, source: string, lang: 'typescript' | 'python'): string {
  return `
        <section class="code-lang" aria-label="${name}">
          <h3>${name}</h3>
          <pre class="code-snippet">${escapeHtml(source.trim())}</pre>
          <div class="code-run-row">
            <button class="button secondary code-run" type="button" data-run="${lang}">実行</button>
            <span class="code-spinner" hidden></span>
          </div>
          <p class="code-result numeric" role="status"></p>
        </section>`;
}

export function codeIsOpen(): boolean {
  try {
    return localStorage.getItem(CODE_KEY) === 'open';
  } catch {
    return false;
  }
}

function writeSources(problem: CodeProblem, method: CodeMethod) {
  const details = document.querySelector<HTMLDetailsElement>('details.code-disclosure');
  if (!details) return;
  const pair = renderSample(problem, method === 'euler' || method === 'midpoint' || method === 'rk4' ? method : 'euler');
  const typescript = details.querySelector<HTMLElement>('[aria-label="TypeScript"] pre');
  const python = details.querySelector<HTMLElement>('[aria-label="Python"] pre');
  if (typescript) typescript.textContent = pair.ts.trim();
  if (python) python.textContent = pair.py.trim();
  details.dataset.problem = problem;
  details.dataset.method = method;
  for (const result of details.querySelectorAll<HTMLElement>('.code-result')) {
    result.textContent = '';
    delete result.dataset.state;
  }
}

/** 選ばれている数値解法に、表示中のコードの傾きを合わせる。 */
export function setCodeMethod(kind: CodeMethod) {
  const details = document.querySelector<HTMLDetailsElement>('details.code-disclosure');
  if (!details?.dataset.problem || details.dataset.problem === 'newton') return;
  writeSources(details.dataset.problem as CodeProblem, kind);
}

/** ページの方程式が変わったとき、その右辺でコードを書き直す。 */
export function setCodeProblem(problem: CodeProblem) {
  const details = document.querySelector<HTMLDetailsElement>('details.code-disclosure');
  const method = (details?.dataset.method as CodeMethod | undefined) ?? 'euler';
  writeSources(problem, problem === 'newton' ? 'euler' : method);
}

export function codeDisclosure(problem: CodeProblem, method: CodeMethod = 'euler'): string {
  const pair = renderSample(problem, method);
  return `
          <details class="code-disclosure panel" data-problem="${problem}" data-method="${method}"${codeIsOpen() ? ' open' : ''}>
            <summary>コード</summary>
            <div class="code-body">
              ${languageBlock('TypeScript', pair.ts, 'typescript')}
              ${languageBlock('Python', pair.py, 'python')}
            </div>
            <canvas id="code-chart" class="code-chart" role="img" aria-label="コードが描く点"></canvas>
          </details>`;
}

function drawCodeChart(text: string) {
  const canvas = document.querySelector<HTMLCanvasElement>('#code-chart');
  if (!canvas) return;
  const points = JSON.parse(text) as [number, number][];
  if (!Array.isArray(points) || points.length === 0) return;
  drawPlot(canvas, {
    key: 'code-chart',
    label: 'コードが描く点',
    lines: [{ x: points.map(point => point[0]), y: points.map(point => point[1]), role: 'numerical' }],
    dots: points.map(([x, y]) => ({ x, y, role: 'numerical', radius: 3.5 })),
  });
}

export function mountCodeDisclosure() {
  const details = document.querySelector<HTMLDetailsElement>('details.code-disclosure');
  if (!details) return;
  const write = (open: boolean) => {
    try {
      localStorage.setItem(CODE_KEY, open ? 'open' : 'closed');
    } catch {
      return;
    }
  };
  details.addEventListener('toggle', () => write(details.open));
  window.addEventListener('storage', event => {
    if (event.key === CODE_KEY) details.open = event.newValue === 'open';
  });
  for (const button of details.querySelectorAll<HTMLButtonElement>('[data-run]')) {
    button.addEventListener('click', async () => {
      const section = button.closest('.code-lang');
      const source = section?.querySelector('pre')?.textContent ?? '';
      const result = section?.querySelector<HTMLElement>('.code-result');
      const spinner = section?.querySelector<HTMLElement>('.code-spinner');
      if (!result || !spinner) return;
      button.disabled = true;
      spinner.hidden = false;
      result.dataset.state = '';
      result.textContent = '';
      await new Promise(resolve => setTimeout(resolve, 30));
      try {
        const text = button.dataset.run === 'python' ? await runPython(source) : await runTypeScript(source);
        result.textContent = text;
        drawCodeChart(text);
      } catch (error) {
        result.dataset.state = 'error';
        result.textContent = error instanceof Error ? error.message : String(error);
      } finally {
        spinner.hidden = true;
        button.disabled = false;
      }
    });
  }
}
