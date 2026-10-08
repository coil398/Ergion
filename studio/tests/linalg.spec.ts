import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'elimination.html', title: '連立1次方程式と消去法', section: '線形代数', status: /計算完了/, canvases: ['#trace-chart', '#eps-chart'] },
  { href: 'lu.html', title: 'LU 分解', section: '線形代数', status: /計算完了/, canvases: ['#lu-chart'] },
  { href: 'eigen.html', title: '固有値と固有ベクトル', section: '線形代数', status: /計算完了/, canvases: ['#map-chart', '#error-chart'] },
  { href: 'least-squares.html', title: '最小二乗法', section: '線形代数', status: /計算完了/, canvases: ['#fit-chart', '#projection-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('消去法の3元の例は (2, 3, −1)、ε の例は部分ピボット選択で (1, 1) になる', async ({ page }) => {
  await page.goto('elimination.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#x3')).toHaveText('(2, 3, −1)');
  await expect(page.locator('#residual3')).toHaveText('0');
  await expect(page.locator('#eps-x')).toHaveText('(0, 1)');
  await expect(page.locator('#eps-residual')).toHaveText('1');
  await page.getByRole('tab', { name: '部分ピボット選択' }).click();
  await expect(page.locator('#eps-x')).toHaveText('(1, 1)');
  await expect(page.locator('#eps-residual')).toHaveText('0');
});

test('LU 分解の乗数 l21 は 2/3 の近似 0.666667 で、残差は小さい', async ({ page }) => {
  await page.goto('lu.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#lu-l21')).toHaveText('0.666667');
  await expect(page.locator('#lu-residual')).toHaveText(/e−1[5-6]$/);
});

test('ベキ乗法の λ(1) は 79/29、QR 法の (A1)11 は 37/17 になる', async ({ page }) => {
  await page.goto('eigen.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  const row = (k: number) => page.locator('#iterates tbody tr').nth(k).locator('td');
  await expect(row(0).nth(3)).toHaveText('3.5');
  await expect(row(1).nth(3)).toHaveText('2.72414');
  await expect(page.locator('#exact')).toHaveText('3');
  await page.getByRole('tab', { name: 'QR 法' }).click();
  await expect(row(1).nth(1)).toHaveText('2.17647');
  await expect(row(1).nth(3)).toHaveText('0.705882');
  await expect(page.locator('#second-label')).toContainText('(A₁₅)₂₂');
});

test('最小二乗の直線は b = 0.8 + t、条件数は QR 分解で平方根になる', async ({ page }) => {
  await page.goto('least-squares.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#c0')).toHaveText(/^0\.(8|7999)/);
  await expect(page.locator('#residual2')).toHaveText(/^0\.(8|7999)/);
  await expect(page.locator('#kappa')).toHaveText('22.4555');
  const normalError = await page.locator('#shifted-error').textContent();
  await page.getByRole('tab', { name: 'QR 分解（Householder 変換）' }).click();
  await expect(page.locator('#kappa')).toHaveText('4.73872');
  await expect(page.locator('#c1')).toHaveText('1');
  await expect(page.locator('#shifted-error')).not.toHaveText(normalError ?? '');
});
