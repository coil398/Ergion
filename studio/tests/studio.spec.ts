import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function tex(page: Page, source: string) {
  return page.locator(`xpath=//*[contains(@class,"tex") and @data-tex="${source}"]`);
}

/** 目次の節とページ。学習の順。 */
const expectedRail: [string, string[]][] = [
  ['力学', ['位置の時間微分', '等速直線運動', '等加速度直線運動', '運動方程式と一定の力', '単振動', '減衰振動', '強制振動と共鳴', '中心力場と2体問題']],
  ['微分積分', ['極限と連続', '微分の定義', '積の微分と合成関数の微分', '平均値の定理', '定積分と微分積分学の基本定理', '置換積分と部分積分', 'Taylor 展開', '偏微分', '重積分', '数値微分', '数値積分']],
  ['微分方程式', ['積分して解く', '変数分離', '1階線形', '同次形', '完全微分', 'ベルヌーイ', '定数係数の2階同次', '未定係数法', '定数変化法', 'Laplace 変換', 'べき級数', '連立1階', 'Sturm–Liouville 問題', '非線形力学系とカオス', '熱伝導方程式', '波動方程式']],
  ['数値計算', ['一定速度の増分', 'Euler法', '中点法', '古典的RK4', 'ニュートン法']],
  ['証明', ['証明の一覧']],
  ['線形代数', ['連立1次方程式と消去法', 'LU 分解', '固有値と固有ベクトル', '最小二乗法']],
  ['統計学', ['標本・平均・分散', '大数の法則と中心極限定理', '線形回帰', 'Monte Carlo 法', '主成分分析']],
];

async function expectMechanicsSection(page: Page) {
  const sections = page.locator('.rail-section');
  await expect(sections).toHaveCount(expectedRail.length);
  for (let index = 0; index < expectedRail.length; index += 1) {
    const [label, pages] = expectedRail[index];
    const title = sections.nth(index).locator('.rail-section-title');
    await expect(title).toHaveText(label);
    const links = sections.nth(index).locator('.rail-pages a');
    await expect(links).toHaveCount(pages.length);
    for (let item = 0; item < pages.length; item += 1) await expect(links.nth(item)).toHaveText(pages[item]);
  }
  const titles = page.locator('button.rail-section-title');
  await expect(titles).toHaveCount(expectedRail.length);
  await expect(page.locator('.rail-section-title[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('.rail-section-title[aria-expanded="false"]')).toHaveCount(expectedRail.length - 1);
  const nested = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('.rail-section')];
    return blocks.every((block, index) => {
      const title = block.querySelector('.rail-section-title')!;
      const titleBox = title.getBoundingClientRect();
      const expanded = title.getAttribute('aria-expanded') === 'true';
      const items = [...block.querySelectorAll('.rail-pages a')]
        .map(node => node.getBoundingClientRect())
        .filter(item => item.width > 0 && item.height > 0);
      const belowPrevious = index === 0 || titleBox.top >= blocks[index - 1].getBoundingClientRect().bottom - 1;
      if (!expanded) return items.length === 0 && belowPrevious;
      const under = items.every(item => item.top >= titleBox.bottom - 1 && item.left > titleBox.left + 4);
      const vertical = items.every((item, itemIndex) => itemIndex === 0 || item.top >= items[itemIndex - 1].bottom - 1);
      return items.length > 0 && under && vertical && belowPrevious;
    });
  });
  expect(nested).toBe(true);
}

const palettes = {
  light: { bg: 'rgb(244, 239, 230)', text: 'rgb(28, 25, 21)', plate: 'rgb(232, 223, 208)', numerical: [0, 49, 83], exact: [22, 123, 135], error: [168, 98, 64] },
  dark: { bg: 'rgb(28, 25, 21)', text: 'rgb(244, 239, 230)', plate: 'rgb(44, 40, 36)', numerical: [158, 195, 221], exact: [110, 200, 210], error: [227, 168, 138] },
} as const;

type Scheme = keyof typeof palettes;

async function canvasPixels(page: Page, selector: string, rgb: readonly number[]) {
  return page.locator(selector).evaluate((canvas: HTMLCanvasElement, [r, g, b]) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] >= 250 && Math.abs(data[index] - r) <= 2 && Math.abs(data[index + 1] - g) <= 2 && Math.abs(data[index + 2] - b) <= 2) count += 1;
    }
    return count;
  }, rgb);
}

async function expectScheme(page: Page, scheme: Scheme, canvases: { numerical?: string; exact?: string; error?: string }) {
  const expected = palettes[scheme];
  const other = palettes[scheme === 'light' ? 'dark' : 'light'];
  const colors = await page.evaluate(() => {
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
    return {
      root: getComputedStyle(document.documentElement).backgroundColor,
      text: style('body').color,
      plate: style('.equation').backgroundColor,
      katex: style('.equation .katex').color,
    };
  });
  expect(colors.root).toBe(expected.bg);
  expect(colors.text).toBe(expected.text);
  expect(colors.plate).toBe(expected.plate);
  expect(colors.katex).toBe(expected.text);
  for (const [role, selector] of Object.entries(canvases) as [keyof typeof canvases, string][]) {
    await expect.poll(() => canvasPixels(page, selector, expected[role]), `${selector} ${role} ${scheme}`).toBeGreaterThan(0);
    expect(await canvasPixels(page, selector, other[role]), `${selector} ${role} not ${scheme}`).toBe(0);
  }
}

async function expectTypeSize(page: Page) {
  const type = await page.evaluate(() => {
    const px = (selector: string) => parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize);
    const plate = (selector: string) => getComputedStyle(document.querySelector(selector)!).backgroundColor;
    return {
      body: px('body'),
      solution: px('.solution'),
      equation: px('.equation'),
      katex: px('.equation .katex'),
      heading: px('h1'),
      equationPlate: plate('.equation'),
      stepPlate: plate('.solution-equation'),
      scheme: document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    };
  });
  expect(type.body).toBe(16);
  expect(type.solution).toBe(18);
  expect(type.equation).toBe(18);
  expect(type.katex).toBe(18);
  expect(type.heading).toBe(18);
  const plate = palettes[type.scheme as Scheme].plate;
  expect(type.equationPlate).toBe(plate);
  expect(type.stepPlate).toBe(plate);
}

