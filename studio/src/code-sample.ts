/**
 * ページの数値解法を、傾きと更新を書いた短いコードにする。
 * 数はページの係数と初期値で、手で1ステップを追える刻みにする。
 */

export type CodeMethod = 'euler' | 'midpoint' | 'rk4';

export type CodeProblem =
  | 'uniform'
  | 'accelerated'
  | 'separation'
  | 'linear'
  | 'homogeneous'
  | 'exact'
  | 'bernoulli'
  | 'second-order'
  | 'undetermined'
  | 'variation'
  | 'laplace'
  | 'series'
  | 'system'
  | 'harmonic'
  | 'damped'
  | 'forced'
  | 'constant-force'
  | 'pendulum'
  | 'lorenz'
  | 'incline'
  | 'two-body'
  | 'newton';

interface Ode {
  constants: [string, string][];
  time: string;
  t0: string;
  states: [string, string][];
  prelude: [string, string][];
  slopes: string[];
  dt: string;
  steps: number;
  plot: number;
  math: string[];
}

const ode: Record<Exclude<CodeProblem, 'newton'>, Ode> = {
  uniform: { constants: [['v', '1']], time: 't', t0: '0', states: [['x', '0']], prelude: [], slopes: ['v'], dt: '0.25', steps: 4, plot: 0, math: [] },
  accelerated: { constants: [['a', '1']], time: 't', t0: '0', states: [['x', '0'], ['v', '0']], prelude: [], slopes: ['v', 'a'], dt: '0.25', steps: 4, plot: 0, math: [] },
  separation: { constants: [['k', '2']], time: 't', t0: '0', states: [['x', '3']], prelude: [], slopes: ['k * x'], dt: '0.25', steps: 4, plot: 0, math: [] },
  linear: { constants: [['p', '2'], ['q', '6']], time: 't', t0: '0', states: [['x', '1']], prelude: [], slopes: ['-p * x + q'], dt: '0.25', steps: 4, plot: 0, math: [] },
  homogeneous: { constants: [], time: 't', t0: '1', states: [['x', '0']], prelude: [], slopes: ['1 + x / t'], dt: '0.25', steps: 4, plot: 0, math: [] },
  exact: { constants: [], time: 't', t0: '1', states: [['y', '1']], prelude: [], slopes: ['-(2 * t + y) / (t + 2 * y)'], dt: '0.25', steps: 4, plot: 0, math: [] },
  bernoulli: { constants: [], time: 't', t0: '0', states: [['x', '0.5']], prelude: [], slopes: ['x - x * x'], dt: '0.25', steps: 4, plot: 0, math: [] },
  'second-order': { constants: [], time: 't', t0: '0', states: [['x', '1'], ['v', '3']], prelude: [], slopes: ['v', '3 * v - 2 * x'], dt: '0.25', steps: 4, plot: 0, math: [] },
  undetermined: { constants: [], time: 't', t0: '0', states: [['x', '0'], ['v', '0']], prelude: [], slopes: ['v', '3 * v - 2 * x + exp(3 * t)'], dt: '0.25', steps: 4, plot: 0, math: ['exp'] },
  variation: { constants: [], time: 't', t0: '0', states: [['x', '0'], ['v', '0']], prelude: [], slopes: ['v', '-x + tan(t)'], dt: '0.2', steps: 4, plot: 0, math: ['tan'] },
  laplace: { constants: [], time: 't', t0: '0', states: [['x', '0'], ['v', '0']], prelude: [], slopes: ['v', '3 * v - 2 * x + exp(3 * t)'], dt: '0.25', steps: 4, plot: 0, math: ['exp'] },
  series: { constants: [], time: 't', t0: '0', states: [['x', '1'], ['v', '0']], prelude: [], slopes: ['v', '-x'], dt: '0.25', steps: 4, plot: 0, math: [] },
  system: { constants: [], time: 't', t0: '0', states: [['x', '1'], ['y', '0']], prelude: [], slopes: ['x + y', '4 * x + y'], dt: '0.25', steps: 4, plot: 0, math: [] },
  harmonic: { constants: [['m', '1'], ['k', '4']], time: 't', t0: '0', states: [['x', '1'], ['v', '0']], prelude: [], slopes: ['v', '-k * x / m'], dt: '0.25', steps: 4, plot: 0, math: [] },
  damped: { constants: [['m', '1'], ['k', '4'], ['gamma', '0.4']], time: 't', t0: '0', states: [['x', '1'], ['v', '0']], prelude: [], slopes: ['v', '-(gamma * v + k * x) / m'], dt: '0.25', steps: 4, plot: 0, math: [] },
  forced: { constants: [['m', '1'], ['k', '4'], ['gamma', '0.5'], ['F0', '1'], ['omega', '2']], time: 't', t0: '0', states: [['x', '0'], ['v', '0']], prelude: [], slopes: ['v', '(F0 * cos(omega * t) - gamma * v - k * x) / m'], dt: '0.25', steps: 4, plot: 0, math: ['cos'] },
  'constant-force': { constants: [['a', '4']], time: 't', t0: '0', states: [['x', '1'], ['v', '0']], prelude: [], slopes: ['v', 'a'], dt: '0.25', steps: 4, plot: 0, math: [] },
  pendulum: { constants: [['g', '1'], ['l', '1']], time: 't', t0: '0', states: [['theta', 'PI / 2'], ['omega', '0']], prelude: [], slopes: ['omega', '-(g / l) * sin(theta)'], dt: '0.25', steps: 4, plot: 0, math: ['sin'] },
  lorenz: { constants: [['sigma', '10'], ['rho', '28'], ['beta', '8 / 3']], time: 't', t0: '0', states: [['x', '1'], ['y', '1'], ['z', '1']], prelude: [], slopes: ['sigma * (y - x)', 'x * (rho - z) - y', 'x * y - beta * z'], dt: '0.01', steps: 4, plot: 0, math: [] },
  incline: { constants: [['g', '9.8'], ['alpha', 'PI / 6']], time: 't', t0: '0', states: [['s', '0'], ['v', '0']], prelude: [], slopes: ['v', 'g * sin(alpha)'], dt: '0.25', steps: 4, plot: 0, math: ['sin'] },
  'two-body': { constants: [['mu', '3']], time: 't', t0: '0', states: [['x', '1'], ['y', '0'], ['vx', '0'], ['vy', 'sqrt(4.5)']], prelude: [['r', 'sqrt(x * x + y * y)']], slopes: ['vx', 'vy', '-mu * x / (r * r * r)', '-mu * y / (r * r * r)'], dt: '0.05', steps: 4, plot: 0, math: ['sqrt'] },
};

