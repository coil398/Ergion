import { test, expect, type Page } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'hamilton.html', title: 'Legendre 変換と Hamilton の正準方程式', section: '解析力学', status: /準備完了/, canvases: ['#scene', '#phase-chart', '#energy-chart'] },
  { href: 'liouville.html', title: '相空間と Liouville の定理', section: '解析力学', status: /準備完了/, canvases: ['#scene', '#area-chart'], proof: true },
  { href: 'poisson.html', title: '正準変換と Poisson 括弧', section: '解析力学', status: /計算完了/, canvases: ['#ellipse-chart', '#circle-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

async function runToEnd(page: Page, tab?: string) {
  if (tab) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.locator('#status')).toHaveText('準備完了');
  }
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText(/計算完了|エラー/, { timeout: 40_000 });
}

test('シンプレクティック Euler 法の1ステップは θ₁ ≈ 0.99159、p₁ ≈ −0.08415 で、方法を変えるとエネルギーの誤差が変わる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('hamilton.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#extend')).toHaveText('+t');
  await page.locator('#step').click();
  await expect(page.locator('#position')).toHaveText('0.99159');
  await expect(page.locator('#velocity')).toHaveText('-0.08415');
  await page.locator('#reset').click();
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#comparison')).toContainText('厳密な E = 0.459698');
  await expect(page.locator('#comparison')).toContainText('最大の |H − E| = 2.26e-2');
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#comparison')).toContainText('最大の |H − E| = 1.45e-6');
  await runToEnd(page, '速度 Verlet 法');
  await expect(page.locator('#comparison')).toContainText('最大の |H − E| = 1.06e-3');
});

test('初めの面積は 50 sin(π/200) ≈ 0.78537 で、Euler 法では広がり、シンプレクティック Euler 法では保たれる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('liouville.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#exact-position')).toHaveText('0.78537');
  await expect(page.locator('#comparison')).toContainText('Euler 法の1ステップの倍率（中心 θ_c）= 1.001351');
  await runToEnd(page);
  await expect(page.locator('#velocity')).toHaveText('1.83252');
  await runToEnd(page, 'シンプレクティック Euler 法');
  await expect(page.locator('#velocity')).toHaveText('0.99993');
  await expect(page.locator('#comparison')).toContainText('∇·F = 0.00e+0');
});

test('{L_x, L_y} は L_z = −3 に、{θ, I} は 1 に一致する', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('poisson.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#example-lxly')).toHaveText('-3.000000000');
  await expect(page.locator('#bracket-qp')).toHaveText('1.000000000');
  const angle = Number(await page.locator('#example-angle').innerText());
  expect(Math.abs(angle - 1)).toBeLessThan(1e-7);
  await expect(page.locator('#angular-table tbody tr')).toHaveCount(4);
});
