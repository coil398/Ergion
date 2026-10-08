import { test, expect } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'nvt.html', title: 'NVT アンサンブルと熱浴法', section: '分子動力学', status: /計算完了/, canvases: ['#nvt-chart'] },
  { href: 'neighbor-list.html', title: '近接リスト法とセル分割法', section: '分子動力学', status: /計算完了/, canvases: ['#cell-chart'] },
  { href: 'hellmann-feynman.html', title: 'Hellmann–Feynman の定理', section: '分子動力学', status: /計算完了/, canvases: ['#force-chart'], proof: true },
  { href: 'first-principles.html', title: '第一原理分子動力学', section: '分子動力学', status: /計算完了/, canvases: ['#verlet-chart'] },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

test('Berendsen の例は λ = 1/2、速度の x 成分は 1 になる', async ({ page }) => {
  await page.goto('nvt.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#nvt-lambda')).toHaveText('0.500000');
  await expect(page.locator('#nvt-scaled')).toHaveText('1.000000');
});

test('セル 2 と、最小イメージの距離 0.3 の対が1組になる', async ({ page }) => {
  await page.goto('neighbor-list.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#cell-index')).toHaveText('2');
  await expect(page.locator('#pair-distance')).toHaveText('0.300000');
  await expect(page.locator('#pair-count')).toHaveText('1');
});

test('点状の電子の力は −√2/4 の小数になる', async ({ page }) => {
  await page.goto('hellmann-feynman.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#hf-force')).toHaveText('−0.353553390593');
});

test('一定加速度の1ステップは x = 1.875、v = −1/2 で、二つの力の差は 10⁻⁴ より小さい', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('first-principles.html');
  await expect(page.locator('#status')).toHaveText('計算完了', { timeout: 30_000 });
  await expect(page.locator('#fp-x')).toHaveText('1.875000');
  await expect(page.locator('#fp-v')).toHaveText('−0.500000');
  await expect(page.locator('#fp-half')).toHaveText('−0.250000');
  const difference = Number((await page.locator('#fp-diff').textContent())!.replace('−', '-'));
  expect(difference).toBeLessThan(1e-4);
});
