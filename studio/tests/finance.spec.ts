import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'compound.html', title: '連続複利と指数成長', section: '金融数学', status: /計算完了/, canvases: ['#balance-chart'], proof: true },
  { href: 'gbm.html', title: '幾何 Brownian 運動', section: '金融数学', status: /準備完了/, canvases: ['#scene'], proof: true },
  { href: 'black-scholes.html', title: 'Black–Scholes 方程式', section: '金融数学', status: /計算完了/, canvases: ['#price-chart'], proof: true },
  { href: 'mc-pricing.html', title: 'Monte Carlo 価格評価', section: '金融数学', status: /準備完了/, canvases: ['#estimate-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('元本 100、年利率 0.05 の1年後は年複利で 105、月複利で 105.116190、連続複利で 105.127110 になる', async ({ page }) => {
  await page.goto('compound.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#discrete-1')).toHaveText('105.000000');
  await expect(page.locator('#continuous-1')).toHaveText('105.127110');
  await page.getByRole('tab', { name: '月複利' }).click();
  await expect(page.locator('#discrete-1')).toHaveText('105.116190');
  await expect(page.locator('#continuous-1')).toHaveText('105.127110');
  await expect(page.locator('#related').getByRole('link', { name: '変数分離' })).toHaveAttribute('href', './separation.html');
});

test('Black–Scholes 公式は C(100) ≈ 10.450584、Δ ≈ 0.636831 で、差分法の値はタブで変わる', async ({ page }) => {
  await page.goto('black-scholes.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#formula-price')).toHaveText('10.450584');
  await expect(page.locator('#delta')).toHaveText('0.636831');
  await expect(page.locator('#fd-price')).toHaveText('10.448489');
  await page.getByRole('tab', { name: '陽解法' }).click();
  await expect(page.locator('#fd-price')).toHaveText('10.449285');
  await expect(page.locator('#formula-price')).toHaveText('10.450584');
  await expect(page.locator('#related').getByRole('link', { name: '熱伝導方程式' })).toHaveAttribute('href', './heat.html');
  await expect(page.locator('#related').getByRole('link', { name: '連続複利と指数成長' })).toHaveAttribute('href', './compound.html');
});

test('幾何 Brownian 運動は+t を持ち、1ステップの例と、タブごとの経路の差を示す', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('gbm.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (const name of ['再生', '一時停止', 'ループ再生', '+t', '-t']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('#example-em')).toHaveText('101.580000');
  await expect(page.locator('#example-exact')).toHaveText('101.546842');
  await expect(page.locator('#example-gap')).toHaveText('0.033158');
  await expect(page.locator('#comparison')).toContainText('擬似乱数の種 1');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 40_000 });
  await expect(page.locator('#comparison')).toContainText('経路の数 M 1000');
  await expect(page.locator('#comparison')).toContainText('数値解の標本平均 109.621786');
  await expect(page.locator('#comparison')).toContainText(/経路ごとの差の最大値 \d\.\d\de\+0/);
  await page.getByRole('tab', { name: '対数価格の厳密な更新' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 40_000 });
  await expect(page.locator('#comparison')).toContainText(/経路ごとの差の最大値 \d\.\d\de-1\d/);
});

test('Monte Carlo 価格評価は種 1 で M = 10050 の推定値を出し、4個の標本の例は 10.175371 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('mc-pricing.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('button', { name: '+t', exact: true })).toBeVisible();
  await expect(page.locator('#exact-position')).toHaveText('10.45058');
  await expect(page.locator('#example-payoff')).toHaveText('10.697073');
  await expect(page.locator('#example-estimate')).toHaveText('10.175371');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 40_000 });
  await expect(page.locator('#comparison')).toContainText('標本数 M 10050');
  await expect(page.locator('#comparison')).toContainText('推定値 Ĉ_M 10.252736');
  await expect(page.locator('#related').getByRole('link', { name: 'Monte Carlo 法', exact: true })).toHaveAttribute('href', './monte-carlo.html');
});
