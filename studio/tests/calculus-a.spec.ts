import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'limits.html', title: '極限と連続', section: '微分積分', status: /計算完了/, canvases: ['#curve-chart', '#zoom-chart'], proof: true },
  { href: 'derivative-definition.html', title: '微分の定義', section: '微分積分', status: /計算完了/, canvases: ['#secant-chart', '#quotient-chart'], proof: true },
  { href: 'product-chain.html', title: '積の微分と合成関数の微分', section: '微分積分', status: /計算完了/, canvases: ['#product-chart', '#chain-chart'], proof: true },
  { href: 'mean-value.html', title: '平均値の定理', section: '微分積分', status: /計算完了/, canvases: ['#mvt-chart', '#newton-chart'], proof: true },
  { href: 'fundamental-theorem.html', title: '定積分と微分積分学の基本定理', section: '微分積分', status: /計算完了/, canvases: ['#rect-chart', '#sum-chart'], proof: true },
  { href: 'integration-techniques.html', title: '置換積分と部分積分', section: '微分積分', status: /計算完了/, canvases: ['#before-chart', '#after-chart', '#parts-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('極限の例は h = 0.1 で sin h / h = 0.9983341665、ε = 0.05 で δ = √0.3', async ({ page }) => {
  await page.goto('limits.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#ratio')).toHaveText('0.9983341665');
  await expect(page.locator('#bound')).toHaveText('0.0016666667');
  await expect(page.locator('#delta')).toHaveText('0.547723');
});

test('微分の定義の例は a = 1、h = 0.1 で差分商 2.1、差 0.1', async ({ page }) => {
  await page.goto('derivative-definition.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#slope')).toHaveText('2.000000');
  await expect(page.locator('#quotient')).toHaveText('2.100000');
  await expect(page.locator('#gap')).toHaveText('0.100000');
  await expect(page.getByRole('link', { name: '位置の時間微分' })).toHaveAttribute('href', './derivative.html');
});

test('積と合成関数の例は x = 1 で 2 sin 1 + cos 1 と 2e', async ({ page }) => {
  await page.goto('product-chain.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#product-exact')).toHaveText('2.223244');
  await expect(page.locator('#chain-exact')).toHaveText('5.436564');
  await expect(page.locator('#chain-central')).toHaveText('5.527883');
});

test('平均値の定理の例は m = 4、c = 2/√3 で、ニュートン法の c₁ = 7/6', async ({ page }) => {
  await page.goto('mean-value.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#slope')).toHaveText('4.000000');
  await expect(page.locator('#c-exact')).toHaveText('1.154700538379');
  await expect(page.locator('#newton-table')).toContainText('1.166666666667');
});

test('基本定理の例は n = 4 で左端 7/32、右端 15/32、中点 21/64', async ({ page }) => {
  await page.goto('fundamental-theorem.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.getByRole('tab', { name: '左端 Riemann 和' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sum')).toHaveText('0.218750');
  await expect(page.getByRole('link', { name: '積分して解く' })).toHaveAttribute('href', './integrate.html');
  await page.getByRole('tab', { name: '右端 Riemann 和' }).click();
  await expect(page.locator('#sum')).toHaveText('0.468750');
  await page.getByRole('tab', { name: '中点 Riemann 和' }).click();
  await expect(page.locator('#sum')).toHaveText('0.328125');
});

test('置換積分と部分積分の例は Simpson 則 n = 2 で 1.762111、1.718861、1.002621', async ({ page }) => {
  await page.goto('integration-techniques.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#before')).toHaveText('1.762111');
  await expect(page.locator('#after')).toHaveText('1.718861');
  await expect(page.locator('#sub-exact')).toHaveText('1.718282');
  await expect(page.locator('#direct')).toHaveText('1.002621');
});
