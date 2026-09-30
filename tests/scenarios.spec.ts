import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function begin(page: Page, name = 'Бим') {
  await page.getByRole('button', { name: 'Познакомиться: ' + name, exact: true }).click();
  await page.getByRole('button', { name: 'Пройти демо-заявку', exact: true }).click();
}
async function fillDemo(page: Page) {
  await page.getByRole('button', { name: 'Заполнить демо-данными', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByLabel('Я прочитал(а) особенности ухода и условия анкеты.').check();
  await page.getByLabel('Я понимаю, что это демо. В приют ничего не отправится.').check();
  await page.getByRole('button', { name: 'Завершить демо-заявку', exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('catalog renders local photos and supports honest combined filters', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.getByRole('article')).toHaveCount(8);
  await expect(page.getByText('Учебный проект · Все анкеты вымышленные · Заявки не отправляются')).toBeVisible();
  for (const image of await page.locator('.pet-photo img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const mobile = info.project.name === 'mobile';
  if (mobile) await page.locator('.filters-mobile summary').click();
  const filters = page.locator(mobile ? '.filters-mobile' : '.filters-desktop');
  await filters.getByLabel('Другие животные дома').selectOption('cat');
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Бим', exact: true })).toHaveCount(0);
  await filters.getByLabel('Готов к особому уходу').check();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Марс', exact: true })).toBeVisible();
  await filters.getByRole('button', { name: 'Кошек', exact: true }).click();
  await expect(page.getByText('Такой анкеты пока нет')).toBeVisible();
  await filters.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(8);
  expect(errors).toEqual([]);
  await noOverflow(page);
});

test('favorites survive reload and can be removed from the favorites view', async ({ page }) => {
  await page.getByRole('button', { name: 'В избранное: Бим', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Убрать из избранного: Бим', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('nav').getByRole('button', { name: /^Избранное/ }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Убрать из избранного: Бим', exact: true }).click();
  await expect(page.getByText('Пока никто не сохранён')).toBeVisible();
});

test('profile is keyboard accessible and restores focus after Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Познакомиться: Ирис', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Кому будет комфортно', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Ирис', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('complete application validates, preserves edits and stores no contact data', async ({ page }) => {
  const submittedRequests: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') submittedRequests.push(request.url()); });
  await begin(page);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByText('Выберите тип жилья.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Заполнить демо-данными', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByLabel('Вымышленный email', { exact: true }).fill('invalid');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByText('Введите адрес вида friend@example.test.', { exact: true })).toBeVisible();
  await page.getByLabel('Вымышленный email', { exact: true }).fill('portfolio@example.test');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByLabel('Вымышленный email', { exact: true })).toHaveValue('portfolio@example.test');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Завершить демо-заявку', exact: true }).click();
  await expect(page.getByText('Подтвердите демонстрационный режим.', { exact: true })).toBeVisible();
  await page.getByLabel('Я прочитал(а) особенности ухода и условия анкеты.').check();
  await page.getByLabel('Я понимаю, что это демо. В приют ничего не отправится.').check();
  await page.getByRole('button', { name: 'Завершить демо-заявку', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Демо-заявка готова', exact: true })).toBeVisible();
  await expect(page.getByText(/В приют ничего не отправлено\./)).toBeVisible();
  const persisted = await page.evaluate(() => localStorage.getItem('lapki-demo:receipts:v1'));
  const rows = JSON.parse(persisted!);
  expect(Object.keys(rows[0]).sort()).toEqual(['createdAt', 'id', 'petId']);
  expect(persisted).not.toContain('portfolio@example.test');
  expect(submittedRequests).toEqual([]);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Вернуться к каталогу', exact: true }).click();
  await page.reload();
  await page.locator('nav').getByRole('button', { name: /^Демо-заявки/ }).click();
  await expect(page.getByRole('heading', { name: 'Бим', exact: true })).toBeVisible();
  await expect(page.getByText(/DEMO-[A-Z0-9-]+/)).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить демо-данные', exact: true }).click();
  await expect(page.getByText('Сначала познакомьтесь', { exact: true })).toBeVisible();
});

test('mismatched conditions produce explicit warnings in review', async ({ page }) => {
  await begin(page, 'Тайга');
  await page.getByRole('button', { name: 'Заполнить демо-данными', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByText('Потребуется обсудить', { exact: true })).toBeVisible();
  await expect(page.getByText('В анкете указан дом с огороженным участком. Квартира может не подойти.', { exact: true })).toBeVisible();
});

test('blocked localStorage keeps the full demo available in memory', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, { value() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.reload();
  await expect(page.getByText(/Хранилище браузера недоступно/)).toBeVisible();
  await page.getByRole('button', { name: 'В избранное: Бим', exact: true }).click();
  await begin(page);
  await fillDemo(page);
  await expect(page.getByText(/Подтверждение доступно до перезагрузки/)).toBeVisible();
});

test('catalog and form pass accessibility checks and fit enlarged text', async ({ page }, info) => {
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
  expect(violations).toEqual([]);
  await noOverflow(page);
  expect(await page.locator('.skip-link').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  await begin(page);
  const formViolations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
  expect(formViolations).toEqual([]);
  await noOverflow(page);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await noOverflow(page);
  for (const image of await page.locator('.pet-photo img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; window.scrollTo(0, 0); (document.activeElement as HTMLElement)?.blur(); });
  await page.waitForTimeout(150);
  if (info.project.name === 'desktop') {
    await page.screenshot({ path: 'test-results/catalog-desktop.png', fullPage: true });
  } else {
    await page.screenshot({ path: 'test-results/catalog-mobile.png', fullPage: true });
  }
});

test('optional WebMCP tools use the visible state and reject invalid IDs', async ({ page }) => {
  await page.addInitScript(() => {
    type Tool = { name: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown | Promise<unknown> };
    const registry = new Map<string, Tool>();
    (window as unknown as { demoTools: Map<string, Tool> }).demoTools = registry;
    Object.defineProperty(document, 'modelContext', { value: {
      registerTool(tool: Tool, options: { signal: AbortSignal }) {
        registry.set(tool.name, tool);
        options.signal.addEventListener('abort', () => { if (registry.get(tool.name) === tool) registry.delete(tool.name); });
      },
    } });
  });
  await page.reload();
  const registered = await page.evaluate(() => Array.from((window as unknown as { demoTools: Map<string, { annotations: { readOnlyHint: boolean }; inputSchema: object }> }).demoTools.entries()).map(([name, tool]) => ({ name, readOnly: tool.annotations.readOnlyHint, schema: tool.inputSchema })));
  expect(registered.map(tool => tool.name).sort()).toEqual(['list_demo_animals', 'set_demo_favorites', 'show_demo_animal']);
  expect(registered.find(tool => tool.name === 'list_demo_animals')!.readOnly).toBe(true);
  const result = await page.evaluate(async () => {
    const tools = (window as unknown as { demoTools: Map<string, { execute: (input: unknown) => unknown | Promise<unknown> }> }).demoTools;
    await tools.get('set_demo_favorites')!.execute({ petIds: ['bim', 'iris'] });
    let rejected = false;
    try { await tools.get('set_demo_favorites')!.execute({ petIds: ['unknown'] }); } catch { rejected = true; }
    const listed = tools.get('list_demo_animals')!.execute({ species: 'cat' });
    await tools.get('show_demo_animal')!.execute({ petId: 'busya' });
    return { rejected, listed };
  });
  expect(result.rejected).toBe(true);
  expect((result.listed as { animals: unknown[] }).animals).toHaveLength(3);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Буся', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('nav').getByRole('button', { name: /^Избранное/ }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
});
