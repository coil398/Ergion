/**
 * 画面に出しているコードを、その文のまま実行する。
 * TypeScript は関数として走らせ、Python は同じ文の並びを同じ演算に写して走らせる。
 * どちらもサーバーへ送らない。
 */

function capture(source: string): string {
  const lines: string[] = [];
  const console = { log: (...items: unknown[]) => { lines.push(items.map(item => String(item)).join(' ')); } };
  const run = new Function('console', 'Math', source) as (console: { log: (...items: unknown[]) => void }, math: Math) => void;
  run(console, Math);
  return lines.join('\n').trim();
}

/** 表示している TypeScript を実行し、console.log の出力を返す。 */
export function runTypeScript(source: string): Promise<string> {
  return Promise.resolve(capture(source));
}

function pythonToJs(source: string): string {
  const rows = source.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  const indents: number[] = [0];
  const declared = new Set<string>();
  const closeTo = (indent: number) => {
    while (indents[indents.length - 1] > indent) {
      indents.pop();
      out.push(`${' '.repeat(indents[indents.length - 1])}}`);
    }
  };
  for (const row of rows) {
    if (!row.trim() || row.trim().startsWith('#')) continue;
    const indent = row.match(/^ */)?.[0].length ?? 0;
    closeTo(indent);
    const code = row.trim();
    const pad = ' '.repeat(indent);
    if (code.startsWith('from math import ')) {
      for (const name of code.slice('from math import '.length).split(',')) {
        const item = name.trim();
        out.push(`const ${item} = Math.${item === 'pi' ? 'PI' : item};`);
        declared.add(item);
      }
      continue;
    }
    if (code.startsWith('print(') && code.endsWith(')')) {
      out.push(`${pad}console.log(JSON.stringify(${code.slice(6, -1)}));`);
      continue;
    }
    const loop = code.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+range\(([A-Za-z_][A-Za-z0-9_]*)\):$/);
    if (loop) {
      out.push(`${pad}for (let ${loop[1]} = 0; ${loop[1]} < ${loop[2]}; ${loop[1]}++) {`);
      indents.push(indent + 4);
      declared.add(loop[1]);
      continue;
    }
    const call = code.replace(/\.append\(/g, '.push(');
    const assign = call.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]+)$/);
    if (assign && !declared.has(assign[1])) {
      declared.add(assign[1]);
      out.push(`${pad}let ${assign[1]} = ${assign[2]};`);
    } else {
      out.push(`${pad}${call};`);
    }
  }
  closeTo(0);
  return out.join('\n');
}

/** 表示している Python を、その代入と繰り返しのまま実行する。 */
export function runPython(source: string): Promise<string> {
  return Promise.resolve(capture(pythonToJs(source)));
}
