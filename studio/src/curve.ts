import type { LinearConfig, Reply, SeparationConfig, Snapshot } from './protocol';

/** 固定した例の厳密解を、ライブラリが返した標本として受け取る。式はここでは計算しない。 */
export function loadExample(options: {
  model: 'separation' | 'linear';
  config: SeparationConfig | LinearConfig;
  paint: (samples: Snapshot[], state: Snapshot) => void;
}) {
  const status = document.querySelector<HTMLElement>('#status')!;
  const label = status.querySelector('span')!;
  label.textContent = '計算環境を準備中';
  status.dataset.phase = 'loading';
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const id = 1;
  let samples: Snapshot[] = [];
  worker.onmessage = (event: MessageEvent<Reply>) => {
    const reply = event.data;
    if (!('phase' in reply)) {
      label.textContent = '条件を確認してください';
      status.dataset.phase = 'error';
      return;
    }
    if (reply.phase === 'ready') {
      samples = reply.samples;
      worker.postMessage({ id, command: 'start' });
      return;
    }
    samples.push(...reply.samples);
    if (reply.phase === 'finished') {
      label.textContent = '計算完了';
      status.dataset.phase = 'finished';
      options.paint(samples, reply.state);
    }
  };
  worker.postMessage({ id, command: 'load', model: options.model, config: options.config });
}
