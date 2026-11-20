const { test, expect } = require('@playwright/test');

test('issue loads, search and glossary initialise without a JavaScript crash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#glossary-items details')).toHaveCount(20);
  await expect(page.locator('#model-list .model')).toHaveCount(16);
  await expect(page.locator('#steps .step')).toHaveCount(7);
  await expect(page.locator('.route-card')).toHaveCount(3);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('full-text search finds a sentence not limited to model or glossary names', async ({ page }) => {
  await page.goto('./');
  await page.locator('#searchbtn').click();
  await page.locator('#globalsearch').fill('Недостаток одного звена');
  await expect(page.locator('#searchresults button').first()).toBeVisible();
  await expect(page.locator('#searchresults')).toContainText('Фрагмент текста');
  await page.keyboard.press('Escape');
  await expect(page.locator('#searchdialog')).not.toHaveClass(/open/);
  await expect(page.locator('#searchbtn')).toBeFocused();
});

test('model filters, evidence matrix and stages work', async ({ page }) => {
  await page.goto('./');
  await page.locator('#model-filters [data-group="open"]').click();
  const filtered = await page.locator('#model-list .model').count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(16);
  await page.locator('#compare-b').selectOption('0');
  await expect(page.locator('#compareout .compare-row')).toHaveCount(8);
  await page.locator('#stagenext').click();
  await expect(page.locator('#stepindicator')).toHaveText('02 / 07');
  await page.locator('#share').evaluate(el => {el.value = '25';el.dispatchEvent(new Event('input', { bubbles:true }));});
  await expect(page.locator('#shareval')).toHaveText('25%');
});

test('scenarios explain trade-offs without inventing model scores', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-scenario="medical"]').click();
  await expect(page.locator('#scenario-output-title')).toContainText('Клинические');
  await expect(page.locator('#scenario-output-source')).toHaveAttribute('href', /#page=18$/);
  await expect(page.locator('a.pill[href*="#page="]').first()).toBeVisible();
});

test('reading bookmark stays in the browser and can be cleared', async ({ page }) => {
  await page.goto('./');
  await page.locator('#future').scrollIntoViewIfNeeded();
  await page.locator('#bookmark-save').click();
  await expect(page.locator('#bookmark-resume')).toBeVisible();
  await page.reload();
  await expect(page.locator('#bookmark-resume')).toBeVisible();
  await page.locator('#bookmark-clear').click();
  await expect(page.locator('#bookmark-resume')).toBeHidden();
});

test('responsive layout has no body-level horizontal overflow', async ({ page }) => {
  await page.goto('./');
  const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 2);
  await expect(page.locator('.route-card')).toHaveCount(3);
  await expect(page.locator('#bookmark-save')).toBeVisible();
});

test('verified model links have three public chats, nine open-weight entries and four restricted entries', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#model-list .model')).toHaveCount(16);
  await expect(page.locator('#access-count-chat')).toHaveText('3');
  await expect(page.locator('#access-count-weights')).toHaveText('9');
  await expect(page.locator('#access-count-restricted')).toHaveText('4');
  await page.locator('#access-filters [data-access="chat"]').click();
  await expect(page.locator('#model-list .model')).toHaveCount(3);
  await expect(page.locator('#model-list .model a[href*="giga.chat"]')).toHaveCount(1);
  await expect(page.locator('#model-list .model a[href*="alice.yandex.ru"]')).toHaveCount(1);
  await expect(page.locator('#model-list .model a[href*="saiga_nemo_12b_gptq_demo"]')).toHaveCount(1);
  await page.locator('#access-filters [data-access="weights"]').click();
  await expect(page.locator('#model-list .model')).toHaveCount(9);
  await page.locator('#access-filters [data-access="restricted"]').click();
  await expect(page.locator('#model-list .model')).toHaveCount(4);
  await expect(page.locator('#model-list')).toContainText('BerryLM-XL');
  await expect(page.locator('#model-list')).toContainText('Gamayun');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('each model has grounded outbound sources and detail view explains access', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#model-list .model a.model-link')).toHaveCount(17);
  const links = await page.locator('#model-list .model a.model-link').evaluateAll(els => els.map(el => ({url:el.href,target:el.target,rel:el.rel})));
  for (const link of links) {
    expect(link.url).toMatch(/^https:\/\//);
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  }
  await page.locator('#model-list [data-detail="15"]').first().click();
  await expect(page.locator('#detaildialog')).toHaveClass(/open/);
  await expect(page.locator('#modeldetail')).toContainText('Saiga Nemo');
  await expect(page.locator('#modeldetail a[href*="saiga_nemo_12b_gptq_demo"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#detaildialog')).not.toHaveClass(/open/);
});

test('the trial laboratory offers three copyable standardized prompts', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#test-prompt-list [data-copy-prompt]')).toHaveCount(3);
  await expect(page.locator('#test-compare-lab')).toContainText('одинаковое задание');
});

test('all sixteen ITMO model entries expose a verified destination and an explicit access disclaimer', async ({ page }) => {
  await page.goto('./');
  for (let i = 0; i < 16; i++) {
    const card = page.locator('#catalog-model-' + i);
    await expect(card).toBeVisible();
    await expect(card.locator('a.model-link').first()).toHaveAttribute('href', /^https:\/\//);
    await card.locator('[data-detail]').first().click();
    await expect(page.locator('#detaildialog')).toHaveClass(/open/);
    await expect(page.locator('#modeldetail .detail-model-links a').first()).toHaveAttribute('href', /^https:\/\//);
    await expect(page.locator('#modeldetail .detail-model-links')).toContainText('Доступ к модели');
    await page.keyboard.press('Escape');
    await expect(page.locator('#detaildialog')).not.toHaveClass(/open/);
  }
});
