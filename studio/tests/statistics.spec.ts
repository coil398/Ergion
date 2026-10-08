import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'sample-stats.html', title: '標本・平均・分散', section: '統計学', status: /計算完了/, canvases: ['#dots-chart'], proof: true },
  { href: 'limit-theorems.html', title: '大数の法則と中心極限定理', section: '統計学', status: /計算完了/, canvases: ['#running-chart'], proof: true },
  { href: 'regression.html', title: '線形回帰', section: '統計学', status: /計算完了/, canvases: ['#fit-chart'], proof: true },
  { href: 'monte-carlo.html', title: 'Monte Carlo 法', section: '統計学', status: /準備完了/, canvases: ['#scene'], proof: true },
  { href: 'pca.html', title: '主成分分析', section: '統計学', status: /計算完了/, canvases: ['#pca-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('標本 2, 4, 4, 4, 5, 5, 7, 9 は x̄ = 5、s² = 32/7 で、タブで表が変わる', async ({ page }) => {
  await page.goto('sample-stats.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#mean')).toHaveText('5.000000');
  await expect(page.locator('#variance')).toHaveText('4.571429');
  await expect(page.locator('#sd')).toHaveText('2.138090');
  await expect(page.locator('#table-heading')).toContainText('二パスの公式');
  await expect(page.locator('#stats-table')).toContainText('16');
  await expect(page.locator('#stats-table')).not.toContainText('3.333333');
  await page.getByRole('tab', { name: 'Welford の逐次更新' }).click();
  await expect(page.locator('#table-heading')).toContainText('Welford');
  await expect(page.locator('#stats-table')).toContainText('3.333333');
  await expect(page.locator('#stats-table')).toContainText('32.000000');
  await expect(page.locator('#variance')).toHaveText('4.571429');
});

test('大数の法則の例は σ² = 1、n = 30、ε = 0.5 で Chebyshev の上界 2/15 ≈ 0.133333 になる', async ({ page }) => {
  await page.goto('limit-theorems.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#chebyshev')).toHaveText('0.133333');
  await expect(page.locator('#deviation')).toContainText('13 / 2000');
});

test('線形回帰の例は β̂₁ = 0.6、β̂₀ = 2.2、R² = 0.6、Σeᵢ² = 2.4 になる', async ({ page }) => {
  await page.goto('regression.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#slope')).toHaveText('0.600000');
  await expect(page.locator('#intercept')).toHaveText('2.200000');
  await expect(page.locator('#r2')).toHaveText('0.600000');
  await expect(page.locator('#rss')).toHaveText('2.400000');
  await expect(page.getByRole('link', { name: '最小二乗法' })).toHaveAttribute('href', './least-squares.html');
});

test('Monte Carlo 法は+t を持ち、種 1 で N = 4020 のとき N_in = 3206、π̂ ≈ 3.19005 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('monte-carlo.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (const name of ['再生', '一時停止', 'ループ再生', '+t']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('#exact-position')).toHaveText('3.14159');
  await expect(page.locator('#comparison')).toContainText('擬似乱数の種 1');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 40_000 });
  await expect(page.locator('#comparison')).toContainText('点の数 N 4020');
  await expect(page.locator('#comparison')).toContainText('内側の点の数 N_in 3206');
  await expect(page.locator('#position')).toHaveText('3.19005');
});

test('主成分分析の例は λ₁ = 14、λ₂ = 1 で、第1主成分の寄与率は 14/15 ≈ 0.933333 になる', async ({ page }) => {
  await page.goto('pca.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#lambda1')).toHaveText('14.000000');
  await expect(page.locator('#lambda2')).toHaveText('1.000000');
  await expect(page.locator('#ratio1')).toHaveText('0.933333');
  await expect(page.getByRole('link', { name: '固有値と固有ベクトル' })).toHaveAttribute('href', './eigen.html');
});
