import './style.css';
import type { Command, Config, Reply, Snapshot } from './protocol';

const defaults: Config = {
  schema_version: 1,
  initial_position: 0,
  velocity: 1,
  dt: 0.01,
  steps: 1000,
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
      <a class="rail-item active" href="#experiment" aria-current="page"><span aria-hidden="true">→</span> 等速直線運動</a>
      <div class="rail-note"><span class="orbit-icon" aria-hidden="true">◎</span><p>小さな系から、<br>確かな計算へ。</p><span>最初の物理の実験</span></div>
      <a class="source-link" href="https://github.com/coil398/Ergion" target="_blank" rel="noreferrer">ソースコード ↗</a>
    </aside>
    <main id="experiment">
      <section class="intro">
        <div><p class="breadcrumb">実験室 <span>/</span> 力学の基礎</p><h1>等速直線運動<span class="title-dot">.</span></h1><p class="description">外力を受けない一粒子が、一定の速度で直線上を進みます。</p></div>
        <div class="equation" aria-label="等速直線運動の式 x イコール x0 プラス v t"><span class="math-x">x</span> = <span class="math-x">x₀</span> + <span class="math-x">v</span><span class="math-x">t</span><span>1次元・外力なし</span></div>
      </section>
      <div class="experiment-grid">
        <section class="settings panel" aria-labelledby="conditions-heading">
          <div class="panel-heading"><h2 id="conditions-heading">計算条件</h2><span class="quiet-label">換算単位</span></div>
          <form id="config-form">
            <fieldset><legend>運動の設定</legend>
              <div class="field-pair"><label>初期位置 <span>x₀</span><input name="initial_position" type="number" min="-1000000000000" max="1000000000000" step="any" required value="0"></label><label>速度 <span>v</span><input name="velocity" type="number" min="-1000000000000" max="1000000000000" step="any" required value="1"></label></div>
            </fieldset>
            <fieldset><legend>時間発展</legend>
              <div class="field-pair"><label>時間刻み <span>Δt</span><input name="dt" type="number" min="0" max="1000000000000" step="any" required value="0.01"></label><label>ステップ数<input name="steps" type="number" min="1" max="1000000" step="1" required value="1000"></label></div>
              <p class="field-hint" id="time-hint">計算時間 10.00 ／ 終点位置 10.00</p>
            </fieldset>
            <button class="button secondary apply" id="apply" type="submit" disabled>条件を適用してリセット</button>
            <p class="form-note" id="form-note">現在の条件で実行できます。</p>
          </form>
          <div class="config-files"><button id="export" class="text-button" type="button">設定を保存 ↓</button><label class="text-button file-label">設定を読み込む<input id="import" type="file" accept=".json,application/json"></label></div>
          <p class="file-note">同じJSON設定をCLIでも使えます。<br>途中の計算状態は保存しません。</p>
        </section>
        <div class="results">
          <section class="study panel" id="study" aria-labelledby="study-heading">
            <div class="panel-heading"><h2 id="study-heading">等速直線運動の理論と計算</h2><span class="quiet-label">学習用の文章</span></div>
            <div class="study-body">
              <p>最も基礎的な運動は、外力を受けない質点の運動です。Newtonの運動方程式 <span class="math">m x'' = F</span> において外力 <span class="math">F = 0</span> と置くと、加速度は常に <span class="math">a = x'' = 0</span> となります。速度 <span class="math">v = x'</span> は時間によらず一定であり、時刻 <span class="math">t</span> における位置は解析解 <span class="math">x(t) = x₀ + v t</span> で厳密に表されます。</p>
              <p>数値積分では、この1次元系を一階の微分方程式 <span class="math">x' = v</span>、<span class="math">v' = 0</span> として扱います。古典的RK4では、導関数が定数値 <span class="math">(v, 0)</span> となるため、中間の4つの段ベクトル <span class="math">k1, k2, k3, k4</span> の位置変化率はすべて <span class="math">v</span> と等しくなり、刻み幅 <span class="math">Δt</span> に対する1ステップの更新量 <span class="math">(Δt/6)(k1 + 2k2 + 2k3 + k4)</span> は厳密に <span class="math">v Δt</span> と一致します。</p>
              <p>同様にvelocity-Verlet法でも、加速度 <span class="math">a = 0</span> であるため、半刻み速度更新 <span class="math">v ← v + (Δt/2) a</span> は不変、位置更新 <span class="math">x ← x + Δt v</span>、再度加速度評価後の半刻み速度更新も不変となり、厳密な増分 <span class="math">x ← x + v Δt</span> を与えます。どちらの方法でも打ち切り誤差は0となり、浮動小数点の丸め誤差を除いて数値解と解析解が完全に一致します。</p>
              <p>画面では、上の軌道図で直線上を移動する粒子を描き、下の時系列グラフで位置 <span class="math">x(t)</span> が傾き <span class="math">v</span> の直線を描く様子を確認できます。紫色の実線がRust数値計算による数値解、青緑色の破線が解析解であり、両者が重なり合って進みます。</p>
            </div>
          </section>
          <section class="scene panel" aria-labelledby="scene-heading">
            <div class="panel-heading"><h2 id="scene-heading">粒子の直線運動</h2><span id="scene-time" class="numeric">t = 0.000</span></div>
            <canvas id="oscillator" aria-label="直線上を進む粒子の位置。数値解は紫、解析解は青緑の輪郭。" role="img"></canvas>
            <div class="readouts"><div><span>位置 x</span><output id="position">—</output></div><div><span>速度 v</span><output id="velocity">—</output></div><div><span>解析解の位置</span><output id="exact-position">—</output></div><div><span>位置の絶対差 |x - x_exact|</span><output id="energy-error">—</output></div></div>
          </section>
          <section class="plots panel" aria-labelledby="plots-heading">
            <div class="panel-heading"><h2 id="plots-heading">軌道を読む</h2><div class="legend"><span><i class="numerical"></i>数値解</span><span><i class="analytical"></i>解析解</span></div></div>
            <div class="plot-grid"><div class="plot-main"><h3>位置の時間変化 <span>x(t)</span></h3><canvas id="time-chart" aria-label="位置と時間のグラフ" role="img"></canvas><p>時間 t</p></div><div class="plot-phase"><h3>速度の時間変化 <span>v(t)</span></h3><canvas id="phase-chart" aria-label="速度と時間のグラフ" role="img"></canvas><p>時間 t</p></div></div>
            <div class="plot-footer"><span id="comparison">解析解との差を計算します。</span><span>破線は解析解</span></div>
          </section>
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons"><button id="run" class="button primary" disabled>計算を開始</button><button id="step" class="button secondary" disabled>1ステップ</button><button id="reset" class="icon-button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button></div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 1000 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="1000" value="0" aria-label="計算の進捗"></progress></div>
          </section>
          <p id="error" role="alert" hidden></p>
          <p class="experiment-note">数値計算はブラウザ内で実行します。条件や結果をサーバーへ送信しません。</p>
        </div>
      </div>
      <footer class="page-footer"><span>Ergion / 計算と学習</span><span>この画面の計算は一粒子の等速直線運動です。</span></footer>
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
    initial_position: Number(data.get('initial_position')),
    velocity: Number(data.get('velocity')),
    dt: Number(data.get('dt')),
    steps: Number(data.get('steps')),
  };
}
function fillForm(value: Config) {
  for (const [key, item] of Object.entries(value)) {
    const input = form.elements.namedItem(key) as HTMLInputElement | null;
    if (input) input.value = String(item);
  }
  updateHint();
}
function updateHint() {
  const value = readForm();
  const duration = value.dt * value.steps;
  const finalX = value.initial_position + value.velocity * duration;
  setText('#time-hint', Number.isFinite(duration) && Number.isFinite(finalX) ? `計算時間 ${duration.toFixed(2)} ／ 終点位置 ${finalX.toFixed(2)}` : '有限の正しい数値を入力してください。');
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
  anchor.href = url; anchor.download = 'ergion-uniform-motion.json'; anchor.click();
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
    if (value.schema_version !== 1 || keys.some(key => typeof value[key] !== 'number' || !Number.isFinite(value[key]))) throw new Error('設定の形式または数値が正しくありません。');
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
  const duration = config.steps * config.dt;
  const minX = Math.min(config.initial_position, config.initial_position + config.velocity * duration);
  const maxX = Math.max(config.initial_position, config.initial_position + config.velocity * duration);
  const span = Math.max(Math.abs(maxX - minX), 1.0);
  const padding = span * 0.15;
  const leftRange = minX - padding;
  const rightRange = maxX + padding;

  const leftPad = 40;
  const rightPad = 40;
  const trackW = w - leftPad - rightPad;
  const scale = trackW / (rightRange - leftRange);
  const particle = leftPad + (x - leftRange) * scale;
  const exactParticle = leftPad + (exact - leftRange) * scale;
  const y = h * 0.52;

  // 直線トラックを描画
  ctx.strokeStyle = '#e6e5f0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(leftPad, y + 25); ctx.lineTo(w - rightPad, y + 25); ctx.stroke();

  // 原点マーカー
  if (0 >= leftRange && 0 <= rightRange) {
    const originX = leftPad + (0 - leftRange) * scale;
    ctx.setLineDash([3, 5]); ctx.strokeStyle = '#c4c0d6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(originX, 15); ctx.lineTo(originX, h - 25); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#77748f'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('x = 0', originX, h - 10);
  }

  // 粒子（解析解の破線円と数値解の実体円）
  ctx.strokeStyle = '#167b87'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(exactParticle, y, 22, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#6552b8'; ctx.beginPath(); ctx.arc(particle, y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'italic 13px Georgia'; ctx.textAlign = 'center'; ctx.fillText('m', particle, y + 5);

  // 速度ベクトルの矢印
  if (Math.abs(config.velocity) > 1e-6) {
    const arrowLen = Math.sign(config.velocity) * Math.min(35, Math.max(15, Math.abs(config.velocity) * 15));
    const ax = particle + arrowLen;
    ctx.strokeStyle = '#d47343'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(particle, y - 24); ctx.lineTo(ax, y - 24); ctx.stroke();
    ctx.fillStyle = '#d47343';
    ctx.beginPath();
    ctx.moveTo(ax, y - 24);
    ctx.lineTo(ax - Math.sign(arrowLen) * 6, y - 28);
    ctx.lineTo(ax - Math.sign(arrowLen) * 6, y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'italic 12px Georgia'; ctx.fillText('v', (particle + ax) / 2, y - 32);
  }
}

function chart(canvas: HTMLCanvasElement, isVelocity: boolean) {
  const { context: ctx, width: w, height: h } = canvasContext(canvas);
  const left = 48, top = 16, right = 15, bottom = 30;
  const pw = w - left - right, ph = h - top - bottom;
  if (pw < 1 || ph < 1) return;

  const totalTime = Math.max(config.steps * config.dt, 0.1);
  const xMin = 0;
  const xMax = totalTime;

  let yMin = 0;
  let yMax = 1;
  if (isVelocity) {
    const v = config.velocity;
    const pad = Math.max(Math.abs(v) * 0.5, 0.5);
    yMin = v - pad;
    yMax = v + pad;
  } else {
    const duration = config.steps * config.dt;
    const p0 = config.initial_position;
    const pEnd = p0 + config.velocity * duration;
    const minP = Math.min(p0, pEnd);
    const maxP = Math.max(p0, pEnd);
    const pad = Math.max((maxP - minP) * 0.15, 0.5);
    yMin = minP - pad;
    yMax = maxP + pad;
  }

  canvas.setAttribute('aria-label', `${isVelocity ? '速度と時間のグラフ' : '位置と時間のグラフ'}。縦軸 ${yMin.toPrecision(3)} から ${yMax.toPrecision(3)}。現在値 ${isVelocity ? state?.velocity : state?.position}`);
  const mapX = (t: number) => left + (t - xMin) / (xMax - xMin) * pw;
  const mapY = (val: number) => top + (yMax - val) / (yMax - yMin) * ph;
  ctx.font = '10px sans-serif'; ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = top + ph * i / 4;
    ctx.strokeStyle = '#eeedf5'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillStyle = '#817e96'; ctx.fillText((yMax - (yMax - yMin) * i / 4).toPrecision(3), left - 8, y + 3);
    const x = left + pw * i / 4;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + ph); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText((xMin + (xMax - xMin) * i / 4).toPrecision(3), x, h - 10);
  }

  ctx.save(); ctx.beginPath(); ctx.rect(left, top, pw, ph); ctx.clip();
  const points = state && samples.at(-1)?.step !== state.step ? [...samples, state] : samples;
  for (const exact of [true, false]) {
    ctx.strokeStyle = exact ? '#167b87' : '#6552b8'; ctx.lineWidth = exact ? 1.7 : 2;
    ctx.setLineDash(exact ? [5, 4] : []); ctx.beginPath();
    points.forEach((p, index) => {
      const xCoord = mapX(p.time);
      const yCoord = mapY(isVelocity ? (exact ? p.exact_velocity : p.velocity) : (exact ? p.exact_position : p.position));
      if (index === 0) ctx.moveTo(xCoord, yCoord); else ctx.lineTo(xCoord, yCoord);
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (state) {
    ctx.fillStyle = '#6552b8'; ctx.beginPath();
    ctx.arc(mapX(state.time), mapY(isVelocity ? state.velocity : state.position), 3.5, 0, Math.PI * 2); ctx.fill();
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
  for (const [selector, value] of [['#position', state?.position], ['#velocity', state?.velocity], ['#exact-position', state?.exact_position]] as const) {
    setText(selector, value === undefined ? '—' : value.toFixed(5));
  }
  const err = state ? Math.abs(state.position - state.exact_position) : undefined;
  setText('#energy-error', err === undefined ? '—' : err.toExponential(2));
  setText('#comparison', state ? `解析解との位置の差  ${Math.abs(state.position - state.exact_position).toExponential(2)}` : '解析解との差を計算します。');
}

new ResizeObserver(() => paint()).observe(document.querySelector('.results')!);
fillForm(config);
load(config);
