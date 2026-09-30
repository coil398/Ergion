import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

test('開始・停止・再開・1ステップと条件の適用', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#position')).toHaveText('0.00000');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#progress-text')).toHaveText('1 / 1,000 ステップ');
  await page.getByRole('button', { name: '計算を再開' }).click();
  await expect(page.locator('#status')).toHaveText('計算中');
  await expect.poll(async () => page.locator('#scene-time').innerText()).not.toBe('t = 0.010');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('一時停止');
  const stopped = await page.locator('#progress-text').innerText();
  await page.waitForTimeout(180);
  await expect(page.locator('#progress-text')).toHaveText(stopped);
  await page.getByRole('button', { name: '計算を再開' }).click();
  await expect.poll(async () => page.locator('#progress-text').innerText()).not.toBe(stopped);
  await page.getByRole('button', { name: '初期状態にリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#progress-text')).toHaveText('0 / 1,000 ステップ');
  await page.locator('[name=initial_position]').fill('2');
  await expect(page.getByRole('button', { name: '計算を開始' })).toBeDisabled();
  await expect(page.locator('#position')).toHaveText('0.00000');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#position')).toHaveText('2.00000');
  await expect(page.locator('#status')).toHaveText('準備完了');
  expect(errors).toEqual([]);
});

test('NativeとブラウザWasmが一致する', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  const base = JSON.parse(readFileSync(resolve(root, 'examples/uniform_motion.json'), 'utf8'));
  const config = { ...base, steps: 300, dt: 0.01 };
  const configPath = testInfo.outputPath('uniform_motion.json');
  writeFileSync(configPath, JSON.stringify(config));
  const native = JSON.parse(execFileSync(resolve(root, 'target/debug/ergion'), [configPath], { encoding: 'utf8' }));
  const wasm = await page.evaluate(async ({ config: value, workerUrl }) => {
    // ページが実際に起動した本番Workerと同じ入口・通信を検証する。
    return new Promise<Record<string, number | boolean>>((resolve, reject) => {
      const worker = new Worker(workerUrl, { type: 'module' });
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Worker timeout')); }, 15000);
      let started = false;
      worker.onmessage = ({ data }) => {
        if (data.error) { clearTimeout(timer); worker.terminate(); reject(new Error(data.error)); }
        else if (!started) { started = true; worker.postMessage({ id: 7, command: 'start' }); }
        else if (data.state.finished) { clearTimeout(timer); worker.terminate(); resolve(data.state); }
      };
      worker.onerror = error => { clearTimeout(timer); worker.terminate(); reject(new Error(error.message)); };
      worker.postMessage({ id: 7, command: 'load', config: value });
    });
  }, { config, workerUrl: page.workers()[0].url() });
  for (const key of ['position', 'velocity', 'time', 'exact_position', 'exact_velocity']) {
    expect(wasm[key]).toBeCloseTo(native[key], 12);
  }
  expect(wasm.step).toBe(300);
  expect(wasm.finished).toBe(true);
});

test('設定JSONの往復・不正入力・完了後の操作', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=steps]').fill('8');
  await page.locator('[name=velocity]').fill('2');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '設定を保存' }).click();
  const file = await downloadPromise;
  const saved = JSON.parse(readFileSync((await file.path())!, 'utf8'));
  expect(saved.steps).toBe(8);
  expect(saved.velocity).toBe(2);
  await page.getByRole('button', { name: '計算を開始' }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#progress-text')).toHaveText('8 / 8 ステップ');
  await expect(page.getByRole('button', { name: '計算完了', exact: true })).toBeDisabled();
  await page.locator('#import').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#error')).toBeVisible();
  await page.locator('#import').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...saved, dt: -1 })) });
  await expect(page.locator('#status')).toHaveText('条件を確認してください');
  await expect(page.getByRole('button', { name: '計算を開始' })).toBeDisabled();
  await page.locator('#import').setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#progress-text')).toHaveText('0 / 8 ステップ');
});

test('デスクトップとモバイルの表示', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('heading', { name: '等速直線運動の理論と計算' })).toBeVisible();
  await expect(page.locator('#study')).toContainText('m x\'\' = F');
  await expect(page.locator('#study')).toContainText('x(t) = x₀ + v t');
  await page.locator('[name=steps]').fill('600');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '計算を開始' }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await page.screenshot({ path: testInfo.outputPath('studio-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '等速直線運動.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '等速直線運動の理論と計算' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '初期状態にリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.screenshot({ path: testInfo.outputPath('studio-mobile.png'), fullPage: true });
});

test('粗い刻みでも数値軌道が表示範囲に収まる', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=initial_position]').fill('0');
  await page.locator('[name=velocity]').fill('1');
  await page.locator('[name=dt]').fill('0.9');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#position')).toHaveText('0.90000');
  await expect(page.locator('#time-chart')).toHaveAttribute('aria-label', /位置と時間のグラフ/);
  await page.screenshot({ path: testInfo.outputPath('coarse-step.png'), fullPage: true });
});

test('CLIで有効な大きい刻みの設定を読み込み後も編集できる', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('準備完了');
  const config = { schema_version: 1, initial_position: 1, velocity: 2, dt: 2, steps: 10 };
  await page.locator('#import').setInputFiles({ name: 'large-dt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)) });
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=steps]').fill('12');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#progress-text')).toHaveText('0 / 12 ステップ');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#scene-time')).toHaveText('t = 2.000');
});
