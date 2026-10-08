import { test, expect, type Page } from '@playwright/test';
import { checkLessonPage } from './lesson-check';

const pages = [
  { href: 'lorentz.html', title: '磁場中の荷電粒子', section: '電磁気学', status: /準備完了/, canvases: ['#scene', '#side-chart', '#speed-chart'] },
  { href: 'faraday.html', title: 'Faraday の電磁誘導の法則', section: '電磁気学', status: /準備完了/, canvases: ['#scene', '#emf-chart', '#current-chart'] },
  { href: 'maxwell.html', title: 'Maxwell 方程式と電磁波', section: '電磁気学', status: /準備完了/, canvases: ['#scene', '#probe-chart'] },
];

for (const item of pages) {
  test(`${item.title}を読む`, async ({ page }) => {
    test.setTimeout(90_000);
    await checkLessonPage(page, item);
  });
}

async function apply(page: Page, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) await page.locator(`input[name="${name}"]`).fill(value);
  await page.locator('#apply').click();
  await expect(page.locator('#status')).toHaveText('準備完了');
}

async function runToEnd(page: Page, tab?: string) {
  if (tab) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.locator('#status')).toHaveText('準備完了');
  }
  await page.locator('#play').click();
  await expect(page.locator('#status')).toHaveText(/計算完了|エラー/, { timeout: 40_000 });
}

test('Boris 法は速さ √1.04 ≈ 1.01980 を保ち、古典的RK4 では速さがわずかに減る', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('lorentz.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#extend')).toHaveText('+t');
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#velocity')).toHaveText('1.01980');
  await expect(page.locator('#comparison')).toContainText('z = 2.52000');
  const boris = await page.locator('#comparison').innerText();
  expect(boris).toMatch(/位置の差 \|r − r_exact\| = 1\.0\de-2/);
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#comparison')).toContainText('速さの変化 |v| − |v₀| = -8.57e-7');
  expect(await page.locator('#comparison').innerText()).not.toBe(boris);
});

test('RL 回路の厳密解は I(10) ≈ 0.14755 で、方法を変えると数値解が変わる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('faraday.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#exact-position')).toHaveText('0.14755');
  await expect(page.locator('#position')).toHaveText('0.16894');
  await expect(page.locator('#comparison')).toContainText('sin(ωh)/(ωh) = 0.998334');
  await runToEnd(page, '古典的RK4');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#position')).toHaveText('0.14755');
  await runToEnd(page, '中点法');
  await expect(page.locator('#position')).toHaveText('0.14687');
});

test('Courant 数 1 の FDTD 法は1周後のパルスを厳密に再現し、S = 0.5 では近似になる', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('maxwell.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#velocity')).toHaveText('1.00000');
  await expect(page.locator('#exact-position')).toHaveText('1.00000');
  await expect(page.locator('#position')).toHaveText('1.00000');
  await apply(page, { dt: '0.025', steps: '400' });
  await runToEnd(page);
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#velocity')).toHaveText('0.50000');
  await expect(page.locator('#position')).toHaveText('0.99768');
});
