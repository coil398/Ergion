import './style.css';
import type { Command, Config, Reply, Snapshot } from './protocol';

const defaults: Config = {
  schema_version: 1, mass: 1, spring_constant: 1, initial_position: 1,
  initial_velocity: 0, dt: 0.01, steps: 2500, integrator: 'verlet',
};
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="app-header">
    <a class="brand" href="./" aria-label="Ergion Studio ホーム"><span class="brand-mark" aria-hidden="true">e</span><span>Ergion <span class="brand-sub">Studio</span></span></a>
    <span class="header-caption">数値を、動かして確かめる。</span>
    <span class="status" id="status" role="status"><i></i><span>計算環境を準備中</span></span>
  </header>
  <div class="workspace">
    <aside class="rail" aria-label="実験ナビゲーション">
      <span class="rail-heading">ワークスペース</span>
      <a class="rail-item active" href="#experiment" aria-current="page"><span aria-hidden="true">∿</span> 調和振動子</a>
      <div class="rail-note"><span class="orbit-icon" aria-hidden="true">◎</span><p>小さな系から、<br>確かな計算へ。</p><span>Dynamics の最初の実験</span></div>
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>
    <main id="experiment">
      <section class="intro">
        <div><p class="breadcrumb">実験室 <span>/</span> 時間発展</p><h1>調和振動子<span class="title-dot">.</span></h1><p class="description">ばねにつながれた粒子を動かし、数値解と解析解を見比べます。</p></div>
        <div class="equation" aria-label="運動方程式 m x の二階時間微分 イコール マイナス k x">m<span class="math-x">ẍ</span> = −k<span class="math-x">x</span><span>1次元・摩擦なし</span></div>
      </section>
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2><span class="quiet-label">換算単位</span></div>
          <form id="config-form">
            <fieldset><legend>系の設定</legend>
              <div class="field-pair"><label>質量 <span>m</span><input name="mass" type="number" min="0" max="1000000000000" step="any" required value="1"></label><label>ばね定数 <span>k</span><input name="spring_constant" type="number" min="0" max="1000000000000" step="any" required value="1"></label></div>
              <div class="field-pair"><label>初期位置 <span>x₀</span><input name="initial_position" type="number" min="-1000000000000" max="1000000000000" step="any" required value="1"></label><label>初期速度 <span>v₀</span><input name="initial_velocity" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label></div>
            </fieldset>
            <fieldset><legend>時間積分</legend>
              <label>積分法<select name="integrator"><option value="verlet">Velocity-Verlet</option><option value="rk4">Runge–Kutta 4</option></select></label>
              <div class="field-pair"><label>時間刻み <span>Δt</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="0.01"></label><label>ステップ数<input name="steps" type="number" min="1" max="1000000" step="1" required value="2500"></label></div>
              <p class="field-hint" id="time-hint">計算時間 25.00 ／ 固有周期 6.28</p>
            </fieldset>
            <button class="button secondary apply" id="apply" type="submit" disabled>条件を適用してリセット</button>
            <p class="form-note" id="form-note">現在の条件で実行できます。</p>
          </form>
          <div class="config-files"><button id="export" class="text-button" type="button">設定を保存 ↓</button><label class="text-button file-label">設定を読み込む<input id="import" type="file" accept=".json,application/json"></label></div>
          <p class="file-note">同じJSON設定をCLIでも使えます。<br>途中の計算状態は保存しません。</p>
        </section>
        <div class="results">
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">振動の様子</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <canvas id="oscillator" aria-label="ばねに接続された粒子の位置。数値解は紫、解析解は青緑の輪郭。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>全エネルギー E</span><output id="energy">—</output></div><div><span>初期値からの変動 ΔE / E₀</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">軌道を読む</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span></div></div>
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 <span>x(t)</span></h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>位相空間 <span>v(x)</span></h3><canvas id="phase-chart" aria-label="位置と速度の位相図" role="img"></canvas><p>位置 x</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>破線は解析解</span></div>
          </section>
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons"><button id="run" class="button primary" disabled>計算を開始</button><button id="step" class="button secondary" disabled>1ステップ</button><button id="reset" class="icon-button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button></div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 2500 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="2500" value="0" aria-label="計算の進捗"></progress></div>
          </section>
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      <footer class="page-footer"><span>Ergion / 時間発展の実験</span><span>調和振動子 <span aria-hidden="true">→</span> 次の段階は3D分子動力学</span></footer>
    </main>
  </div>`;

// 固定テンプレート内の要素にのみ使用する。外部文字列はtextContentへ渡す。
const form = document.querySelector<HTMLFormElement>('#config-form')!;
const runButton = document.querySelector<HTMLButtonElement>('#run')!;
const stepButton = document.querySelector<HTMLButtonElement>('#step')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const applyButton = document.querySelector<HTMLButtonElement>('#apply')!;
const progress = document.querySelector<HTMLProgressElement>('#progress')!;
const errorElement = document.querySelector<HTMLParagraphElement>('#error')!;
const status = document.querySelector<HTMLSpanElement>('#status')!;
const formNote = document.querySelector<HTMLParagraphElement>('#form-note')!;
const canvases = ['oscillator', 'time-chart', 'phase-chart'].map(id => document.getElementById(id) as HTMLCanvasElement);
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
let config = { ...defaults };
let id = 0;
let phase: 'loading' | 'ready' | 'running' | 'paused' | 'finished' | 'error' | 'pausing' = 'loading';
let dirty = false;
let state: Snapshot | undefined;
let samples: Snapshot[] = [];
let paintQueued = false;
let sampleStride = 1;
let observedPosition = 0;
let observedVelocity = 0;

function post(command: Command) { worker.postMessage(command); }
function setText(selector: string, value: string) { document.querySelector(selector)!.textContent = value; }
function showError(message: string) {
  errorElement.textContent = message;
  errorElement.hidden = false;
}
function controls() {
  const busy = phase === 'loading' || phase === 'pausing';
  runButton.disabled = busy || phase === 'error' || phase === 'finished' || (dirty && phase !== 'running');
  runButton.textContent = phase === 'running' ? '一時停止' : phase === 'paused' ? '計算を再開' : phase === 'finished' ? '計算完了' : '計算を開始';
  runButton.classList.toggle('is-running', phase === 'running');
  stepButton.disabled = busy || dirty || phase === 'running' || phase === 'finished' || phase === 'error';
  resetButton.disabled = busy;
  applyButton.disabled = busy || (!dirty && phase !== 'error');
  const labels = { loading: '計算環境を準備中', ready: '準備完了', running: '計算中', paused: '一時停止', finished: '計算完了', error: '条件を確認してください', pausing: '停止中' };
  status.querySelector('span')!.textContent = labels[phase];
  status.dataset.phase = phase;
  formNote.textContent = dirty ? '変更した条件は、適用後の新しい計算に使います。' : '現在の条件で実行できます。';
}
function readForm(): Config {
  const data = new FormData(form);
  return {
    schema_version: 1,
    mass: Number(data.get('mass')), spring_constant: Number(data.get('spring_constant')),
    initial_position: Number(data.get('initial_position')), initial_velocity: Number(data.get('initial_velocity')),
    dt: Number(data.get('dt')), steps: Number(data.get('steps')),
    integrator: data.get('integrator') as Config['integrator'],
  };
}
function fillForm(value: Config) {
  for (const [key, item] of Object.entries(value)) {
    const input = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
    if (input) input.value = String(item);
  }
  updateHint();
}
function updateHint() {
  const value = readForm();
  const period = 2 * Math.PI * Math.sqrt(value.mass / value.spring_constant);
  const duration = value.dt * value.steps;
  setText('#time-hint', Number.isFinite(period) && Number.isFinite(duration) ? `計算時間 ${duration.toFixed(2)} ／ 固有周期 ${period.toFixed(2)}` : '有限の正しい数値を入力してください。');
}
function load(value: Config) {
  config = { ...value };
  phase = 'loading';
  dirty = false;
  state = undefined;
  samples = [];
  observedPosition = 0;
  observedVelocity = 0;
  sampleStride = Math.max(1, Math.ceil(config.steps / 2500));
  errorElement.hidden = true;
  controls();
  post({ id: ++id, command: 'load', config });
  paint();
}
worker.onmessage = (event: MessageEvent<Reply>) => {
  const reply = event.data;
  if (reply.id !== id) return;
  if ('error' in reply) {
    phase = 'error';
    showError(`計算を開始・継続できません。${reply.error}`);
    controls();
    return;
  }
  phase = reply.phase;
  state = reply.state;
  for (const point of reply.samples) {
    observedPosition = Math.max(observedPosition, Math.abs(point.position));
    observedVelocity = Math.max(observedVelocity, Math.abs(point.velocity));
    if (point.step % sampleStride === 0 || point.finished) samples.push(point);
  }
  controls();
  if (!paintQueued) {
    paintQueued = true;
    requestAnimationFrame(() => { paintQueued = false; paint(); });
  }
};
worker.onerror = () => {
  phase = 'error';
  showError('計算環境を読み込めませんでした。Wasmをビルドしてからページを再読み込みしてください。');
  controls();
};
form.addEventListener('input', () => { dirty = true; updateHint(); controls(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (form.reportValidity()) load(readForm());
});
runButton.addEventListener('click', () => {
  if (phase === 'running') {
    phase = 'pausing'; controls(); post({ id, command: 'pause' });
  } else {
    phase = 'running'; controls(); post({ id, command: 'start' });
  }
});
stepButton.addEventListener('click', () => post({ id, command: 'step' }));
resetButton.addEventListener('click', () => { fillForm(config); load(config); });
document.querySelector('#export')!.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'ergion-oscillator.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector<HTMLInputElement>('#import')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    if (file.size > 16384) throw new Error('設定ファイルは16KB以下にしてください。');
    const value = JSON.parse(await file.text()) as Record<string, unknown>;
    const keys = Object.keys(defaults);
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !(key in value))) throw new Error('設定の項目が一致しません。保存したJSON設定を選んでください。');
    if (value.schema_version !== 1 || !['rk4', 'verlet'].includes(String(value.integrator)) || keys.filter(key => key !== 'integrator').some(key => typeof value[key] !== 'number' || !Number.isFinite(value[key]))) throw new Error('設定の形式または数値が正しくありません。');
    // 最終的な数値契約の検証は、CLIと共通のRust側で行う。
    const next = value as unknown as Config;
    fillForm(next);
    load(next);
  } catch (error) { showError(String(error)); }
});

function canvasContext(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d')!;
  context.scale(ratio, ratio);
  return { context, width, height };
}
function scene() {
  const { context: ctx, width: w, height: h } = canvasContext(canvases[0]);
  const x = state?.position ?? config.initial_position;
  const exact = state?.exact_position ?? x;
  const omega = Math.sqrt(config.spring_constant / config.mass);
  const amplitude = Math.max(Math.hypot(config.initial_position, config.initial_velocity / omega), observedPosition, 0.1);
  const center = w * 0.57;
  const scale = w * 0.23 / amplitude;
  const particle = center + x * scale;
  const exactParticle = center + exact * scale;
  const y = h * 0.49;
  const wall = w * 0.12;
  ctx.strokeStyle = '#e6e5f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wall, y + 29); ctx.lineTo(w - 28, y + 29); ctx.stroke();
  ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(center, 20); ctx.lineTo(center, h - 28); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#77748f'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('平衡位置', center, h - 10);
  ctx.fillStyle = '#dfdce9'; ctx.fillRect(wall - 8, y - 29, 8, 58);
  ctx.strokeStyle = '#7564b6'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(wall, y); ctx.lineTo(wall + 12, y);
  const end = particle - 19;
  for (let i = 0; i <= 24; i++) ctx.lineTo(wall + 12 + (end - wall - 24) * i / 24, y + (i === 0 || i === 24 ? 0 : (i % 2 === 0 ? -9 : 9)));
  ctx.lineTo(end, y); ctx.stroke();
  ctx.strokeStyle = '#167b87'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(exactParticle, y, 23, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#6552b8'; ctx.beginPath(); ctx.arc(particle, y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'italic 15px Georgia'; ctx.fillText('m', particle, y + 5);
  ctx.fillStyle = '#817993'; ctx.font = 'italic 16px Georgia'; ctx.fillText('k', (wall + particle) / 2, y - 24);
}
function chart(canvas: HTMLCanvasElement, isPhase: boolean) {
  const { context: ctx, width: w, height: h } = canvasContext(canvas);
  const left = 43, top = 16, right = 15, bottom = 30;
  const pw = w - left - right, ph = h - top - bottom;
  if (pw < 1 || ph < 1) return;
  const omega = Math.sqrt(config.spring_constant / config.mass);
  const amplitude = Math.max(Math.hypot(config.initial_position, config.initial_velocity / omega), 0.1);
  const positionRange = Math.max(amplitude, observedPosition);
  const xMin = isPhase ? -positionRange * 1.2 : 0;
  const xMax = isPhase ? positionRange * 1.2 : config.steps * config.dt;
  const yMax = (isPhase ? Math.max(amplitude * omega, observedVelocity) : positionRange) * 1.2;
  canvas.setAttribute('aria-label', `${isPhase ? '位置と速度の位相図' : '位置と時間のグラフ'}。縦軸 ${(-yMax).toPrecision(3)} から ${yMax.toPrecision(3)}。現在値 ${isPhase ? state?.velocity : state?.position}`);
  const mapX = (x: number) => left + (x - xMin) / (xMax - xMin) * pw;
  const mapY = (y: number) => top + (yMax - y) / (2 * yMax) * ph;
  ctx.font = '10px sans-serif'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = top + ph * i / 4;
    ctx.strokeStyle = '#eeedf5'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillStyle = '#817e96'; ctx.fillText((yMax * (1 - i / 2)).toPrecision(2), left - 8, y + 3);
    const x = left + pw * i / 4;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + ph); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText((xMin + (xMax - xMin) * i / 4).toPrecision(2), x, h - 10);
  }
  ctx.save(); ctx.beginPath(); ctx.rect(left, top, pw, ph); ctx.clip();
  // 数値解と解析解はともにRustから届いた観測値だけを描画する。
  const points = state && samples.at(-1)?.step !== state.step ? [...samples, state] : samples;
  for (const exact of [true, false]) {
    ctx.strokeStyle = exact ? '#167b87' : '#6552b8'; ctx.lineWidth = exact ? 1.7 : 2;
    ctx.setLineDash(exact ? [5, 4] : []); ctx.beginPath();
    points.forEach((p, index) => {
      const x = mapX(isPhase ? (exact ? p.exact_position : p.position) : p.time);
      const y = mapY(isPhase ? (exact ? p.exact_velocity : p.velocity) : (exact ? p.exact_position : p.position));
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (state) {
    ctx.fillStyle = '#6552b8'; ctx.beginPath(); ctx.arc(mapX(isPhase ? state.position : state.time), mapY(isPhase ? state.velocity : state.position), 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function paint() {
  if (state) {
    scene(); chart(canvases[1], false); chart(canvases[2], true);
  } else {
    for (const canvas of canvases) {
      const { context, width, height } = canvasContext(canvas);
      context.clearRect(0, 0, width, height);
    }
  }
  const currentStep = state?.step ?? 0;
  progress.max = config.steps; progress.value = currentStep;
  setText('#progress-text', `${currentStep.toLocaleString('ja-JP')} / ${config.steps.toLocaleString('ja-JP')} ステップ`);
  setText('#progress-percent', `${Math.floor(currentStep / config.steps * 100)}%`);
  setText('#scene-time', `t = ${(state?.time ?? 0).toFixed(3)}`);
  for (const [selector, value] of [['#position', state?.position], ['#velocity', state?.velocity], ['#energy', state?.total_energy]] as const) setText(selector, value === undefined ? '—' : value.toFixed(5));
  setText('#energy-error', state ? state.relative_energy_error.toExponential(2) : '—');
  setText('#comparison', state ? `解析解との位置の差  ${Math.abs(state.position - state.exact_position).toExponential(2)}` : '解析解との差を計算します。');
}
new ResizeObserver(() => paint()).observe(document.querySelector('.results')!);
fillForm(config);
load(config);