function subst(expr: string, replacements: Record<string, string>): string {
  const names = Object.keys(replacements).sort((a, b) => b.length - a.length);
  let out = expr;
  for (const name of names) out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${replacements[name]})`);
  return out;
}

function literal(value: string, lang: 'ts' | 'py'): string {
  return lang === 'ts' ? value.replaceAll('PI', 'Math.PI') : value.replaceAll('PI', 'pi');
}

function slopeExprs(problem: Ode, env: Record<string, string>): { prelude: [string, string][]; slopes: string[] } {
  const prelude = problem.prelude.map(([name, expr]) => [name, subst(expr, env)] as [string, string]);
  const slopes = problem.slopes.map(expr => subst(expr, env));
  return { prelude, slopes };
}

function renamePrelude(slopes: string[], prelude: [string, string][], suffix: string): string[] {
  if (!suffix) return slopes;
  const map = Object.fromEntries(prelude.map(([name]) => [name, `${name}${suffix}`]));
  return slopes.map(expr => subst(expr, map));
}

function slopeName(method: CodeMethod, state: string, stage: '1' | '2' | '3' | '4' | 'mid' | ''): string {
  if (method === 'rk4') return `k${stage}_${state}`;
  if (method === 'midpoint' && stage === 'mid') return `slope_${state}_mid`;
  return `slope_${state}`;
}

export function renderSample(problem: CodeProblem, method: CodeMethod): { ts: string; py: string } {
  if (problem === 'newton') return newton();
  return { ts: odeSource(ode[problem], method, 'ts'), py: odeSource(ode[problem], method, 'py') };
}

function newton(): { ts: string; py: string } {
  const ts = `const steps = 4;
let x = 1;
const points = [];
for (let n = 0; n < steps; n++) {
  const value = x * x - 2;
  const slope = 2 * x;
  x = x - value / slope;
  points.push([n + 1, x]);
}
console.log(JSON.stringify(points));
`;
  const py = `steps = 4
x = 1.0
points = []
for n in range(steps):
    value = x * x - 2
    slope = 2 * x
    x = x - value / slope
    points.append([n + 1, x])
