const {test,expect}=require('@playwright/test');
test('atlas 2.0: artwork, lab and seven-stage interactive guide',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await expect(page.locator('#atlas-lab-heading')).toBeVisible();
 await expect(page.locator('.android-story img')).toHaveAttribute('src','assets/editorial-stone-android.svg');
 await page.locator('.android-story img').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.locator('.android-story img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBeTruthy();
 await expect(page.locator('#atlas-model option')).toHaveCount(16);
 await expect(page.locator('#atlas-stage-tabs [role="tab"]')).toHaveCount(7);
 await page.locator('#atlas-task').selectOption('logic');
 await expect(page.locator('#atlas-prompt')).toContainText('Анны');
 await page.locator('#atlas-model').selectOption('0');
 await expect(page.locator('#atlas-model-link')).toHaveAttribute('href',/https:\/\//);
 await page.locator('#atlas-answer').fill('У Анны 4, у Бориса 7, у Веры 2. Всего 13 яблок.');
 await page.locator('#atlas-version').fill('Тестовая версия');
 await page.locator('#atlas-accuracy').selectOption('5');
 await page.locator('#atlas-complete').selectOption('5');
 await page.locator('#atlas-verify').selectOption('4');
 await page.locator('#atlas-save').click();
 await expect(page.locator('#atlas-results-list tbody tr')).toHaveCount(1);
 await page.reload();
 await expect(page.locator('#atlas-results-list tbody tr')).toHaveCount(1);
 await page.locator('#atlas-stage-tabs [role="tab"]').nth(4).click();
 await expect(page.locator('#atlas-flow-name')).toContainText('Модель награды');
 await expect(page.locator('#atlas-flow-progress')).toHaveAttribute('style',/71\.428/);
 expect(errors).toEqual([]);
});
test('atlas 2.0 mobile: controls and no extra horizontal viewport scroll',async({page,isMobile})=>{
 await page.goto('./');await page.locator('#atlas-lab').scrollIntoViewIfNeeded();
 await expect(page.locator('#atlas-task')).toBeVisible();
 await expect(page.locator('#atlas-copy')).toBeVisible();
 await expect(page.locator('#atlas-stage-tabs')).toBeAttached();
 if(isMobile){
  const bounds=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.innerWidth+2);
 }
});
