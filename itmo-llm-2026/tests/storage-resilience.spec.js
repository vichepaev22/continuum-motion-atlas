const {test,expect}=require('@playwright/test');
test('malformed saved records do not disable the lab',async ({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('itmo-atlas-v2-lab-records', JSON.stringify([null,{}, {model:'broken',answer:null}, {model:'Valid model',version:'',task:'logic',answer:'Valid response',accuracy:5,complete:4,verify:5,at:'2026-11-27T00:00:00Z'}]));
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await expect(page.locator('#atlas-results-count')).toContainText('1 сохранено');
 await expect(page.locator('#atlas-results-list')).toContainText('Valid response');
 await expect(page.locator('#atlas-results-list')).not.toContainText('broken');
 await expect(page.locator('#atlas-stage-tabs [role=tab]')).toHaveCount(7);
 expect(errors).toEqual([]);
});
