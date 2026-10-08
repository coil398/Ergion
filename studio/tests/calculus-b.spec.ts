import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'taylor.html', title: 'Taylor 展開', section: '微分積分', status: /計算完了/, canvases: ['#taylor-chart', '#remainder-chart'], proof: true },
  { href: 'partial.html', title: '偏微分', section: '微分積分', status: /計算完了/, canvases: ['#contour-chart', '#slice-chart'], proof: true },
  { href: 'multiple-integral.html', title: '重積分', section: '微分積分', status: /計算完了/, canvases: ['#square-chart', '#disk-chart'] },
  { href: 'numerical-differentiation.html', title: '数値微分', section: '微分積分', status: /計算完了/, canvases: ['#chord-chart', '#error-chart'], proof: true },
  { href: 'numerical-integration.html', title: '数値積分', section: '微分積分', status: /計算完了/, canvases: ['#area-chart', '#error-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('Taylor 展開の例は P₃(1) = 8/3 で、次数のタブで値が変わる', async ({ page }) => {
  await page.goto('taylor.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.getByRole('tab', { name: 'n = 3' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#polynomial')).toHaveText('2.666667');
  await expect(page.locator('#difference')).toHaveText('0.051615');
  await expect(page.locator('#bound')).toHaveText('0.113262');
  await expect(page.getByRole('link', { name: 'べき級数' })).toHaveAttribute('href', './series.html');
  await page.getByRole('tab', { name: 'n = 1' }).click();
  await expect(page.locator('#polynomial')).toHaveText('2.000000');
});

test('偏微分の例は点 (1, 2) で勾配 (8, 3)、中心差分は 8、前進差分は 8.1', async ({ page }) => {
  await page.goto('partial.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#gradient')).toHaveText('(8, 3)');
  await expect(page.locator('#difference')).toHaveText('0.100000');
  await expect(page.locator('#central-x')).toHaveText('8.000000');
  await expect(page.locator('#central-y')).toHaveText('3.000000');
  await expect(page.locator('#partial-table tr').first()).toContainText('8.100000');
});

test('重積分の例は xy の中点和 1/4、n = 4 の円板の格子和 3、極座標の和 π', async ({ page }) => {
  await page.goto('multiple-integral.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.getByRole('tab', { name: 'n = 4' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#square-sum')).toHaveText('0.250000');
  await expect(page.locator('#disk-grid')).toHaveText('3.000000');
  await expect(page.locator('#polar-sum')).toHaveText('3.141593');
  await page.getByRole('tab', { name: 'n = 8' }).click();
  await expect(page.locator('#disk-grid')).toHaveText('3.250000');
  await expect(page.locator('#square-sum')).toHaveText('0.250000');
});

test('数値微分の例は h = 0.1 で前進差分 0.497364、中心差分 0.539402', async ({ page }) => {
  await page.goto('numerical-differentiation.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#exact')).toHaveText('0.540302');
  await expect(page.locator('#value')).toHaveText('0.497364');
  await expect(page.locator('#slope')).toHaveText(/^(0\.9\d\d|1\.0\d\d)$/);
  await page.getByRole('tab', { name: '中心差分' }).click();
  await expect(page.locator('#value')).toHaveText('0.539402');
  await expect(page.locator('#difference')).toHaveText('-0.000900');
  await expect(page.locator('#slope')).toHaveText(/^(1\.9\d\d|2\.0\d\d)$/);
});

test('数値積分の例は n = 4 で台形則 1.896119、Simpson 則 2.004560、誤差の比は約 1/4 と 1/16', async ({ page }) => {
  await page.goto('numerical-integration.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.getByRole('tab', { name: '台形則' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#approx')).toHaveText('1.896119');
  await expect(page.locator('#ratio')).toHaveText('0.2481');
  await expect(page.locator('#integration-table tr').last()).toContainText('0.2500');
  await page.getByRole('tab', { name: 'Simpson 則' }).click();
  await expect(page.locator('#approx')).toHaveText('2.004560');
  await expect(page.locator('#ratio')).toHaveText('0.0590');
  await expect(page.locator('#integration-table tr').last()).toContainText('0.0625');
});