async function expectSimulationDoc(page: Page, module: string, name: string) {
  const href = `/Ergion/doc/ergion_lab/${module}/struct.${name}.html`;
  const link = page.locator('#study').getByRole('link', { name: '1ステップの説明', exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', href);
  const study = await page.locator('#study').innerText();
  expect(study).not.toContain('crates/');
  expect(study).not.toContain(name);
  const doc = await page.request.get(href);
  expect(doc.ok()).toBeTruthy();
  expect(await doc.text()).toContain(name);
}

test('開始・停止・再開・1ステップと条件の適用', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#position')).toHaveText('0.00000');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#progress-text')).toHaveText('1 / 1,000 ステップ');
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('計算中');
  await expect.poll(async () => page.locator('#scene-time').innerText()).not.toBe('t = 0.010');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('一時停止');
  const stopped = await page.locator('#progress-text').innerText();
  await page.waitForTimeout(180);
  await expect(page.locator('#progress-text')).toHaveText(stopped);
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect.poll(async () => page.locator('#progress-text').innerText()).not.toBe(stopped);
  await page.getByRole('button', { name: '初期状態にリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#progress-text')).toHaveText('0 / 1,000 ステップ');
  await page.locator('[name=initial_position]').fill('2');
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeDisabled();
  await expect(page.locator('#position')).toHaveText('0.00000');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#position')).toHaveText('2.00000');
  await expect(page.locator('#status')).toHaveText('準備完了');
  expect(errors).toEqual([]);
});

test('再生、一時停止、ループ再生、+t', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('uniform.html');
    await expect(page.locator('#status')).toHaveText('準備完了');
    await page.locator('[name=dt]').fill('0.25');
    await page.locator('[name=steps]').fill('24');
    await page.getByRole('button', { name: '条件を適用してリセット' }).click();
    await expect(page.locator('#progress-text')).toHaveText('0 / 24 ステップ');
    const initial = await page.locator('[name=initial_position]').inputValue();
    const velocity = await page.locator('[name=velocity]').inputValue();
    await page.evaluate(() => {
      const node = document.querySelector('#progress-text')!;
      let max = 0;
      const mark = () => {
        const step = Number((node.textContent ?? '0').replace(/,/g, '').split(' / ')[0]);
        if (step > max) max = step;
        if (max >= 18 && step < 4) document.documentElement.dataset.looped = 'yes';
      };
      new MutationObserver(mark).observe(node, { childList: true, subtree: true, characterData: true });
    });
    const loop = page.getByRole('button', { name: 'ループ再生', exact: true });
    await loop.click();
    await expect(loop).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '再生', exact: true }).click();
    await expect(page.locator('#status')).toHaveText('計算中');
    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.looped ?? '')).toBe('yes');
    await page.getByRole('button', { name: '一時停止', exact: true }).click();
    await expect(page.locator('#status')).toHaveText('一時停止');
    const stopped = await page.locator('#progress-text').innerText();
    const held = await page.locator('#position').innerText();
    await page.waitForTimeout(180);
    await expect(page.locator('#progress-text')).toHaveText(stopped);
    await page.getByRole('button', { name: '+t', exact: true }).click();
    await expect(page.locator('#progress-text')).toContainText('/ 48 ステップ');
    await expect(page.locator('#position')).toHaveText(held);
    await expect(page.locator('[name=initial_position]')).toHaveValue(initial);
    await expect(page.locator('[name=velocity]')).toHaveValue(velocity);
    await expect(page.locator('[name=steps]')).toHaveValue('48');
    await expect(page.locator('#extend')).toHaveText('+t');
    const lines = (await page.locator('#comparison').innerText()).split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^解析解との位置の差 \S+$/);
    expect(lines[1]).toMatch(/^速度の差 \S+$/);
    const box = await page.locator('#comparison').boundingBox();
    expect(box!.height).toBeGreaterThan(40);
    await expect(page.locator('.plot-footer')).not.toContainText('誤差は実線');
    const before = await page.locator('#progress-text').innerText();
    await page.getByRole('button', { name: '再生', exact: true }).click();
    await expect.poll(async () => page.locator('#progress-text').innerText()).not.toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('コードはページをまたいで開き、Euler法の TypeScript を実行する', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('euler.html');
    await page.evaluate(() => localStorage.removeItem('ergion-code'));
    await page.reload();
    const disclosure = page.locator('details.code-disclosure');
    await expect(disclosure).toHaveJSProperty('open', false);
    await expect(page.locator('#status')).toHaveText('準備完了');
    await page.locator('details.code-disclosure > summary').click();
    await expect(disclosure).toHaveJSProperty('open', true);
    await expect(page.locator('details.code-disclosure > summary')).toHaveText('コード');
    const typescript = page.getByRole('region', { name: 'TypeScript' });
    const python = page.getByRole('region', { name: 'Python' });
    await expect(typescript.locator('.code-install')).toHaveText('npm install ./studio/wasm');
    await expect(python.locator('.code-install')).toHaveText('pip install ./py/ergion');
    await expect(python.locator('pre')).toContainText('from ergion import euler_step');
    await expect(python.locator('pre')).not.toContainText('pyodide');
    const spinner = typescript.locator('.code-spinner');
    await expect(spinner).toBeHidden();
    await expect(python.locator('.code-spinner')).toBeHidden();
    if (width === 390) {
      await page.evaluate(() => {
        const mark = document.querySelector('[aria-label="TypeScript"] .code-spinner');
        if (!(mark instanceof HTMLElement)) throw new Error('spinner missing');
        const record = () => {
          if (!mark.hidden) (window as unknown as { __ergionSpinnerSeen?: boolean }).__ergionSpinnerSeen = true;
        };
        (window as unknown as { __ergionSpinnerSeen?: boolean }).__ergionSpinnerSeen = !mark.hidden;
        new MutationObserver(record).observe(mark, { attributes: true, attributeFilter: ['hidden'] });
      });
    }
    await typescript.getByRole('button', { name: '実行', exact: true }).click();
    if (width === 390) {
      await expect.poll(() => page.evaluate(() => (window as unknown as { __ergionSpinnerSeen?: boolean }).__ergionSpinnerSeen)).toBe(true);
      expect(await spinner.evaluate(node => getComputedStyle(node).position)).not.toBe('fixed');
    }
    await expect(typescript.locator('.code-result')).toHaveText('[0.1]');
    await expect(spinner).toBeHidden();
    await expect(python.locator('.code-spinner')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto('midpoint.html');
    await page.reload();
    await expect(page.locator('details.code-disclosure')).toHaveJSProperty('open', true);
    await expect(page.getByRole('region', { name: 'TypeScript' }).locator('pre')).toContainText('midpoint_step');
    await expect(page.locator('#status')).toHaveText('準備完了');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto('newton.html');
    await expect(page.locator('details.code-disclosure')).toHaveJSProperty('open', true);
    await expect(page.getByRole('region', { name: 'TypeScript' }).locator('pre')).toContainText('newton_step');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('方程式のページではコードが選んだ数値解法に従う', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('separation.html');
    await page.evaluate(() => localStorage.removeItem('ergion-code'));
    await page.reload();
    const disclosure = page.locator('details.code-disclosure');
    await expect(disclosure).toHaveJSProperty('open', false);
    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveJSProperty('open', true);
    const typescript = page.getByRole('region', { name: 'TypeScript' });
    const python = page.getByRole('region', { name: 'Python' });
    await expect(typescript.locator('.code-install')).toHaveText('npm install ./studio/wasm');
    await expect(python.locator('.code-install')).toHaveText('pip install ./py/ergion');
    await expect(typescript.locator('pre')).toContainText('import init, { euler_step } from "ergion-lab"');
    await expect(python.locator('pre')).toContainText('from ergion import euler_step');
    await page.getByRole('tab', { name: '中点法', exact: true }).click();
    await expect(typescript.locator('pre')).toContainText('import init, { midpoint_step } from "ergion-lab"');
    await expect(typescript.locator('pre')).not.toContainText('euler_step');
    await expect(python.locator('pre')).toContainText('from ergion import midpoint_step');
    await page.getByRole('tab', { name: '古典的RK4', exact: true }).click();
    await expect(typescript.locator('pre')).toContainText('import init, { rk4_step } from "ergion-lab"');
    await expect(python.locator('pre')).toContainText('from ergion import rk4_step');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('NativeとブラウザWasmが一致する', async ({ page }, testInfo) => {
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  const base = JSON.parse(readFileSync(resolve(root, 'examples/uniform_motion.json'), 'utf8'));
  const config = { ...base, steps: 300, dt: 0.01 };
  const configPath = testInfo.outputPath('uniform_motion.json');
  writeFileSync(configPath, JSON.stringify(config));
  const native = JSON.parse(execFileSync(resolve(root, 'target/debug/ergion'), [configPath], { encoding: 'utf8' }));
  const wasm = await page.evaluate(async ({ config: value, workerUrl }) => {
    // ページが実際に起動した本番Workerと同じ入口・通信を検証する。
    return new Promise<Record<string, number | boolean>>((resolve, reject) => {
      const worker = new Worker(workerUrl, { type: 'module' });
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Worker timeout')); }, 15000);
      let started = false;
      worker.onmessage = ({ data }) => {
        if (data.error) { clearTimeout(timer); worker.terminate(); reject(new Error(data.error)); }
        else if (!started) { started = true; worker.postMessage({ id: 7, command: 'start' }); }
        else if (data.state.finished) { clearTimeout(timer); worker.terminate(); resolve(data.state); }
      };
      worker.onerror = error => { clearTimeout(timer); worker.terminate(); reject(new Error(error.message)); };
      worker.postMessage({ id: 7, command: 'load', config: value });
    });
  }, { config, workerUrl: page.workers()[0].url() });
  for (const key of ['position', 'velocity', 'time', 'exact_position', 'exact_velocity']) {
    expect(wasm[key]).toBeCloseTo(native[key], 12);
  }
  expect(wasm.step).toBe(300);
  expect(wasm.finished).toBe(true);
});

test('設定JSONの往復・不正入力・完了後の操作', async ({ page }) => {
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=steps]').fill('8');
  await page.locator('[name=velocity]').fill('2');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '設定を保存' }).click();
  const file = await downloadPromise;
  const saved = JSON.parse(readFileSync((await file.path())!, 'utf8'));
  expect(saved.steps).toBe(8);
  expect(saved.velocity).toBe(2);
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#progress-text')).toHaveText('8 / 8 ステップ');
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeDisabled();
  await page.locator('#import').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#error')).toBeVisible();
  await page.locator('#import').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...saved, dt: -1 })) });
  await expect(page.locator('#status')).toHaveText('条件を確認してください');
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeDisabled();
  await page.locator('#import').setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#progress-text')).toHaveText('0 / 8 ステップ');
});

