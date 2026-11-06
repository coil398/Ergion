import { test, expect, type Page } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'constraints.html', title: '拘束条件と一般化座標', section: '解析力学', status: /計算完了/, canvases: ['#sphere-chart', '#error-chart'] },
  { href: 'virtual-work.html', title: "仮想仕事の原理と d'Alembert の原理", section: '解析力学', status: /準備完了/, canvases: ['#scene', '#work-chart'] },
  { href: 'euler-lagrange.html', title: '最小作用の原理と Euler–Lagrange 方程式', section: '解析力学', status: /準備完了/, canvases: ['#scene', '#action-chart'], proof: true },
  { href: 'noether.html', title: '対称性と保存則', section: '解析力学', status: /準備完了/, canvases: ['#scene', '#energy-chart'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

async function runToEnd(page: Page, tab: string) {
  await page.getByRole('tab', { name: tab }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 60_000 });
}

test('球面の例は自由度 2、中心差分の誤差は約 2.886751e-7 で、h を2倍にすると約4倍になる', async ({ page }) => {
  await page.goto('constraints.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#dof')).toHaveText('2');
  await expect(page.locator('#example-error')).toHaveText(/^2\.88675\de-7$/);
  await expect(page.locator('#error-ratio')).toHaveText(/^(3\.99\d\d|4\.00\d\d)$/);
  await expect(page.locator('#jacobian-table tbody tr').first()).toContainText('0.866025404');
});

test('斜面の例は F ≈ 11.31607、t = 2 で s = 9.8、Euler 法は 9.751 になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('virtual-work.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (const name of ['再生', '一時停止', 'ループ再生', '+t', '-t']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('#holding-force')).toHaveText('11.31607');
  await expect(page.locator('#normal-force')).toHaveText('16.97410');
  await runToEnd(page, '中点法');
  await expect(page.locator('#exact-position')).toHaveText('9.80000');
  await expect(page.locator('#position')).toHaveText('9.80000');
  await expect(page.locator('#comparison')).toContainText('加速度 g sin α 4.90000');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#position')).toHaveText('9.75100');
});

test('単振子の例は T ≈ 7.4162987、RK4 の測った周期は 7.41630、Euler 法は延びる', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('euler-lagrange.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#example-period')).toHaveText('K ≈ 1.8540747、T ≈ 7.4162987');
  const slope = Number(await page.locator('#slope').textContent());
  expect(Math.abs(slope)).toBeLessThan(1e-4);
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#comparison')).toContainText('横切りから測った周期 7.41630');
  await expect(page.locator('#comparison')).toContainText('厳密な周期 7.41630');
  await expect(page.locator('#comparison')).toContainText('0 を横切った回数 4');
  await runToEnd(page, 'Euler法');
  await expect(page.locator('#comparison')).toContainText('横切りから測った周期 7.50476');
});

test('中心力の例は E₀ = −0.395、速度 Verlet 法は L = 1.1 を保ち、RK4 はエネルギーが減る', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('noether.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#exact-position')).toHaveText('-0.39500');
  await expect(page.locator('#velocity')).toHaveText('1.10000');
  await page.locator('input[name="steps"]').fill('1500');
  await page.locator('#apply').click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 60_000 });
  const rk4 = Number(await page.locator('#energy-error').textContent());
  expect(rk4).toBeLessThan(-4e-3);
  await expect(page.locator('#velocity')).not.toHaveText('1.10000');
  await runToEnd(page, '速度 Verlet 法');
  await expect(page.locator('#velocity')).toHaveText('1.10000');
  const verlet = Number(await page.locator('#energy-error').textContent());
  expect(Math.abs(verlet)).toBeLessThan(6e-3);
  const text = await page.locator('#comparison').textContent() ?? '';
  expect(Math.abs(Number(text.match(/角運動量の差 L − L₀ (\S+)/)![1]))).toBeLessThan(1e-12);
});
