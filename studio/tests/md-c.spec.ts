import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'born-oppenheimer.html', title: 'Born–Oppenheimer 近似', section: '分子動力学', status: /計算完了/, canvases: ['#curve-chart', '#orbital-chart'], proof: true },
  { href: 'kohn-sham.html', title: '密度汎関数理論と Kohn–Sham 方程式', section: '分子動力学', status: /準備完了/, canvases: ['#scene'], proof: true },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('3点の箱の最も低い固有値は 1 − √2/2、平衡距離はタブによらない', async ({ page }) => {
  await page.goto('born-oppenheimer.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#example-e1')).toHaveText('0.2928932');
  const golden = Number(await page.locator('#r-e').textContent());
  const goldenIterations = await page.locator('#iterations').textContent();
  expect(golden).toBeGreaterThan(2.1);
  expect(golden).toBeLessThan(2.3);
  await page.getByRole('tab', { name: '放物線の Newton 法' }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#iterations')).not.toHaveText(goldenIterations!);
  const newton = Number(await page.locator('#r-e').textContent());
  expect(Math.abs(newton - golden)).toBeLessThan(1e-5);
  await expect(page.locator('#box-table tbody tr')).toHaveCount(4);
});

test('SCF の反復は +t と再生を持ち、V_nn = 1/√3.25 を示し、α で収束が変わる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('kohn-sham.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (const name of ['再生', '一時停止', 'ループ再生', '+t']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('#example-vnn')).toHaveText('0.5547002');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 30_000 });
  await expect(page.locator('#example-electrons')).toHaveText('2.0000000000');
  const fast = Number(await page.locator('#example-change').textContent());
  await page.getByRole('tab', { name: '線形混合 α = 0.3' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 30_000 });
  const slow = Number(await page.locator('#example-change').textContent());
  expect(fast).toBeLessThan(slow / 100);
  await expect(page.locator('#energy-table tbody tr')).toHaveCount(6);
});
