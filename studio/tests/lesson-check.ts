import { expect, type Page } from '@playwright/test';

export const banned = ['正本', 'source of truth', '計算核', '実験台', '乖離', '集約', 'f64', '.lean', 'crates/', 'Lean のファイル'];

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

async function visibleFigure(page: Page) {
  return page.locator('.page-figure img').evaluateAll(images => images
    .filter(image => image.getBoundingClientRect().width > 0)
    .map(image => ({ src: (image as HTMLImageElement).currentSrc, loaded: (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0 })));
}

/** 単元のページの読み順、図、配色、文言を確かめる。 */
export async function checkLessonPage(page: Page, item: LessonPage) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(item.href);
    await expect(page.getByRole('heading', { level: 1, name: `${item.title}.` })).toBeVisible();
    await expect(page.locator('.equation .katex').first()).toBeVisible();
    await expect(page.getByRole('button', { name: item.section, exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.rail-page.active')).toHaveText(item.title);
    await expect(page.locator('#status')).toHaveText(item.status ?? /計算完了|準備完了/, { timeout: 20_000 });
    const order = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const at = (selector: string) => main.querySelector(selector);
      const before = (a: Element | null, b: Element | null) => Boolean(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
      const proof = at('.proof');
      return {
        equationSteps: before(at('.equation'), at('#study .solution')),
        stepsFigure: before(at('#study'), at('.page-figure')),
        figureExample: before(at('.page-figure'), at('#example')),
        exampleRelated: before(at('#example'), at('#related')),
        proofLast: !proof || main.lastElementChild === proof,
        hasProof: Boolean(proof),
        fits: document.documentElement.scrollWidth <= window.innerWidth,
        text: document.body.innerText,
      };
    });
    expect(order.equationSteps, item.href).toBe(true);
    expect(order.stepsFigure, item.href).toBe(true);
    expect(order.figureExample, item.href).toBe(true);
    expect(order.exampleRelated, item.href).toBe(true);
    expect(order.proofLast, item.href).toBe(true);
    expect(order.hasProof, item.href).toBe(Boolean(item.proof));
    expect(order.fits, `${item.href} ${width}`).toBe(true);
    for (const word of banned) expect(order.text, `${item.href} ${word}`).not.toContain(word);
    await page.locator('.page-figure').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await visibleFigure(page)).every(image => image.loaded) && (await visibleFigure(page)).length === 1, item.href).toBe(true);
    const light = (await visibleFigure(page))[0].src;
    expect(light).toMatch(width === 390 ? /figure-narrow\.png$/ : /figure\.png$/);
    for (const selector of item.canvases ?? []) {
      await expect.poll(() => page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
        const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        let count = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 250 && Math.abs(data[i] - 0) < 3 && Math.abs(data[i + 1] - 49) < 3 && Math.abs(data[i + 2] - 83) < 3) count += 1;
        return count;
      }), `${item.href} ${selector}`).toBeGreaterThan(0);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await visibleFigure(page))[0]?.src ?? '').toMatch(width === 390 ? /figure-dark-narrow\.png$/ : /figure-dark\.png$/);
  }
  await page.emulateMedia({ colorScheme: 'light' });
}
