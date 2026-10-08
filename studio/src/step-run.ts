import wasmUrl from '../wasm/ergion_lab_bg.wasm?url';

const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';

interface LabModule {
  default: (input?: { module_or_path: string }) => Promise<unknown>;
  euler_step: (state: Float64Array, time: number, dt: number, derivative: (time: number, state: Float64Array) => unknown) => void;
  midpoint_step: (state: Float64Array, time: number, dt: number, derivative: (time: number, state: Float64Array) => unknown) => void;
  rk4_step: (state: Float64Array, time: number, dt: number, derivative: (time: number, state: Float64Array) => unknown) => void;
  newton_step: (x: number, value: (x: number) => unknown, derivative: (x: number) => unknown) => number;
}

interface PyodideRuntime {
  setStdout(options: { batched: (line: string) => void }): void;
  registerJsModule(name: string, module: object): void;
  runPythonAsync(code: string): Promise<unknown>;
}

const STEPS = ['euler_step', 'midpoint_step', 'rk4_step', 'newton_step'] as const;
let loading: Promise<LabModule> | undefined;
let pyodideLoading: Promise<PyodideRuntime> | undefined;
let pythonBridgeReady = false;

function loadLab(): Promise<LabModule> {
  loading ??= import('../wasm/ergion_lab.js').then(async (wasm) => {
    const lab = wasm as LabModule;
    try {
      await lab.default({ module_or_path: wasmUrl });
      return lab;
    } catch (error) {
      loading = undefined;
      throw error;
    }
  });
  return loading;
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.map(item => formatValue(item)).join(', ')}]`;
  return String(value);
}

/** 表示している TypeScript を、ページの WASM の同名の関数に結びつけて実行する。 */
export async function runTypeScript(source: string): Promise<string> {
  const imported = source.match(/^import\s+init\s*,\s*\{([^}]+)\}\s+from\s+["']ergion-lab["'];?/);
  if (!imported) throw new Error('ergion-lab から関数を読み込みます。');
  const names = imported[1].split(',').map(name => name.trim()).filter(Boolean);
  const lab = await loadLab();
  const AsyncFunction = Object.getPrototypeOf(async function () { return undefined; }).constructor as new (
    ...args: string[]
  ) => (...values: unknown[]) => Promise<unknown>;
  const lines: string[] = [];
  const args = ['init', ...names, 'console'];
  const values: unknown[] = [
    async () => { await loadLab(); },
    ...names.map(name => {
      if (!STEPS.includes(name as typeof STEPS[number])) throw new Error('ergion-lab から関数を読み込みます。');
      return lab[name as typeof STEPS[number]];
    }),
    { log: (...items: unknown[]) => { lines.push(items.map(formatValue).join(' ')); } },
  ];
  await new AsyncFunction(...args, source.replace(imported[0], ''))(...values);
  return lines.join('\n').trim();
}

function pythonBridge(lab: LabModule) {
  const advance = (
    step: LabModule['euler_step'],
    state: { [index: number]: unknown; length: number; toJs?: () => unknown },
    time: number,
    dt: number,
    derivative: (time: number, state: number[]) => unknown,
  ) => {
    const current = typeof state.toJs === 'function' ? state.toJs() : Array.from({ length: state.length }, (_, index) => state[index]);
    if (!Array.isArray(current)) throw new Error('状態は数の列です。');
    const buffer = Float64Array.from(current.map(Number));
    step(buffer, time, dt, (t, y) => derivative(t, Array.from(y)));
    for (let index = 0; index < buffer.length; index += 1) state[index] = buffer[index];
  };
  return {
    euler_step: (state: { [index: number]: unknown; length: number }, time: number, dt: number, derivative: (time: number, state: number[]) => unknown) => advance(lab.euler_step, state, time, dt, derivative),
    midpoint_step: (state: { [index: number]: unknown; length: number }, time: number, dt: number, derivative: (time: number, state: number[]) => unknown) => advance(lab.midpoint_step, state, time, dt, derivative),
    rk4_step: (state: { [index: number]: unknown; length: number }, time: number, dt: number, derivative: (time: number, state: number[]) => unknown) => advance(lab.rk4_step, state, time, dt, derivative),
    newton_step: (x: number, value: (x: number) => unknown, derivative: (x: number) => unknown) => lab.newton_step(x, value, derivative),
  };
}

/** 表示している Python を Pyodide で実行する。ergion はページの WASM の同名の関数を呼ぶ。 */
export async function runPython(source: string): Promise<string> {
  const lab = await loadLab();
  pyodideLoading ??= import(/* @vite-ignore */ `${PYODIDE_INDEX}pyodide.mjs`).then(async (module: { loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime> }) => module.loadPyodide({ indexURL: PYODIDE_INDEX }));
  const pyodide = await pyodideLoading;
  if (!pythonBridgeReady) {
    pyodide.registerJsModule('ergion', pythonBridge(lab));
    pythonBridgeReady = true;
  }
  let text = '';
  pyodide.setStdout({ batched: line => { text += line.endsWith('\n') ? line : `${line}\n`; } });
  await pyodide.runPythonAsync(source);
  return text.trim();
}
