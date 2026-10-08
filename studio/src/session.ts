import type { MotionModel, Reply, Snapshot, StepMethod } from './protocol';

export interface TimedConfig {
  schema_version: 1;
  dt: number;
  steps: number;
}

export function transportPanel(): string {
  return `
          <section class="transport panel" aria-label="計算操作">
            <div class="transport-buttons">
              <button id="play" class="button primary" type="button" disabled>再生</button>
              <button id="pause" class="button secondary" type="button" disabled>一時停止</button>
              <button id="loop" class="button secondary" type="button" aria-pressed="false">ループ再生</button>
              <button id="extend" class="button secondary" type="button" disabled>計算時間を延ばす</button>
              <button id="step" class="button secondary" type="button" disabled>1ステップ</button>
              <button id="reset" class="icon-button" type="button" aria-label="初期状態にリセット" title="初期状態にリセット" disabled>↺</button>
            </div>
            <div class="progress-wrap"><div class="progress-copy"><span id="progress-text">0 / 1000 ステップ</span><span id="progress-percent">0%</span></div><progress id="progress" max="1000" value="0" aria-label="計算の進捗"></progress></div>
          </section>`;
}

export function mountSession<C extends TimedConfig>(options: {
  defaults: C;
  model: MotionModel;
  downloadName: string;
  readForm: () => C;
  fillForm: (value: C) => void;
  paintFigures: (state: Snapshot | undefined, samples: Snapshot[], config: C) => void;
  /** 数値解法のページだけが渡す。タブは方法だけを切り替える。 */
  method?: () => StepMethod;
}) {
  const form = document.querySelector<HTMLFormElement>('#config-form')!;
  const playButton = document.querySelector<HTMLButtonElement>('#play')!;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
  const loopButton = document.querySelector<HTMLButtonElement>('#loop')!;
  const extendButton = document.querySelector<HTMLButtonElement>('#extend')!;
  const stepButton = document.querySelector<HTMLButtonElement>('#step')!;
  const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
  const applyButton = document.querySelector<HTMLButtonElement>('#apply')!;
  const progress = document.querySelector<HTMLProgressElement>('#progress')!;
  const errorElement = document.querySelector<HTMLParagraphElement>('#error')!;
  const status = document.querySelector<HTMLSpanElement>('#status')!;
  const formNote = document.querySelector<HTMLParagraphElement>('#form-note')!;
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  let config = { ...options.defaults };
  let id = 0;
  let phase: 'loading' | 'ready' | 'running' | 'paused' | 'finished' | 'error' | 'pausing' = 'loading';
  let dirty = false;
  let state: Snapshot | undefined;
  let samples: Snapshot[] = [];
  let paintQueued = false;
  let sampleStride = 1;
  let playAfterLoad = false;

  function post(command: { id: number; command: 'load'; model: MotionModel; method?: StepMethod; config: C } | { id: number; command: 'start' | 'pause' | 'step' } | { id: number; command: 'extend'; steps: number }) {
    worker.postMessage(command);
  }
  function setText(selector: string, value: string) { document.querySelector(selector)!.textContent = value; }
  function showError(message: string) {
    errorElement.textContent = message;
    errorElement.hidden = false;
  }
  function controls() {
    const busy = phase === 'loading' || phase === 'pausing';
    const held = phase === 'ready' || phase === 'paused';
    playButton.disabled = busy || dirty || phase === 'error' || !held;
    playButton.classList.toggle('is-running', phase === 'running');
    pauseButton.disabled = phase !== 'running';
    loopButton.disabled = busy || phase === 'error';
    extendButton.disabled = busy || dirty || phase === 'error' || config.steps >= 1_000_000;
    stepButton.disabled = busy || dirty || phase === 'running' || phase === 'finished' || phase === 'error';
    resetButton.disabled = busy;
    applyButton.disabled = busy || (!dirty && phase !== 'error');
    const labels = { loading: '計算環境を準備中', ready: '準備完了', running: '計算中', paused: '一時停止', finished: '計算完了', error: '条件を確認してください', pausing: '停止中' };
    status.querySelector('span')!.textContent = labels[phase];
    status.dataset.phase = phase;
    formNote.textContent = dirty ? '変更した条件は、適用後の新しい計算に使います。' : '現在の条件で実行できます。';
  }
  function updateHint() {
    const value = options.readForm();
    const duration = value.dt * value.steps;
    setText('#time-hint', Number.isFinite(duration) ? `計算時間 ${duration.toFixed(2)}` : '有限の正しい数値を入力してください。');
  }
  function shownSamples() {
    if (state && samples.at(-1)?.step !== state.step) return [...samples, state];
    return samples;
  }
  function paint() {
    options.paintFigures(state, shownSamples(), config);
    const currentStep = state?.step ?? 0;
    progress.max = config.steps;
    progress.value = currentStep;
    setText('#progress-text', `${currentStep.toLocaleString('ja-JP')} / ${config.steps.toLocaleString('ja-JP')} ステップ`);
    setText('#progress-percent', `${Math.floor(currentStep / config.steps * 100)}%`);
    setText('#scene-time', `t = ${(state?.time ?? 0).toFixed(3)}`);
    for (const [selector, value] of [['#position', state?.position], ['#velocity', state?.velocity], ['#exact-position', state?.exact_position]] as const) {
      setText(selector, value === undefined ? '—' : value.toFixed(5));
    }
    const positionError = state
      ? (state.position_error ?? Math.abs(state.position - state.exact_position))
      : undefined;
    const velocityError = state ? Math.abs(state.velocity - state.exact_velocity) : undefined;
    setText('#energy-error', positionError === undefined ? '—' : positionError.toExponential(2));
    setText('#comparison', state
      ? `解析解との位置の差  ${positionError!.toExponential(2)}    速度の差  ${velocityError!.toExponential(2)}`
      : '解析解との差を計算します。');
  }
  function load(value: C) {
    config = { ...value };
    phase = 'loading';
    dirty = false;
    state = undefined;
    samples = [];
    sampleStride = Math.max(1, Math.ceil(config.steps / 2500));
    errorElement.hidden = true;
    controls();
    post({ id: ++id, command: 'load', model: options.model, method: options.method?.(), config });
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
    if (typeof reply.extended === 'number') {
      config.steps += reply.extended;
      const stepsInput = form.elements.namedItem('steps');
      if (stepsInput instanceof HTMLInputElement) stepsInput.value = String(config.steps);
      updateHint();
    }
    for (const point of reply.samples) {
      if (point.step % sampleStride === 0 || point.finished) samples.push(point);
    }
    if (playAfterLoad && reply.phase === 'ready') {
      playAfterLoad = false;
      phase = 'running';
      post({ id, command: 'start' });
    } else if (reply.phase === 'finished' && loopButton.getAttribute('aria-pressed') === 'true') {
      playAfterLoad = true;
      load(config);
      return;
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
    if (form.reportValidity()) load(options.readForm());
  });
  playButton.addEventListener('click', () => {
    if (phase !== 'ready' && phase !== 'paused') return;
    phase = 'running';
    controls();
    post({ id, command: 'start' });
  });
  pauseButton.addEventListener('click', () => {
    if (phase !== 'running') return;
    phase = 'pausing';
    controls();
    post({ id, command: 'pause' });
  });
  loopButton.addEventListener('click', () => {
    const on = loopButton.getAttribute('aria-pressed') !== 'true';
    loopButton.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on && phase === 'finished') {
      playAfterLoad = true;
      load(config);
    }
  });
  extendButton.addEventListener('click', () => {
    const added = Math.min(config.steps, 1_000_000 - config.steps);
    if (added < 1 || phase === 'loading' || phase === 'pausing' || phase === 'error') return;
    post({ id, command: 'extend', steps: added });
  });
  stepButton.addEventListener('click', () => post({ id, command: 'step' }));
  resetButton.addEventListener('click', () => { options.fillForm(config); updateHint(); load(config); });
  document.querySelector('#export')!.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = options.downloadName;
    anchor.click();
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
      const keys = Object.keys(options.defaults);
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !(key in value))) {
        throw new Error('設定の項目が一致しません。保存したJSON設定を選んでください。');
      }
      if (value.schema_version !== 1 || keys.some(key => typeof value[key] !== 'number' || !Number.isFinite(value[key] as number))) {
        throw new Error('設定の形式または数値が正しくありません。');
      }
      const next = value as unknown as C;
      options.fillForm(next);
      load(next);
    } catch (error) { showError(String(error)); }
  });

  new ResizeObserver(() => paint()).observe(document.querySelector('.results')!);
  options.fillForm(config);
  updateHint();
  load(config);
  return {
    /** 適用済みの条件のまま、選ばれている数値解法だけを読み直す。 */
    reloadMethod() {
      phase = 'loading';
      state = undefined;
      samples = [];
      errorElement.hidden = true;
      controls();
      post({ id: ++id, command: 'load', model: options.model, method: options.method?.(), config });
      paint();
    },
  };
}
