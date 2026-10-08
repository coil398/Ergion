import { runPython, runTypeScript } from './step-run';

/** 開閉だけを入れる。ページをまたいで同じキーを使う。 */
export const CODE_KEY = 'ergion-code';

const TS_INSTALL = 'npm install ./studio/wasm';
const PY_INSTALL = 'pip install ./py/ergion';

const snippets = {
  euler: {
    ts: `import init, { euler_step } from "ergion-lab";

await init();
const state = new Float64Array([0]);
euler_step(state, 0, 0.1, (_time, _state) => 1);
console.log(Array.from(state));
`,
    py: `from ergion import euler_step

state = [0.0]
euler_step(state, 0.0, 0.1, lambda time, state: 1.0)
print(state)
`,
  },
  midpoint: {
    ts: `import init, { midpoint_step } from "ergion-lab";

await init();
const state = new Float64Array([0]);
midpoint_step(state, 0, 0.1, (_time, _state) => 1);
console.log(Array.from(state));
`,
    py: `from ergion import midpoint_step

state = [0.0]
midpoint_step(state, 0.0, 0.1, lambda time, state: 1.0)
print(state)
`,
  },
  rk4: {
    ts: `import init, { rk4_step } from "ergion-lab";

await init();
const state = new Float64Array([0]);
rk4_step(state, 0, 0.1, (_time, _state) => 1);
console.log(Array.from(state));
`,
    py: `from ergion import rk4_step

state = [0.0]
rk4_step(state, 0.0, 0.1, lambda time, state: 1.0)
print(state)
`,
  },
  newton: {
    ts: `import init, { newton_step } from "ergion-lab";

await init();
console.log(newton_step(1, (x) => x * x - 2, (x) => 2 * x));
`,
    py: `from ergion import newton_step

print(newton_step(1.0, lambda x: x * x - 2.0, lambda x: 2.0 * x))
`,
  },
} as const;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function languageBlock(name: string, install: string, source: string, lang: 'typescript' | 'python'): string {
  return `
        <section class="code-lang" aria-label="${name}">
          <h3>${name}</h3>
          <p class="code-install">${install}</p>
          <pre class="code-snippet">${escapeHtml(source.trim())}</pre>
          <button class="button secondary code-run" type="button" data-run="${lang}">実行</button>
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

/** 選ばれている数値解法の関数に、表示中のコードを合わせる。 */
export function setCodeMethod(kind: 'euler' | 'midpoint' | 'rk4') {
  const details = document.querySelector<HTMLDetailsElement>('details.code-disclosure');
  if (!details) return;
  const pair = snippets[kind];
  const typescript = details.querySelector<HTMLElement>('[aria-label="TypeScript"] pre');
  const python = details.querySelector<HTMLElement>('[aria-label="Python"] pre');
  if (typescript) typescript.textContent = pair.ts.trim();
  if (python) python.textContent = pair.py.trim();
  for (const result of details.querySelectorAll<HTMLElement>('.code-result')) {
    result.textContent = '';
    delete result.dataset.state;
  }
}

export function codeDisclosure(kind: keyof typeof snippets): string {
  const pair = snippets[kind];
  return `
          <details class="code-disclosure panel"${codeIsOpen() ? ' open' : ''}>
            <summary>コード</summary>
            <div class="code-body">
              ${languageBlock('TypeScript', TS_INSTALL, pair.ts, 'typescript')}
              ${languageBlock('Python', PY_INSTALL, pair.py, 'python')}
            </div>
          </details>`;
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
      if (!result) return;
      button.disabled = true;
      result.dataset.state = '';
      result.textContent = '';
      try {
        result.textContent = button.dataset.run === 'python' ? await runPython(source) : await runTypeScript(source);
      } catch (error) {
        result.dataset.state = 'error';
        result.textContent = error instanceof Error ? error.message : String(error);
      } finally {
        button.disabled = false;
      }
    });
  }
}
