import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'constant-force.html', title: '運動方程式と一定の力', section: '力学', status: /準備完了/, canvases: ['#scene'] },
  { href: 'harmonic.html', title: '単振動', section: '力学', status: /準備完了/, canvases: ['#scene'], proof: true },
  { href: 'damped.html', title: '減衰振動', section: '力学', status: /準備完了/, canvases: ['#scene'], proof: true },
  { href: 'forced.html', title: '強制振動と共鳴', section: '力学', status: /準備完了/, canvases: ['#scene', '#resonance-chart'] },
  { href: 'two-body.html', title: '中心力場と2体問題', section: '力学', status: /準備完了/, canvases: ['#scene'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('一定の力の例は t = 2 で x = 9、Euler 法は 8.96 になる', async ({ page }) => {
  await page.goto('constant-force.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('tab', { name: '中点法' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 20_000 });
  await expect(page.locator('#exact-position')).toHaveText('9.00000');
  await expect(page.locator('#position')).toHaveText('9.00000');
  await page.getByRole('tab', { name: 'Euler法' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 20_000 });
  await expect(page.locator('#position')).toHaveText('8.96000');
});

test('単振動はループ再生と+t を持ち、エネルギーを示す', async ({ page }) => {
  await page.goto('harmonic.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (const name of ['再生', '一時停止', 'ループ再生', '+t']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await page.getByRole('tab', { name: '古典的RK4' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '+t', exact: true }).click();
  await expect(page.locator('#progress-text')).toContainText('/ 2,000');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#comparison')).toContainText('厳密なエネルギー 2.000000');
});

async function runToEnd(page: import('@playwright/test').Page, tab: string) {
  await page.getByRole('tab', { name: tab }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 40_000 });
}

test('減衰振動の例は半周期で x = −e^(−0.2π/√3.96) ≈ −0.72925、E ≈ 1.06360 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('damped.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('input[name="dt"]').fill(String(Math.PI / (100 * Math.sqrt(3.96))));
  await page.locator('input[name="steps"]').fill('100');
  await page.locator('#apply').click();
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#exact-position')).toHaveText('-0.72925');
  await expect(page.locator('#position')).toHaveText('-0.72925');
  await expect(page.locator('#comparison')).toContainText('厳密なエネルギー 1.063604');
  await expect(page.locator('#comparison')).toContainText('散逸したエネルギー（厳密） 0.936396');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#exact-position')).toHaveText('-0.72925');
  await expect(page.locator('#position')).not.toHaveText('-0.72925');
  const text = await page.locator('#comparison').textContent() ?? '';
  const energy = Number(text.match(/数値解のエネルギー (\S+)/)![1]);
  expect(energy).toBeGreaterThan(1.063604);
});

test('強制振動の例は ω = 2 で A = 1、δ = π/2 で、t = 20 の位置は 0.73890 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('forced.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#amplitude')).toHaveText('1.00000');
  await expect(page.locator('#phase')).toHaveText('1.57080');
  await expect(page.locator('#natural-frequency')).toHaveText('2.00000');
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#exact-position')).toHaveText('0.73890');
  await expect(page.locator('#position')).toHaveText('0.73890');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#position')).not.toHaveText('0.73890');
  await page.locator('input[name="drive_frequency"]').fill('1');
  await page.locator('#apply').click();
  await expect(page.locator('#amplitude')).toHaveText('0.32880');
});

test('2体問題の例は h = √4.5 ≈ 2.12132、E = −1/2 で、RK4 は2周期後も h を保つ', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('two-body.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#velocity')).toHaveText('2.12132');
  await expect(page.locator('#comparison')).toContainText('厳密な角運動量 h 2.121320');
  await expect(page.locator('#comparison')).toContainText('数値解のエネルギー -0.500000');
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#velocity')).toHaveText('2.12132');
  await expect(page.locator('#exact-position')).toHaveText('1.00000');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#velocity')).not.toHaveText('2.12132');
});