test('デスクトップとモバイルの表示', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('heading', { name: '等速直線運動の計算と説明' })).toBeVisible();
  await expect(tex(page, String.raw`m x'' = F`).first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(page.locator('#study .katex').first()).toBeVisible();
  await expectSimulationDoc(page, 'uniform', 'UniformSimulation');
  await expectMechanicsSection(page);
  await page.locator('[name=steps]').fill('600');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await page.screenshot({ path: testInfo.outputPath('studio-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '等速直線運動.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '等速直線運動の計算と説明' })).toBeVisible();
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '初期状態にリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.screenshot({ path: testInfo.outputPath('studio-mobile.png'), fullPage: true });
});

test('節の名前はボタンで、閉じた節を開きいまの節を閉じる', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('uniform.html');
    await expect(page.locator('body')).not.toContainText('実験室');
    const mechanics = page.getByRole('button', { name: '力学', exact: true });
    const ode = page.getByRole('button', { name: '微分方程式', exact: true });
    await expect(mechanics).toHaveAttribute('aria-expanded', 'true');
    await expect(ode).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: '等速直線運動', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '変数分離', exact: true })).toHaveCount(0);
    if (width === 390) {
      const headingTop = await page.locator('h1').evaluate((node) => node.getBoundingClientRect().top);
      expect(headingTop).toBeLessThan(844);
    }
    await ode.focus();
    await page.keyboard.press('Enter');
    await expect(ode).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: '変数分離', exact: true })).toBeVisible();
    await mechanics.focus();
    await page.keyboard.press('Enter');
    await expect(mechanics).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: '等速直線運動', exact: true })).toHaveCount(0);
    await expect(ode).toHaveAttribute('aria-expanded', 'true');
  }
});

test('粗い刻みでも数値軌道が表示範囲に収まる', async ({ page }, testInfo) => {
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=initial_position]').fill('0');
  await page.locator('[name=velocity]').fill('1');
  await page.locator('[name=dt]').fill('0.9');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#position')).toHaveText('0.90000');
  await expect(page.locator('#time-chart')).toHaveAttribute('aria-label', /位置と時間のグラフ/);
  await page.screenshot({ path: testInfo.outputPath('coarse-step.png'), fullPage: true });
});

test('力学の目次はいまページにしてあるものだけを示す', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: '力学.' })).toBeVisible();
  await expect(page.locator('#contents')).toContainText('直線上の一つの粒子');
  await expect(page.locator('#contents')).not.toContainText('これより後');
  await expect(tex(page, 'x_0').first()).toBeVisible();
  await expect(tex(page, 'v_0').first()).toBeVisible();
  await expect(tex(page, String.raw`x' = v`).first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`).first()).toBeVisible();
  await expect(tex(page, 'v(t) = v_0 + a t').first()).toBeVisible();
  await expect(page.locator('#contents .katex').first()).toBeVisible();
  await expect(page.locator('#contents .equation').first()).toHaveCSS('background-color', palettes.light.plate);
  await expect(page.getByRole('link', { name: '位置の時間微分' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '等速直線運動' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '等加速度直線運動' }).first()).toBeVisible();
  await expectMechanicsSection(page);
  const text = await page.locator('#contents').innerText();
  for (const word of ['電磁気', '解析力学', '金融', '分子動力学', '正本', '計算核', '軌道を読む', '力学の教科書', 'これより後']) {
    expect(text).not.toContain(word);
  }
});

async function expectReadingPage(page: Page) {
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('微分方程式をデスクトップと狭い画面で読む', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('ode.html');
  await expect(page.getByRole('heading', { level: 1, name: '微分方程式.' })).toBeVisible();
  await expect(tex(page, String.raw`x' = f(x, t)`).first()).toBeVisible();
  await expect(tex(page, String.raw`\frac{d}{dt} x(t) = f(x(t), t)`).first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('解であるためには');
  await expect(page.locator('#study').getByRole('link', { name: '等速直線運動' })).toHaveAttribute('href', './uniform.html');
  await expect(page.locator('#study').getByRole('link', { name: '等加速度直線運動' })).toHaveAttribute('href', './accelerated.html');
  await expect(page.getByRole('link', { name: '積分して解く' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '変数分離' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '1階線形' }).first()).toBeVisible();
  await expect(page.locator('.chapter-list a').nth(1)).toHaveAttribute('href', './separation.html');
  await expect(page.locator('.chapter-list a').nth(2)).toHaveAttribute('href', './linear.html');
  const numerical = page.getByRole('button', { name: '数値計算', exact: true });
  await numerical.click();
  await expect(page.locator('.rail-pages').getByRole('link', { name: 'Euler法' }).first()).toBeVisible();
  await expect(page.locator('.rail-pages').getByRole('link', { name: '中点法' }).first()).toBeVisible();
  await expect(page.locator('.rail-pages').getByRole('link', { name: '古典的RK4', exact: true })).toBeVisible();
  await expect(page.locator('.rail-pages').getByRole('link', { name: 'ニュートン法', exact: true }).first()).toBeVisible();
  await numerical.click();
  const text = await page.locator('#lesson').innerText();
  for (const word of ['crates/', '正本', '計算核', 'ばね', '電磁気', 'RK4']) {
    expect(text).not.toContain(word);
  }
  await expectReadingPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1, name: '微分方程式.' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expectReadingPage(page);
});

