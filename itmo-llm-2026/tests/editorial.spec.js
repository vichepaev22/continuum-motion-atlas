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
