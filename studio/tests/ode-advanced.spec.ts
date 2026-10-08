import { test, expect, type Page } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'sturm-liouville.html', title: 'Sturm–Liouville 問題', section: '微分方程式', status: /計算完了/, canvases: ['#mode-chart', '#residual-chart'], proof: true },
  { href: 'chaos.html', title: '非線形力学系とカオス', section: '微分方程式', status: /準備完了/, canvases: ['#scene'] },
  { href: 'heat.html', title: '熱伝導方程式', section: '微分方程式', status: /準備完了/, canvases: ['#scene'] },
  { href: 'wave.html', title: '波動方程式', section: '微分方程式', status: /準備完了/, canvases: ['#scene'] },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

async function apply(page: Page, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) await page.locator(`input[name="${name}"]`).fill(value);
  await page.locator('#apply').click();
  await expect(page.locator('#status')).toHaveText('準備完了');
}

async function runToEnd(page: Page, tab?: string) {
  if (tab) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.locator('#status')).toHaveText('準備完了');
  }
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText(/計算完了|エラー/, { timeout: 40_000 });
}

test('Sturm–Liouville の例は λ₁ ≈ 1、‖φ₁‖² ≈ π/2 で、割線法は二分法より少ない反復で求まる', async ({ page }) => {
  await page.goto('sturm-liouville.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#example-lambda')).toHaveText(/^1\.0000000/);
  await expect(page.locator('#example-norm')).toHaveText('1.5707963');
  await expect(page.locator('#iterations1')).toHaveText('38');
  await expect(page.locator('#eigen-table tbody tr')).toHaveCount(4);
  await page.getByRole('tab', { name: '割線法' }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#iterations1')).toHaveText('6');
  await expect(page.locator('#lambda1')).toHaveText(/^1\.0000000/);
});

test('Lorenz 系の平衡点は (±6√2, ±6√2, 27)、原点の固有値は 11.8277 で、Euler 法と RK4 の軌道は分かれる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('chaos.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#fixed-x')).toHaveText('8.48528');
  await expect(page.locator('#fixed-z')).toHaveText('27.00000');
  await expect(page.locator('#eigen1')).toHaveText('11.8277');
  await expect(page.locator('#eigen3')).toHaveText('-22.8277');
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#status')).toHaveText('計算完了');
  const rk4 = await page.locator('#position').textContent();
  await expect(page.locator('#comparison')).toContainText('t = ');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#position')).not.toHaveText(rk4 ?? '');
});

test('熱伝導の例は r = 0.4 で u(1/2, 5) ≈ 0.60461、r = 0.64 の FTCS 法は発散し Crank–Nicolson 法は発散しない', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('heat.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await apply(page, { steps: '200' });
  await runToEnd(page, 'FTCS法');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#exact-position')).toHaveText('0.60461');
  await expect(page.locator('#velocity')).toHaveText('0.40000');
  await expect(page.locator('#position')).toHaveText('0.60456');
  await runToEnd(page, 'Crank–Nicolson 法');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#position')).toHaveText('0.60464');
  await apply(page, { dt: '0.04', steps: '250' });
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#position')).toHaveText(/^0\.\d+$/);
  await runToEnd(page, 'FTCS法');
  await expect(page.locator('#comparison')).toContainText('r = 0.640');
  const value = Number(await page.locator('#position').textContent());
  expect(Math.abs(value)).toBeGreaterThan(1e6);
});

test('波動の例は t = 8 で u(1/2, 8) = 1、C = 1 では数値解も 1.00000 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('wave.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#exact-position')).toHaveText('1.00000');
  await expect(page.locator('#velocity')).toHaveText('0.80000');
  await apply(page, { dt: '0.04', steps: '200' });
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#position')).toHaveText('1.00000');
  await expect(page.locator('#exact-position')).toHaveText('1.00000');
});
