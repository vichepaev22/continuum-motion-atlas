const {test,expect} = require('@playwright/test');

// A privacy regression is a release blocker: no collector without consent,
// and never copy unconstrained CustomEvent payloads into network events.
test('analytics OFF by default: no tracker, controls explain what is missing',async ({page})=>{
  const thirdParty = [];
  page.on('request',req=>{if(req.url().includes('plausible.io'))thirdParty.push(req.url())});
  await page.goto('./');
  await expect(page.locator('#analytics-open')).toBeAttached();
  await expect(page.locator('script[src*="plausible.io"]')).toHaveCount(0);
  expect(thirdParty).toEqual([]);
  await page.locator('#analytics-open').click();
  await expect(page.locator('#analytics-dialog')).toBeVisible();
  await expect(page.locator('#analytics-status')).toContainText('пока не подключена');
  await expect(page.locator('#analytics-allow')).toBeDisabled();
  await page.locator('#analytics-close').click();
  await expect(page.locator('#analytics-dialog')).not.toBeVisible();
});

test('explicit opt-in, safe event allowlist, and full withdrawal',async ({page})=>{
  await page.route('**/analytics-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.ITMO_ANALYTICS_CONFIG={provider:'plausible',siteScriptUrl:'https://plausible.io/js/pa-test123.js',legalReady:true};"
  }));
  await page.route('https://plausible.io/js/pa-test123.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.__plausibleReady=true;window.plausible=function(name,options){(window.__safeEvents=window.__safeEvents||[]).push({name,options});};"
  }));
  await page.goto('./');
  await expect(page.locator('#analytics-banner')).toBeVisible();
  await expect(page.locator('script#itmo-plausible-script')).toHaveCount(0);
  await page.locator('#analytics-banner-allow').click();
  await expect(page.locator('#analytics-banner')).toBeHidden();
  await expect(page.locator('script#itmo-plausible-script')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>Boolean(window.__plausibleReady))).toBeTruthy();
  await page.evaluate(()=>{
    document.dispatchEvent(new CustomEvent('itmo:interaction',{detail:{
      event:'lab_result_saved',task:'code',modelIndex:3,
      answer:'ABSOLUTELY_PRIVATE_RESPONSE',searchQuery:'DO_NOT_EXFILTRATE',
      version:'PERSONAL_NOTE',accuracy:5
    }}));
  });
  const event=await page.evaluate(()=>window.__safeEvents.at(-1));
  expect(event.name).toBe('Atlas · lab_result_saved');
  expect(event.options.props).toEqual({task:'code',modelIndex:3});
  expect(JSON.stringify(event)).not.toContain('PRIVATE');
  expect(JSON.stringify(event)).not.toContain('DO_NOT_EXFILTRATE');
  await page.locator('#analytics-open').click();
  await page.locator('#analytics-reject').click();
  await expect.poll(()=>page.evaluate(()=>window.ITMO_ANALYTICS_STATUS().consent)).toBe('denied');
  await expect(page.locator('script#itmo-plausible-script')).toHaveCount(0);
  await expect(page.locator('#analytics-status')).toContainText('запретили');
});

test('reject before opt-in: no third-party script even after reload',async ({page})=>{
  await page.route('**/analytics-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.ITMO_ANALYTICS_CONFIG={provider:'plausible',siteScriptUrl:'https://plausible.io/js/pa-test123.js',legalReady:true};"
  }));
  await page.goto('./');
  await page.locator('#analytics-banner-reject').click();
  await expect(page.locator('#analytics-banner')).toBeHidden();
  await page.reload();
  await expect(page.locator('#analytics-banner')).toBeHidden();
  await expect(page.locator('script#itmo-plausible-script')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.ITMO_ANALYTICS_STATUS().consent)).toBe('denied');
});
