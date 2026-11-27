const {test,expect}=require('@playwright/test');
test('reader sees a task-specific verification aid without changing the prompt',async ({page})=>{
 await page.goto('./');
 await page.locator('#atlas-task').selectOption('logic');
 await expect(page.locator('#atlas-rubric')).not.toHaveAttribute('open','');
 await page.locator('#atlas-rubric summary').click();
 await expect(page.locator('#atlas-rubric-text')).toContainText('13 яблок');
 await expect(page.locator('#atlas-prompt')).not.toContainText('13 яблок');
 await page.locator('#atlas-task').selectOption('code');
 await expect(page.locator('#atlas-rubric')).not.toHaveAttribute('open','');
 await page.locator('#atlas-rubric summary').click();
 await expect(page.locator('#atlas-rubric-text')).toContainText('нормализует регистр');
});