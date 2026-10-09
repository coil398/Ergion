import { expect, type Page } from '@playwright/test';

export const banned = ['正本', 'source of truth', '計算核', '実験台', '乖離', '集約', 'f64', '.lean', 'crates/', 'Lean のファイル', 'つながり', '確認済', '換算単位', '公開の前', '式を満たす関数', '配色', '明るい', '暗い', '端末', '暗くする', '明るくする', '誤差は実線', '計算時間を延ばす', '計算時間', 'CLI', '変更した条件は、適用後の新しい計算に使います。', '同じJSON設定をCLIでも使えます。', '途中の計算状態は保存しません。', '現在の条件で実行できます。'];

export interface LessonPage {
  href: string;
  title: string;
  section: string;
  /** 計算が終わったか、再生の準備ができたことを示す状態の文字。 */
  status?: RegExp;
  /** 数値解の色で描かれていなければならない canvas。 */
  canvases?: string[];
  proof?: boolean;
}

async function openingHasInk(page: Page) {
  return page.locator('#opening-chart').evaluate((canvas: HTMLCanvasElement) => {
    if (canvas.width < 2 || canvas.height < 2) return false;
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 20) return true;
    return false;
  });
}

/** 単元のページの読み順、図、配色、文言を確かめる。 */
export async function checkLessonPage(page: Page, item: LessonPage) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(item.href);
    await expect(page.getByRole('heading', { level: 1, name: `${item.title}.` })).toBeVisible();
    await expect(page.locator('.intro .equation')).toHaveCount(0);
    await expect(page.locator('#study .equation-plate, #study .solution-equation').first()).toBeVisible();
    await expect(page.getByRole('button', { name: item.section, exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.rail-page.active')).toHaveText(item.title);
    await expect(page.locator('#status')).toHaveText(item.status ?? /計算完了|準備完了/, { timeout: 20_000 });
    const order = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const at = (selector: string) => main.querySelector(selector);
      const before = (a: Element | null, b: Element | null) => Boolean(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
      const proof = at('.proof');
      return {
        chartAfterTitle: before(at('.intro'), at('.page-figure')),
        figureBeforeSteps: before(at('.page-figure'), at('#study')),
        figureExample: before(at('.page-figure'), at('#example')),
        noIntroEquation: document.querySelectorAll('.intro .equation').length === 0,
        exampleRelated: before(at('#example'), at('#related')),
        proofLast: !proof || main.lastElementChild === proof,
        hasProof: Boolean(proof),
        fits: document.documentElement.scrollWidth <= window.innerWidth,
        text: document.body.innerText,
      };
    });
    expect(order.chartAfterTitle, item.href).toBe(true);
    expect(order.figureBeforeSteps, item.href).toBe(true);
    expect(order.noIntroEquation, item.href).toBe(true);
    expect(order.figureExample, item.href).toBe(true);
    expect(order.exampleRelated, item.href).toBe(true);
    expect(order.proofLast, item.href).toBe(true);
    expect(order.hasProof, item.href).toBe(Boolean(item.proof));
    expect(order.fits, `${item.href} ${width}`).toBe(true);
    for (const word of banned) expect(order.text, `${item.href} ${word}`).not.toContain(word);
    await expect(page.locator('main .quiet-label')).toHaveCount(0);
    await expect(page.locator('#related .panel-heading')).toHaveText('関連ページ');
    for (const item of await page.locator('#related li').all()) {
      expect((await item.innerText()).trim()).toBe((await item.locator('a').innerText()).trim());
    }
    await page.locator('.page-figure').scrollIntoViewIfNeeded();
    await expect.poll(() => openingHasInk(page), item.href).toBe(true);
    for (const selector of item.canvases ?? []) {
      await expect.poll(() => page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
        const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        let count = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 250 && Math.abs(data[i] - 0) < 3 && Math.abs(data[i + 1] - 49) < 3 && Math.abs(data[i + 2] - 83) < 3) count += 1;
        return count;
      }), `${item.href} ${selector}`).toBeGreaterThan(0);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => openingHasInk(page), `${item.href} dark`).toBe(true);
  }
  await page.emulateMedia({ colorScheme: 'light' });
}
