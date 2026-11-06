import { test, expect, type Page } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'lennard-jones.html', title: 'Lennard–Jones ポテンシャル', section: '分子動力学', status: /準備完了/, canvases: ['#scene', '#potential-chart'] },
  { href: 'periodic.html', title: '周期境界条件と最小イメージ法', section: '分子動力学', status: /準備完了/, canvases: ['#scene'], proof: true },
  { href: 'nve.html', title: 'NVE アンサンブルと速度 Verlet 法', section: '分子動力学', status: /準備完了/, canvases: ['#scene', '#energy-chart'], proof: true },
  { href: 'observables.html', title: '温度・圧力・動径分布関数', section: '分子動力学', status: /準備完了/, canvases: ['#scene'] },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

async function playToEnd(page: Page, timeout = 30_000) {
  await expect(page.locator('#status')).toHaveText('準備完了', { timeout: 20_000 });
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout });
}

async function shown(page: Page, selector: string): Promise<number> {
  return Number((await page.locator(selector).textContent())!.replace('−', '-'));
}

test('Lennard–Jones の例は V(r₀) = −1、V(2.5) = −0.016316891136、2原子の E₀ = −3/4 になる', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('lennard-jones.html');
  await expect(page.locator('#lj-v-r0')).toHaveText('−1.000000000000');
  await expect(page.locator('#lj-r0')).toHaveText('1.122462');
  await expect(page.locator('#lj-v-rc')).toHaveText('−0.016316891136');
  await expect(page.locator('#lj-f-rc')).toHaveText('−0.0389994774528');
  await expect(page.locator('#exact-position')).toHaveText('-0.75000');
  await playToEnd(page);
  await expect(page.locator('#comparison')).toContainText('r_max 1.259921');
  const verlet = Math.abs(await shown(page, '#energy-error'));
  expect(verlet).toBeLessThan(5e-4);
  await page.getByRole('tab', { name: 'Euler法' }).click();
  await playToEnd(page);
  const euler = Math.abs(await shown(page, '#energy-error'));
  expect(euler).toBeGreaterThan(0.1);
});

test('最小イメージの例は (−2, 2, 0)、距離 2√2 ≈ 2.828427 で、27個の鏡像との差は 0 になる', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('periodic.html');
  await expect(page.locator('#pbc-wrap-a')).toHaveText('2.300000');
  await expect(page.locator('#pbc-wrap-b')).toHaveText('9.600000');
  await expect(page.locator('#pbc-distance')).toHaveText('2.828427');
  await expect(page.locator('#pbc-brute')).toHaveText('2.828427');
  await playToEnd(page);
  await expect(page.locator('#energy-error')).toHaveText('0.00e+0');
  await expect(page.locator('#comparison')).toContainText('ペアの数 15');
  expect(await shown(page, '#velocity')).toBeLessThan(10);
});

test('NVE の例は N = 108、E₀ ≈ −414.13602 で、速度 Verlet 法は保存し Euler法は増える', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('nve.html');
  await expect(page.locator('#exact-position')).toHaveText('-414.13602', { timeout: 20_000 });
  await playToEnd(page);
  await expect(page.locator('#comparison')).toContainText('粒子数 N 108');
  const verlet = Math.abs(await shown(page, '#energy-error'));
  expect(verlet).toBeLessThan(0.05);
  await page.getByRole('tab', { name: 'Euler法' }).click();
  await playToEnd(page);
  const euler = await shown(page, '#energy-error');
  expect(euler).toBeGreaterThan(100);
});

test('2原子の配置は T = 2/3、P ≈ 0.0093463332 で、既定の実行は13個のブロックになる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('observables.html');
  await expect(page.locator('#obs-temperature')).toHaveText('0.666667');
  await expect(page.locator('#obs-virial')).toHaveText('24.0389994774528');
  await expect(page.locator('#obs-pressure')).toHaveText('0.0093463332');
  await playToEnd(page, 60_000);
  await expect(page.locator('#comparison')).toContainText('ブロックの数 13');
  const temperature = await shown(page, '#position');
  expect(temperature).toBeGreaterThan(0.8);
  expect(temperature).toBeLessThan(0.92);
});
