import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'coulomb.html', title: 'Coulomb の法則と静電場', section: '電磁気学', status: /計算完了/, canvases: ['#field-chart'] },
  { href: 'potential.html', title: '静電ポテンシャルと電位', section: '電磁気学', status: /計算完了/, canvases: ['#level-chart', '#integrand-chart'], proof: true },
  { href: 'gauss.html', title: 'Gauss の法則', section: '電磁気学', status: /計算完了/, canvases: ['#section-chart'], proof: true },
  { href: 'magnetostatics.html', title: '定常電流と静磁場', section: '電磁気学', status: /計算完了/, canvases: ['#wire-chart', '#axis-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('点 (0, 1) の電場は (√2/2, 0) で、RK4 の電気力線は Ψ をほぼ保つ', async ({ page }) => {
  await page.goto('coulomb.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#field-x')).toHaveText('0.707107');
  await expect(page.locator('#field-y')).toHaveText('0.000000');
  await expect(page.locator('#parts-table tr')).toHaveCount(3);
  const drift = Number(await page.locator('#flux-drift').textContent());
  expect(drift).toBeLessThan(1e-6);
});

test('電位差は 8/3、原点の中心差分は 200/99、Simpson 則 S₂ は 76/27', async ({ page }) => {
  await page.goto('potential.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#difference')).toHaveText('2.666667');
  await expect(page.locator('#central')).toHaveText('2.020202');
  await expect(page.locator('#integral-table tr').first().locator('td').nth(1)).toHaveText('2.814815');
});

test('球面の n = 1 は 2π²、立方体の n = 1 は 24 で、タブで切り替わる', async ({ page }) => {
  await page.goto('gauss.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#exact')).toHaveText('12.566371');
  await expect(page.locator('#flux-one')).toHaveText('19.739209');
  await page.getByRole('tab', { name: '立方体の中点則' }).click();
  await expect(page.locator('#flux-one')).toHaveText('24.000000');
  await expect(page.locator('#status')).toHaveText('計算完了');
});

test('直線導線の N = 1 は 2、厳密な値は √2、Ampère の周回積分は 4π', async ({ page }) => {
  await page.goto('magnetostatics.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#wire-exact')).toHaveText('1.414214');
  await expect(page.locator('#wire-table tr').first().locator('td').nth(1)).toHaveText('2.000000');
  await expect(page.locator('#loop-exact')).toHaveText('6.283185');
  await expect(page.locator('#ampere-enclosing')).toHaveText('12.566371');
});