print(points)
`;
  return { ts, py };
}

function odeSource(problem: Ode, method: CodeMethod, lang: 'ts' | 'py'): string {
  const lines: string[] = [];
  const math = [...problem.math];
  if (problem.states.some(([, value]) => value.includes('PI')) || problem.constants.some(([, value]) => value.includes('PI'))) {
    if (!math.includes('pi')) math.push('pi');
  }
  if (lang === 'py' && math.length) lines.push(`from math import ${math.map(name => (name === 'pi' ? 'pi' : name)).join(', ')}`);
  if (lang === 'ts') {
    for (const name of math) {
      if (name === 'pi') lines.push('const pi = Math.PI;');
      else lines.push(`const ${name} = Math.${name};`);
    }
  }
  const decl = lang === 'ts' ? 'const ' : '';
  const letDecl = lang === 'ts' ? 'let ' : '';
  lines.push(`${decl}dt = ${problem.dt};`);
  lines.push(`${decl}steps = ${problem.steps};`);
  for (const [name, value] of problem.constants) lines.push(`${decl}${name} = ${literal(value, lang)};`);
  lines.push(`${letDecl}${problem.time} = ${literal(problem.t0, lang)};`);
  for (const [name, value] of problem.states) lines.push(`${letDecl}${name} = ${literal(value, lang)};`);
  lines.push(lang === 'ts' ? 'const points = [];' : 'points = []');
  lines.push(lang === 'ts' ? 'for (let n = 0; n < steps; n++) {' : 'for n in range(steps):');
  const body = method === 'euler' ? eulerBody(problem) : method === 'midpoint' ? midpointBody(problem) : rk4Body(problem);
  const declared = new Set<string>([problem.time, ...problem.states.map(([name]) => name), ...problem.constants.map(([name]) => name), 'dt', 'steps', 'points', 'n']);
  for (const line of body) lines.push(`${lang === 'ts' ? '  ' : '    '}${lang === 'ts' ? tsAssign(line, declared) : line}`);
  const plotted = problem.states[problem.plot][0];
  lines.push(`${lang === 'ts' ? '  ' : '    '}${problem.time} = ${problem.time} + dt${lang === 'ts' ? ';' : ''}`);
  lines.push(`${lang === 'ts' ? '  ' : '    '}${lang === 'ts' ? `points.push([${problem.time}, ${plotted}]);` : `points.append([${problem.time}, ${plotted}])`}`);
  if (lang === 'ts') lines.push('}');
  lines.push(lang === 'ts' ? 'console.log(JSON.stringify(points));' : 'print(points)');
  return `${lines.join('\n')}\n`;
}

function assign(name: string, expr: string): string {
  return `${name} = ${expr}`;
}

function tsAssign(line: string, declared: Set<string>): string {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*) = ([\s\S]+)$/);
  if (!match) return `${line};`;
  const name = match[1];
  const expr = match[2];
  if (declared.has(name)) return `${name} = ${expr};`;
  declared.add(name);
  return `const ${name} = ${expr};`;
}

function eulerBody(problem: Ode): string[] {
  const { prelude, slopes } = slopeExprs(problem, {});
  const lines = prelude.map(([name, expr]) => assign(name, expr));
  problem.states.forEach(([name], index) => lines.push(assign(slopeName('euler', name, ''), slopes[index])));
  problem.states.forEach(([name]) => lines.push(assign(name, `${name} + dt * ${slopeName('euler', name, '')}`)));
  return lines;
}

function midpointBody(problem: Ode): string[] {
  const first = slopeExprs(problem, {});
  const lines = first.prelude.map(([name, expr]) => assign(name, expr));
  problem.states.forEach(([name], index) => lines.push(assign(slopeName('midpoint', name, ''), first.slopes[index])));
  problem.states.forEach(([name]) => lines.push(assign(`${name}_mid`, `${name} + (dt / 2) * ${slopeName('midpoint', name, '')}`)));
  lines.push(assign(`${problem.time}_mid`, `${problem.time} + dt / 2`));
  const env: Record<string, string> = { [problem.time]: `${problem.time}_mid` };
  for (const [name] of problem.states) env[name] = `${name}_mid`;
  const second = slopeExprs(problem, env);
  second.prelude.forEach(([name, expr]) => lines.push(assign(`${name}_mid`, expr)));
  const slopes = renamePrelude(second.slopes, second.prelude, '_mid');
  problem.states.forEach(([name], index) => lines.push(assign(slopeName('midpoint', name, 'mid'), slopes[index])));
  problem.states.forEach(([name]) => lines.push(assign(name, `${name} + dt * ${slopeName('midpoint', name, 'mid')}`)));
  return lines;
}

function rk4Body(problem: Ode): string[] {
  const lines: string[] = [];
  const stages: { id: '1' | '2' | '3' | '4'; factor: string | null }[] = [
    { id: '1', factor: null },
    { id: '2', factor: 'dt / 2' },
    { id: '3', factor: 'dt / 2' },
    { id: '4', factor: 'dt' },
  ];
  for (const stage of stages) {
    const env: Record<string, string> = {};
    if (stage.factor) {
      env[problem.time] = `${problem.time} + ${stage.factor}`;
      for (const [name] of problem.states) env[name] = `${name} + (${stage.factor}) * k${stage.id === '2' ? '1' : stage.id === '3' ? '2' : '3'}_${name}`;
    }
    const current = slopeExprs(problem, env);
    const suffix = stage.id === '1' ? '' : `_${stage.id}`;
    current.prelude.forEach(([name, expr]) => lines.push(assign(`${name}${suffix}`, expr)));
    const slopes = renamePrelude(current.slopes, current.prelude, suffix);
    problem.states.forEach(([name], index) => lines.push(assign(`k${stage.id}_${name}`, slopes[index])));
  }
  for (const [name] of problem.states) {
    lines.push(assign(name, `${name} + (dt / 6) * (k1_${name} + 2 * k2_${name} + 2 * k3_${name} + k4_${name})`));
  }
  return lines;
}