test('積分して解くをデスクトップと狭い画面で読む', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('integrate.html');
  await expect(page.getByRole('heading', { level: 1, name: '積分して解く.' })).toBeVisible();
  await expect(tex(page, String.raw`x' = f(t)`).first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(tex(page, 'v(t) = v_0 + a t').first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`).first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('厳密解');
  await expect(page.locator('#study').getByRole('link', { name: '等速直線運動' })).toHaveAttribute('href', './uniform.html');
  await expect(page.locator('#study').getByRole('link', { name: '等加速度直線運動' })).toHaveAttribute('href', './accelerated.html');
  const text = await page.locator('#lesson').innerText();
  for (const word of ['crates/', '正本', '計算核', 'ばね', '電磁気']) {
    expect(text).not.toContain(word);
  }
  await expectReadingPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1, name: '積分して解く.' })).toBeVisible();
  await expect(page.locator('.solution-equation').first()).toBeVisible();
  await expectReadingPage(page);
});

test('数値解法は方法ごとに別のページで読む', async ({ page }) => {
  const pages: { href: string; title: string; formula: string; doc: string }[] = [
    {
      href: 'euler.html',
      title: 'Euler法.',
      formula: String.raw`x_{n+1} = x_n + \Delta t \, f(x_n, t_n)`,
      doc: '/Ergion/doc/ergion_core/fn.euler_step.html',
    },
    {
      href: 'midpoint.html',
      title: '中点法.',
      formula: String.raw`x_{n+1} = x_n + \Delta t \, k_2`,
      doc: '/Ergion/doc/ergion_core/fn.midpoint_step.html',
    },
    {
      href: 'rk4.html',
      title: '古典的RK4.',
      formula: String.raw`x_{n+1} = x_n + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)`,
      doc: '/Ergion/doc/ergion_core/fn.rk4_step.html',
    },
  ];
  for (const item of pages) {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(item.href);
    await expect(page.locator('#status')).toHaveText('準備完了');
    await expect(page.getByRole('heading', { level: 1, name: item.title })).toBeVisible();
    await expect(page.locator('[role=tablist]')).toHaveCount(1);
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab', { name: '一定速度' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '等加速度' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '変数分離' })).toBeVisible();
    await expect(tex(page, String.raw`x' = v`).first()).toBeVisible();
    await expect(tex(page, item.formula).first()).toBeVisible();
    await expect(page.locator('#study')).toContainText('丸めだけです');
    const study = await page.locator('#study').innerText();
    for (const word of ['crates/', 'euler_step', 'midpoint_step', 'rk4_step', 'EulerSimulation']) {
      expect(study).not.toContain(word);
    }
    const link = page.locator('#study').getByRole('link', { name: '1ステップの説明', exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', item.doc);
    const doc = await page.request.get(item.doc);
    expect(doc.ok()).toBeTruthy();
    await expectTypeSize(page);
    await expectMechanicsSection(page);
    await page.locator('[name=initial_position]').fill('0');
    await page.locator('[name=velocity]').fill('2');
    await page.locator('[name=dt]').fill('0.25');
    await page.getByRole('button', { name: '条件を適用してリセット' }).click();
    await expect(page.locator('#status')).toHaveText('準備完了');
    await page.getByRole('button', { name: '1ステップ', exact: true }).click();
    await expect(page.locator('#position')).toHaveText('0.50000');
    await expect(page.locator('#velocity')).toHaveText('2.00000');
    expect(Math.abs(Number(await page.locator('#energy-error').innerText()))).toBeLessThan(1e-12);
    await expect(page.locator('#phase-chart')).toHaveAttribute('aria-label', /位置の誤差/);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { level: 1, name: item.title })).toBeVisible();
    await expect(page.locator('.equation').first()).toBeVisible();
    await expectMechanicsSection(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('ニュートン法は根の反復であり、微分方程式のタブではない', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('newton.html');
    await expect(page.locator('#status')).toHaveText('計算完了');
    await expect(page.getByRole('heading', { level: 1, name: 'ニュートン法.' })).toBeVisible();
    await expect(page.locator('[role=tablist]')).toHaveCount(0);
    await expect(tex(page, String.raw`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`).first()).toBeVisible();
    await expect(tex(page, 'f(x) = x^2 - 2').first()).toBeVisible();
    await expect(tex(page, 'x_0 = 1').first()).toBeVisible();
    await expect(tex(page, String.raw`x_1 = 1 - \frac{1^2 - 2}{2 \cdot 1} = \frac{3}{2}`).first()).toBeVisible();
    await expect(tex(page, String.raw`x_2 = \frac{3}{2} - \frac{\left(\frac{3}{2}\right)^2 - 2}{2 \cdot \frac{3}{2}} = \frac{3}{2} - \frac{1}{12} = \frac{17}{12}`).first()).toBeVisible();
    await expect(tex(page, String.raw`x_3 = \frac{17}{12} - \frac{\left(\frac{17}{12}\right)^2 - 2}{2 \cdot \frac{17}{12}} = \frac{17}{12} - \frac{1}{408} = \frac{577}{408}`).first()).toBeVisible();
    const lesson = await page.locator('#lesson').innerText();
    for (const word of ['crates/', 'newton_step', 'NewtonSimulation', '正本', '計算核']) {
      expect(lesson).not.toContain(word);
    }
    const link = page.locator('#study').getByRole('link', { name: '反復の説明', exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/Ergion/doc/ergion_core/fn.newton_step.html');
    const doc = await page.request.get('/Ergion/doc/ergion_core/fn.newton_step.html');
    expect(doc.ok()).toBeTruthy();
    await expect(page.locator('#exact-root')).toHaveText('1.41421');
    await expect(page.locator('#root-error')).toHaveText('1.59e-12');
    await expect(page.locator('#solution-error')).toHaveAttribute('aria-label', /誤差/);
    await expectReadingPage(page);
  }
});

test('一定速度の増分は有理数の等式としてデスクトップと狭い画面で読む', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('velocity-step.html');
    await expect(page.getByRole('heading', { level: 1, name: '一定速度の増分.' })).toBeVisible();
    await expect(page.locator('#status')).toHaveText('準備完了');
    await expect(page.locator('[role=tablist]')).toHaveCount(2);
    await expect(page.getByRole('tab', { name: '一定速度' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Euler法' })).toBeVisible();
    await expect(tex(page, String.raw`x' = v`).first()).toBeVisible();
    await expect(tex(page, String.raw`x \mapsto x + v \Delta t`).first()).toBeVisible();
    await expect(tex(page, String.raw`x_n = x_0 + n v \Delta t`).first()).toBeVisible();
    await expect(page.locator('#study')).toContainText('有理数');
    const prose = await page.locator('#study').evaluate((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.proof-source').forEach((element) => element.remove());
      return clone.innerText;
    });
    for (const word of ['crates/', 'formal/', 'Rat', '正本', '計算核', 'sorry']) {
      expect(prose).not.toContain(word);
    }
    const source = page.locator('.proof-source');
    await expect(source).toContainText('constantVelocitySteps_eq');
    await expect(source).not.toContainText('sorry');
    await expect(page.locator('.proof').getByRole('link')).toHaveCount(0);
    await expect(page.locator('.equation-note')).toHaveCount(0);
    await expectReadingPage(page);
  }
});

test('証明の節は画面が Lean を実行しないと述べ、各ページは確かめの有無を分ける', async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.goto('proof.html');
    await expect(page.getByRole('heading', { level: 1, name: '証明の一覧.' })).toBeVisible();
    await expect(page.locator('#lesson')).toContainText('lake build');
    await expect(page.locator('#lesson')).toContainText('有理数');
    await expect(page.locator('#lesson')).toContainText('実数');
    await expect(page.locator('#lesson')).toContainText('この画面は証明を実行しません');
    const modules = ['Ergion.ConstantVelocity', 'Ergion.ConstantAcceleration', 'Ergion.Solution', 'Ergion.Separation', 'Ergion.FirstOrderLinear', 'Ergion.Homogeneous', 'Ergion.Exact', 'Ergion.Bernoulli', 'Ergion.SecondOrder', 'Ergion.Undetermined', 'Ergion.Variation', 'Ergion.Laplace', 'Ergion.PowerSeries', 'Ergion.LinearSystem'];
    for (const name of modules) {
      const link = page.locator('#lesson').getByRole('link', { name, exact: true });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', new RegExp(`${name.slice('Ergion.'.length)}\\.lean$`));
    }
    await expect(page.locator('#lesson').getByRole('link', { name: '一定速度の増分' })).toHaveAttribute('href', './velocity-step.html');
    const prose = await page.locator('#lesson').innerText();
    for (const word of ['crates/', 'formal/', 'Rat', '正本', '計算核', 'sorry']) {
      expect(prose).not.toContain(word);
    }
    await expect(page.locator('[role=tablist]')).toHaveCount(0);
    await expect(page.locator('.proof-source')).toHaveCount(0);
    await expectReadingPage(page);
  }

  const velocityOnly = ['uniform.html', 'derivative.html', 'velocity-step.html'];
  const velocityAndAcceleration = ['./', 'integrate.html'];
  const realProofs: [string, string, string][] = [
    ['accelerated.html', 'constantAcceleration_solves', 'Ergion.ConstantAcceleration'],
    ['ode.html', 'isOdeSolution_iff_deriv', 'Ergion.Solution'],
    ['separation.html', 'separatedExponential_solves', 'Ergion.Separation'],
    ['linear.html', 'firstOrderLinear_solves', 'Ergion.FirstOrderLinear'],
    ['homogeneous.html', 'homogeneousRatio_solves', 'Ergion.Homogeneous'],
    ['exact.html', 'exactPotential_constant', 'Ergion.Exact'],
    ['bernoulli.html', 'bernoulli_to_linear', 'Ergion.Bernoulli'],
    ['second-order.html', 'twoReal_general', 'Ergion.SecondOrder'],
    ['undetermined.html', 'undetermined_coefficient', 'Ergion.Undetermined'],
    ['variation.html', 'variation_solves', 'Ergion.Variation'],
    ['laplace.html', 'laplaceSolution_transform', 'Ergion.Laplace'],
    ['series.html', 'powerSeries_eq_cos', 'Ergion.PowerSeries'],
    ['system.html', 'linearSystem_solves', 'Ergion.LinearSystem'],
  ];
  const numerical = ['euler.html', 'midpoint.html', 'rk4.html', 'newton.html'];
  async function expectCheckedProse() {
    await expect(page.locator('#proof-heading')).toHaveText('証明');
    await expect(page.locator('.proof .quiet-label')).toHaveCount(0);
    await expect(page.locator('.proof')).not.toContainText('まだ確かめていません');
    await expect(page.locator('.proof')).not.toContainText('sorry');
    const proofProse = await page.locator('.proof').evaluate((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.proof-source').forEach((element) => element.remove());
      return clone.innerText;
    });
    expect(proofProse).not.toContain('この等式は');
    expect(proofProse).not.toContain('確認済');
    expect(proofProse).not.toContain('f64');
    expect(proofProse).not.toContain('有理数の上で厳密');
    for (const word of ['crates/', 'formal/', 'Rat', '正本', '計算核', 'sorry']) {
      expect(proofProse).not.toContain(word);
    }
  }
  for (const href of velocityOnly) {
    await page.goto(href);
    const source = page.locator('.proof-source');
    await expect(source).toHaveCount(1);
    await expect(source).toContainText('constantVelocitySteps_eq');
    await expectCheckedProse();
  }
  for (const href of velocityAndAcceleration) {
    await page.goto(href);
    const source = page.locator('.proof-source');
    await expect(source).toHaveCount(2);
    await expect(source.nth(0)).toContainText('constantVelocitySteps_eq');
    await expect(source.nth(1)).toContainText('constantAcceleration_solves');
    await expectCheckedProse();
  }
  for (const [href, theorem] of realProofs) {
    await page.goto(href);
    const source = page.locator('.proof-source');
    await expect(source).toHaveCount(1);
    await expect(source).toContainText(theorem);
    await expect(page.locator('.proof').getByRole('link')).toHaveCount(0);
    await expectCheckedProse();
  }
  for (const href of numerical) {
    await page.goto(href);
    await expect(page.locator('.proof')).toHaveCount(0);
  }
});

test('位置の時間微分をデスクトップと狭い画面で読む', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('derivative.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('[role=tablist]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: '位置の時間微分の計算と説明' })).toBeVisible();
  await expect(tex(page, String.raw`x' = v`).first()).toBeVisible();
  await expect(tex(page, String.raw`x_{n+1} = x_n + v \Delta t`).first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('打ち切り誤差はありません');
  const href = '/Ergion/doc/ergion_core/fn.x_prime_eq_v_step.html';
  const link = page.locator('#study').getByRole('link', { name: '1ステップの説明', exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', href);
  const study = await page.locator('#study').innerText();
  expect(study).not.toContain('crates/');
  expect(study).not.toContain('x_prime_eq_v_step');
  expect(study).not.toContain('PositionDerivative');
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  const doc = await page.request.get(href);
  expect(doc.ok()).toBeTruthy();
  expect(await doc.text()).toContain('x_prime_eq_v_step');
  await page.locator('[name=initial_position]').fill('0');
  await page.locator('[name=velocity]').fill('2');
  await page.locator('[name=dt]').fill('0.25');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#position')).toHaveText('0.50000');
  await expect(page.locator('#velocity')).toHaveText('2.00000');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '位置の時間微分.' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('等加速度直線運動をデスクトップと狭い画面で読む', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('accelerated.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.getByRole('heading', { name: '等加速度直線運動の計算と説明' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 + v_0 t + \frac{1}{2} a t^2`).first()).toBeVisible();
  await expect(tex(page, 'v(t) = v_0 + a t').first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('数値ステップの増分は厳密解の増分と一致します');
  await expectSimulationDoc(page, 'constant_acceleration', 'ConstantAccelerationSimulation');
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  await page.locator('[name=dt]').fill('0.5');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#velocity')).toHaveText('0.50000');
  await expect(page.locator('#position')).toHaveText('0.00000');
  expect(Math.abs(Number(await page.locator('#energy-error').innerText()))).toBeGreaterThan(0.1);
  await expect(page.locator('#phase-chart')).toHaveAttribute('aria-label', /位置の誤差/);
  await page.screenshot({ path: testInfo.outputPath('accelerated-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '等加速度直線運動.' })).toBeVisible();
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(page.locator('#study .solution')).toBeVisible();
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('accelerated-mobile.png'), fullPage: true });
});

test('等速直線運動も狭い画面で本文と式が読める', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await expect(page.locator('.equation').first()).toBeVisible();
  await expect(tex(page, 'x(t) = x_0 + v t').first()).toBeVisible();
  await expect(page.locator('#study .solution')).toContainText('打ち切り誤差はありません');
  await expectTypeSize(page);
  await expectMechanicsSection(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('CLIで有効な大きい刻みの設定を読み込み後も編集できる', async ({ page }) => {
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  const config = { schema_version: 1, initial_position: 1, velocity: 2, dt: 2, steps: 10 };
  await page.locator('#import').setInputFiles({ name: 'large-dt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)) });
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.locator('[name=steps]').fill('12');
  await page.getByRole('button', { name: '条件を適用してリセット' }).click();
  await expect(page.locator('#progress-text')).toHaveText('0 / 12 ステップ');
  await page.getByRole('button', { name: '1ステップ', exact: true }).click();
  await expect(page.locator('#scene-time')).toHaveText('t = 2.000');
});

test('変数分離をデスクトップと狭い画面で読む', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('separation.html');
  await expect(page.getByRole('heading', { level: 1, name: '変数分離.' })).toBeVisible();
  await expect(page.locator('[role=tablist]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(3);
  await expect(tex(page, String.raw`x' = kx`).first()).toBeVisible();
  await expect(tex(page, String.raw`x \neq 0`).first()).toBeVisible();
  await expect(tex(page, String.raw`\frac{dx}{x} = k\,dt`).first()).toBeVisible();
  await expect(tex(page, String.raw`\ln|x| = kt + C`).first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = x_0 e^{kt}`).first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = 3 e^{2t}`).first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('厳密解');
  await expect(page.locator('#study')).toContainText('打ち切り誤差はありません');
  const href = '/Ergion/doc/ergion_core/fn.separated_exponential.html';
  const link = page.locator('#study').getByRole('link', { name: '厳密解の説明', exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', href);
  const text = await page.locator('#lesson').innerText();
  for (const word of ['crates/', '正本', '計算核', 'separated_exponential', 'SeparationSimulation', 'ばね', '電磁気']) {
    expect(text).not.toContain(word);
  }
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#solution-value')).toHaveText('22.16717');
  await expect(page.locator('#solution-chart')).toHaveAttribute('aria-label', /厳密解/);
  const derivation = await page.locator('#study').innerText();
  const eulerError = await page.locator('#position-error').innerText();
  expect(Math.abs(Number(eulerError))).toBeGreaterThan(1e-3);
  await page.getByRole('tab', { name: '古典的RK4', exact: true }).click();
  await expect(page.locator('#position-error')).not.toHaveText(eulerError);
  await expect(page.locator('#status')).toHaveText('計算完了');
  const rk4Error = Number(await page.locator('#position-error').innerText());
  expect(Math.abs(rk4Error)).toBeGreaterThan(0);
  expect(Math.abs(rk4Error)).toBeLessThan(Math.abs(Number(eulerError)));
  expect(await page.locator('#study').innerText()).toBe(derivation);
  await expect(tex(page, String.raw`x' = kx`).first()).toBeVisible();
  await expect(page.locator('#solution-value')).toHaveText('22.16717');
  const doc = await page.request.get(href);
  expect(doc.ok()).toBeTruthy();
  expect(await doc.text()).toContain('separated_exponential');
  await expectReadingPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1, name: '変数分離.' })).toBeVisible();
  await expect(page.locator('.solution-equation').first()).toBeVisible();
  await page.getByRole('tab', { name: '中点法', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#solution-value')).toHaveText('22.16717');
  expect(await page.locator('#study').innerText()).toBe(derivation);
  await expectReadingPage(page);
});

test('1階線形をデスクトップと狭い画面で読む', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('linear.html');
  await expect(page.getByRole('heading', { level: 1, name: '1階線形.' })).toBeVisible();
  await expect(page.locator('[role=tablist]')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(3);
  await expect(tex(page, String.raw`x' + px = q`).first()).toBeVisible();
  await expect(tex(page, String.raw`p \neq 0`).first()).toBeVisible();
  await expect(tex(page, String.raw`e^{pt} x' + p e^{pt} x = q e^{pt}`).first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = \frac{q}{p} + \left(x_0 - \frac{q}{p}\right) e^{-pt}`).first()).toBeVisible();
  await expect(tex(page, String.raw`x(t) = 3 - 2 e^{-2t}`).first()).toBeVisible();
  await expect(page.locator('#study')).toContainText('厳密解');
  await expect(page.locator('#study')).toContainText('積分因子');
  await expect(page.locator('#study').getByRole('link', { name: '積分して解く' })).toHaveAttribute('href', './integrate.html');
  const href = '/Ergion/doc/ergion_core/fn.first_order_linear.html';
  const link = page.locator('#study').getByRole('link', { name: '厳密解の説明', exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', href);
  const text = await page.locator('#lesson').innerText();
  for (const word of ['crates/', '正本', '計算核', 'first_order_linear', 'LinearSimulation', 'ばね', '電磁気']) {
    expect(text).not.toContain(word);
  }
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('#solution-value')).toHaveText('2.72933');
  await expect(page.locator('#solution-chart')).toHaveAttribute('aria-label', /厳密解/);
  const doc = await page.request.get(href);
  expect(doc.ok()).toBeTruthy();
  expect(await doc.text()).toContain('first_order_linear');
  await expectReadingPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1, name: '1階線形.' })).toBeVisible();
  await expect(page.locator('.solution-equation').first()).toBeVisible();
  await expect(page.locator('#solution-value')).toHaveText('2.72933');
  await expectReadingPage(page);
});

test('学部の標準的な解法をデスクトップと狭い画面で読む', async ({ page }) => {
  test.setTimeout(120_000);
  const pages: { href: string; title: string; formula: string; fn: string; value: string; companion?: string }[] = [
    { href: 'homogeneous.html', title: '同次形.', formula: String.raw`x(t) = t(\ln t + C)`, fn: 'homogeneous_ratio', value: '1.38629' },
    { href: 'exact.html', title: '完全微分.', formula: String.raw`x^2 + xy + y^2 = C`, fn: 'exact_quadratic', value: '0.65139' },
    { href: 'bernoulli.html', title: 'ベルヌーイ.', formula: String.raw`x(t) = \frac{1}{1 + e^{-t}}`, fn: 'bernoulli_logistic', value: '0.73106' },
    { href: 'second-order.html', title: '定数係数の2階同次.', formula: String.raw`x(t) = -e^{t} + 2e^{2t}`, fn: 'characteristic_two_real', value: '12.05983' },
    { href: 'undetermined.html', title: '未定係数法.', formula: String.raw`x(t) = \frac{1}{2} e^{t} - e^{2t} + \frac{1}{2} e^{3t}`, fn: 'undetermined_coefficient', value: '4.01285' },
    { href: 'variation.html', title: '定数変化法.', formula: String.raw`x(t) = \sin t - \cos t \cdot \ln|\sec t + \tan t|`, fn: 'variation_of_parameters', value: '0.17896' },
    { href: 'laplace.html', title: 'Laplace 変換.', formula: String.raw`X(s) = \frac{1}{(s - 1)(s - 2)(s - 3)}`, fn: 'laplace_ivp', value: '4.01285' },
    { href: 'series.html', title: 'べき級数.', formula: String.raw`a_{m+2} = -\frac{a_m}{(m+1)(m+2)}`, fn: 'power_series_cosine', value: '0.54030' },
    { href: 'system.html', title: '連立1階.', formula: String.raw`x(t) = \frac{1}{2}\bigl(e^{3t} + e^{-t}\bigr)`, fn: 'linear_system_x', value: '10.22671', companion: '19.71766' },
  ];
  for (const item of pages) {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(item.href);
    await expect(page.getByRole('heading', { level: 1, name: item.title })).toBeVisible();
    await expect(page.locator('[role=tablist]')).toHaveCount(1);
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(tex(page, item.formula).first()).toBeVisible();
    await expect(page.locator('#study')).toContainText('厳密解');
    const href = `/Ergion/doc/ergion_core/fn.${item.fn}.html`;
    const link = page.locator('#lesson').getByRole('link', { name: '厳密解の説明', exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', href);
    const text = await page.locator('#lesson').evaluate((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.proof-source').forEach((element) => element.remove());
      return clone.innerText;
    });
    for (const word of ['crates/', '正本', '計算核', item.fn, 'Textbook', 'ばね', '電磁気']) {
      expect(text, item.href).not.toContain(word);
    }
    await expect(page.locator('#status')).toHaveText('計算完了');
    await expect(page.locator('#solution-value')).toHaveText(item.value);
    if (item.companion) await expect(page.locator('#solution-companion')).toHaveText(item.companion);
    await expect(page.locator('#solution-chart')).toHaveAttribute('aria-label', /厳密解/);
    const doc = await page.request.get(href);
    expect(doc.ok()).toBeTruthy();
    expect(await doc.text()).toContain(item.fn);
    await expectReadingPage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { level: 1, name: item.title })).toBeVisible();
    await expect(page.locator('.solution-equation').first()).toBeVisible();
    await expect(page.locator('#solution-value')).toHaveText(item.value);
    await expectReadingPage(page);
  }
});

test('数値解法の切り替えは390pxでも一行のタブである', async ({ page }) => {
  test.setTimeout(60_000);
  for (const href of ['uniform.html', 'separation.html']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(href);
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText('Euler法');
    await expect(tabs.nth(1)).toHaveText('中点法');
    await expect(tabs.nth(2)).toHaveText('古典的RK4');
    const strip = () => page.locator('.method-tabs').evaluate((list) => {
      const items = [...list.querySelectorAll<HTMLElement>('.method-tab')];
      const rows = new Set(items.map((tab) => Math.round(tab.getBoundingClientRect().top))).size;
      const extra = document.createElement('button');
      extra.className = 'method-tab';
      extra.setAttribute('role', 'tab');
      extra.textContent = '仮の方法';
      list.appendChild(extra);
      const withExtra = [...list.querySelectorAll<HTMLElement>('.method-tab')];
      const rowsWithExtra = new Set(withExtra.map((tab) => Math.round(tab.getBoundingClientRect().top))).size;
      const metrics = {
        rows,
        rowsWithExtra,
        nowrap: getComputedStyle(list).flexWrap === 'nowrap',
        scrolls: list.scrollWidth > list.clientWidth + 1,
        pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        selected: items.filter((tab) => tab.getAttribute('aria-selected') === 'true').length,
        oneLine: list.getBoundingClientRect().height <= items[0].getBoundingClientRect().height + 4,
      };
      extra.remove();
      return metrics;
    });
    const before = await strip();
    expect(before.rows, href).toBe(1);
    expect(before.rowsWithExtra, href).toBe(1);
    expect(before.nowrap, href).toBe(true);
    expect(before.scrolls, href).toBe(true);
    expect(before.pageFits, href).toBe(true);
    expect(before.selected, href).toBe(1);
    expect(before.oneLine, href).toBe(true);
    await page.getByRole('tab', { name: '古典的RK4', exact: true }).click();
    await expect(page.getByRole('tab', { name: '古典的RK4', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Euler法', exact: true })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByRole('tab', { name: '中点法', exact: true })).toHaveAttribute('aria-selected', 'false');
    const after = await strip();
    expect(after.rows, href).toBe(1);
    expect(after.oneLine, href).toBe(true);
    expect(after.selected, href).toBe(1);
    expect(after.pageFits, href).toBe(true);
  }
});

test('証明は式と図と例のあとで、ページの最後にある', async ({ page }) => {
  test.setTimeout(180_000);
  const pages = [
    { href: 'uniform.html', kind: '力学' },
    { href: 'derivative.html', kind: '力学' },
    { href: 'accelerated.html', kind: '力学' },
    { href: './', kind: '力学' },
    { href: 'separation.html', kind: '微分方程式' },
    { href: 'linear.html', kind: '微分方程式' },
    { href: 'ode.html', kind: '微分方程式' },
    { href: 'integrate.html', kind: '微分方程式' },
    { href: 'homogeneous.html', kind: '微分方程式' },
    { href: 'exact.html', kind: '微分方程式' },
    { href: 'bernoulli.html', kind: '微分方程式' },
    { href: 'second-order.html', kind: '微分方程式' },
    { href: 'undetermined.html', kind: '微分方程式' },
    { href: 'variation.html', kind: '微分方程式' },
    { href: 'laplace.html', kind: '微分方程式' },
    { href: 'series.html', kind: '微分方程式' },
    { href: 'system.html', kind: '微分方程式' },
    { href: 'velocity-step.html', kind: '数値計算' },
  ];
  for (const item of pages) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
      await page.goto(item.href);
          const order = await page.evaluate(() => {
            const main = document.querySelector('main')!;
            const proof = main.querySelector('.proof');
            const equation = main.querySelector('.equation');
            const steps = main.querySelector('#study .solution');
            const figure = main.querySelector('canvas');
            const example = main.querySelector('#example');
            const related = main.querySelector('#related');
            const follows = (earlier: Element | null, later: Element | null) =>
              !earlier || !later || Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
            return {
              proofIsLast: main.lastElementChild === proof,
              equationBeforeProof: follows(equation, proof),
              stepsBeforeProof: follows(steps, proof),
              figureBeforeProof: follows(figure, proof),
              exampleAfterFigure: follows(figure, example),
              exampleBeforeProof: follows(example, proof),
              relatedBeforeProof: follows(related, proof),
              proofTop: proof?.getBoundingClientRect().top ?? 0,
              equationTop: equation?.getBoundingClientRect().top ?? 0,
              slogan: document.body.innerText.includes('数値を、動かして確かめる') || document.body.innerText.includes('小さな系から'),
            };
          });
          expect(order.proofIsLast, `${item.kind} ${item.href} ${width}`).toBe(true);
          expect(order.equationBeforeProof, item.href).toBe(true);
          expect(order.stepsBeforeProof, item.href).toBe(true);
          expect(order.figureBeforeProof, item.href).toBe(true);
          expect(order.exampleAfterFigure, item.href).toBe(true);
          expect(order.exampleBeforeProof, item.href).toBe(true);
          expect(order.relatedBeforeProof, item.href).toBe(true);
          expect(order.proofTop, item.href).toBeGreaterThan(order.equationTop);
          expect(order.slogan, item.href).toBe(false);
    }
  }
});

test('暗い配色は端末に従い、図と KaTeX と式の地も同じトークンで描く', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('separation.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expect(page.locator('.theme-toggle')).toHaveAttribute('data-scheme', 'dark');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  await expectScheme(page, 'dark', { numerical: '#solution-chart', exact: '#solution-chart', error: '#solution-error' });
  await expectTypeSize(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('.theme-toggle')).toHaveAttribute('data-scheme', 'light');
  await expectScheme(page, 'light', { numerical: '#solution-chart', exact: '#solution-chart', error: '#solution-error' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('.theme-toggle')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

async function expectThemeIcon(page: Page, scheme: Scheme) {
  const toggle = page.locator('.app-header .theme-toggle');
  await expect(toggle).toHaveAttribute('data-scheme', scheme);
  await expect(toggle).toHaveAccessibleName(scheme === 'dark' ? '明るい配色にする' : '暗い配色にする');
  expect((await toggle.innerText()).trim()).toBe('');
  await expect(toggle.locator(scheme === 'dark' ? 'svg circle' : 'svg path')).toHaveCount(1);
  if (scheme === 'light') await expect(toggle.locator('svg circle')).toHaveCount(0);
}

test('配色のボタンは一つのアイコンで、押すと ergion-theme に反対の配色を置き、どのページでも同じである', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('uniform.html');
  await expect(page.locator('#status')).toHaveText('準備完了');
  await page.evaluate(() => localStorage.removeItem('ergion-theme'));
  await page.reload();
  await expect(page.locator('#status')).toHaveText('準備完了');
  for (let step = 1; step <= 3; step += 1) {
    await page.getByRole('button', { name: '1ステップ', exact: true }).click();
    await expect(page.locator('#progress-text')).toContainText(`${step} /`);
  }
  const header = page.locator('.app-header');
  const toggle = header.locator('.theme-toggle');
  await expect(header.locator('button')).toHaveCount(1);
  await expectThemeIcon(page, 'light');
  const headerText = await header.innerText();
  for (const word of ['配色', '明るい', '暗い', '端末', '暗くする', '明るくする', 'テーマ', 'モード', 'システム']) {
    expect(headerText).not.toContain(word);
  }
  await expectScheme(page, 'light', { numerical: '#oscillator', exact: '#oscillator', error: '#phase-chart' });

  await toggle.click();
  await expectThemeIcon(page, 'dark');
  expect(await page.evaluate(() => localStorage.getItem('ergion-theme'))).toBe('dark');
  await expectScheme(page, 'dark', { numerical: '#oscillator', exact: '#oscillator', error: '#phase-chart' });

  for (const href of ['separation.html', 'newton.html', './']) {
    await page.goto(href);
    await expectThemeIcon(page, 'dark');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(palettes.dark.bg);
  }
  await page.goto('newton.html');
  await expect(page.locator('#status')).toHaveText('計算完了');
  await expectScheme(page, 'dark', { numerical: '#solution-chart' });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.locator('.theme-toggle').click();
  await expectThemeIcon(page, 'light');
  expect(await page.evaluate(() => localStorage.getItem('ergion-theme'))).toBe('light');
  await expectScheme(page, 'light', { numerical: '#solution-chart' });

  await page.evaluate(() => localStorage.removeItem('ergion-theme'));
  await page.reload();
  await expect(page.locator('#status')).toHaveText('計算完了');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  await expectThemeIcon(page, 'dark');
  await expectScheme(page, 'dark', { numerical: '#solution-chart' });
});

test('既存のページは、その図を明るい配色と暗い配色で示す', async ({ page }) => {
  test.setTimeout(240_000);
  const pages: [string, string][] = [
    ['./', 'mechanics'], ['derivative.html', 'derivative'], ['uniform.html', 'uniform'], ['accelerated.html', 'accelerated'],
    ['ode.html', 'ode'], ['integrate.html', 'integrate'], ['separation.html', 'separation'], ['linear.html', 'linear'],
    ['homogeneous.html', 'homogeneous'], ['exact.html', 'exact'], ['bernoulli.html', 'bernoulli'], ['second-order.html', 'second-order'],
    ['undetermined.html', 'undetermined'], ['variation.html', 'variation'], ['laplace.html', 'laplace'], ['series.html', 'series'],
    ['system.html', 'system'], ['velocity-step.html', 'velocity-step'], ['euler.html', 'euler'], ['midpoint.html', 'midpoint'],
    ['rk4.html', 'rk4'], ['newton.html', 'newton'], ['proof.html', 'proof'],
  ];
  const shown = () => page.locator('.page-figure img').evaluateAll(images => images
    .filter(image => image.getBoundingClientRect().width > 0)
    .map(image => ({ src: (image as HTMLImageElement).currentSrc, ok: (image as HTMLImageElement).naturalWidth > 0 })));
  for (const [href, id] of pages) {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(href);
    if (await page.locator('#related').count()) {
      await expect(page.locator('#related .panel-heading')).toHaveText('関連ページ');
      await expect(page.locator('#related .quiet-label')).toHaveCount(0);
    }
    await page.locator('.page-figure').scrollIntoViewIfNeeded();
    await expect.poll(async () => JSON.stringify(await shown()), href).toBe(JSON.stringify([{ src: `http://127.0.0.1:${process.env.STUDIO_PORT ?? 4187}/Ergion/figures/${id}/figure.png`, ok: true }]));
    await page.locator('.theme-toggle').click();
    await page.locator('.page-figure').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await shown()).map(item => item.src.split('/').pop()).join(), href).toBe('figure-dark.png');
    await page.locator('.theme-toggle').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.page-figure').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await shown()).map(item => item.src.split('/').pop()).join(), href).toBe('figure-narrow.png');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), href).toBe(true);
    await page.evaluate(() => localStorage.removeItem('ergion-theme'));
  }
});
