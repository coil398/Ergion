import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function tex(page: Page, source: string) {
  return page.locator(`xpath=//*[contains(@class,"tex") and @data-tex="${source}"]`);
}

async function expectMechanicsSection(page: Page) {
  const title = page.locator('.rail-section-title');
  await expect(title).toHaveText('力学');
  const links = page.locator('.rail-pages a');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveText('等速直線運動');
  await expect(links.nth(1)).toHaveText('等加速度直線運動');
  const nested = await page.evaluate(() => {
    const section = document.querySelector('.rail-section-title')!.getBoundingClientRect();
    const items = [...document.querySelectorAll('.rail-pages a')].map(node => node.getBoundingClientRect());
    const stacked = items.every(item => item.top >= section.bottom - 1 && item.left > section.left + 4);
    const vertical = items.length === 2 && items[1].top >= items[0].bottom - 1;
    return stacked && vertical;
  });
  expect(nested).toBe(true);
}

async function expectTypeSize(page: Page) {
  const type = await page.evaluate(() => {
    const px = (selector: string) => parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize);
    const plate = (selector: string) => getComputedStyle(document.querySelector(selector)!).backgroundColor;
    return {
      body: px('body'),
      solution: px('.solution'),
      equation: px('.equation'),
      katex: px('.equation .katex'),
      heading: px('h1'),
      equationPlate: plate('.equation'),
      stepPlate: plate('.solution-equation'),
    };
  });
  expect(type.body).toBe(16);
  expect(type.solution).toBe(18);
  expect(type.equation).toBe(18);
  expect(type.katex).toBe(18);
  expect(type.heading).toBe(18);
  expect(type.equationPlate).toBe('rgb(234, 231, 246)');
  expect(type.stepPlate).toBe('rgb(234, 231, 246)');
}

async function expectSimulationDoc(page: Page, module: string, name: string) {
  const href = `/Ergion/doc/ergion_lab/${module}/struct.${name}.html`;
  const link = page.locator('#study').getByRole('link', { name, exact: true });
  await expect(link).toHaveCount(2);
  await expect(link.first()).toHaveAttribute('href', href);
  await expect(link.nth(1)).toHaveAttribute('href', href);
  expect(await page.locator('#study').innerText()).not.toContain('crates/');
  const doc = await page.request.get(href);
  expect(doc.ok()).toBeTruthy();
  expect(await doc.text()).toContain(name);
}

test('開始・停止・再開・1ステップと条件の適用', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('uniform.html');
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
  await page.goto('uniform.html');
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
  await page.goto('uniform.html');
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
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('heading', { name: '等速直線運動の計算と説明' })).toBeVisible();
  await expect(tex(page, String.raw`m x'' = F`).first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(page.locator('#study .katex').first()).toBeVisible();
  await expectSimulationDoc(page, 'uniform', 'UniformSimulation');
  await expectMechanicsSection(page);
  await page.locator('[name=steps]').fill('600');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '計算を開始' }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await page.screenshot({ path: testInfo.outputPath('studio-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '等速直線運動.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '等速直線運動の計算と説明' })).toBeVisible();
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '初期状態にリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.screenshot({ path: testInfo.outputPath('studio-mobile.png'), fullPage: true });
});

test('粗い刻みでも数値軌道が表示範囲に収まる', async ({ page }, testInfo) => {
  await page.goto('uniform.html');
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

test('力学の目次は古典力学の二つのページだけを示す', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: '力学.' })).toBeVisible();
  await expect(page.locator('#contents')).toContainText('最初の部分は古典力学');
  await expect(page.locator('#contents')).toContainText('まだページにしていません');
  await expect(tex(page, 'x_0').first()).toBeVisible();
  await expect(tex(page, 'v_0').first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`).first()).toBeVisible();
  await expect(tex(page, 'v(t) = v_0 + a t').first()).toBeVisible();
  await expect(page.locator('#contents .katex').first()).toBeVisible();
  await expect(page.locator('#contents .equation').first()).toHaveCSS('background-color', 'rgb(234, 231, 246)');
  await expect(page.getByRole('link', { name: '等速直線運動' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '等加速度直線運動' }).first()).toBeVisible();
  await expectMechanicsSection(page);
  const text = await page.locator('#contents').innerText();
  for (const word of ['電磁気', '解析力学', '金融', '分子動力学', '正本', '計算核', '軌道を読む', '力学の教科書']) {
    expect(text).not.toContain(word);
  }
});

test('等加速度直線運動をデスクトップと狭い画面で読む', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('accelerated.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('heading', { name: '等加速度直線運動の計算と説明' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`).first()).toBeVisible();
  await expect(tex(page, 'v(t) = v_0 + a t').first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('数値ステップの増分は厳密解の増分と一致します');
  await expectSimulationDoc(page, 'constant_acceleration', 'ConstantAccelerationSimulation');
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  await page.locator('[name=dt]').fill('0.5');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#velocity')).toHaveText('0.50000');
  await expect(page.locator('#position')).toHaveText('0.12500');
  await expect(page.locator('#phase-chart')).toHaveAttribute('aria-label', /速度と時間のグラフ/);
  await page.screenshot({ path: testInfo.outputPath('accelerated-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '等加速度直線運動.' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(page.locator('.solution')).toBeVisible();
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('accelerated-mobile.png'), fullPage: true });
});

test('等速直線運動も狭い画面で本文と式が読める', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(page.locator('.solution')).toContainText('打ち切り誤差はありません');
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('CLIで有効な大きい刻みの設定を読み込み後も編集できる', async ({ page }) => {
  await page.goto('uniform.html');
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
