import {chromium, webkit, firefox, devices} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fillMoney} from './scorecard-test-helpers.mjs';
const out='local-test-artifacts/check-visuals-2026-11-10';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const checks=[];
for(const [name,engine] of Object.entries({chromium,webkit,firefox})){
 const browser=await engine.launch();const mobileOptions = name === 'webkit' ? devices['iPhone 13'] : name === 'chromium' ? devices['Pixel 7'] : {hasTouch:true};const context=await browser.newContext({...mobileOptions,viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='ffm.test')return route.abort();
  const f=path.resolve(process.cwd(),'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!f.startsWith(process.cwd()+path.sep))return route.abort();
  try{await route.fulfill({body:await readFile(f),contentType:types[path.extname(f)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:844});await page.goto('http://ffm.test/');await page.locator('[data-start]').click();
  for(const [field,value] of Object.entries({income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250})){await fillMoney(page,field,value);await page.locator('[data-next]').click();}
  assert.equal(await page.locator('#step-heading-6 .question-emphasis').textContent(),'mortgage');
  assert.equal(await page.locator('#step-heading-6 .question-emphasis').evaluate(n=>getComputedStyle(n).color),'rgb(233, 92, 3)');
  if(width===390)await page.locator('#score-form').screenshot({path:`${out}/${name}-mortgage.png`});
  // Back and forward preserves the emphasis and existing question count.
  await page.locator('[data-back]').click();await page.locator('[data-next]').click();assert.equal(await page.locator('.flow-step').count(),9);
  await fillMoney(page,'totalDebtBalance',18120);await fillMoney(page,'minimumDebtPayment',500);await page.locator('[data-next]').click();
  await fillMoney(page,'emergencyFundSaved',4000);await fillMoney(page,'emergencyFundGoal',8000);await page.locator('[data-next]').click();
  await fillMoney(page,'investmentsCurrentValue',2500);await page.locator('[data-next]').click();await page.getByRole('button',{name:'Stable',exact:true}).click();await page.locator('[data-next]').click();
  await page.locator('[data-save-report]').waitFor();await page.locator('.report-details > summary').click();
  assert.equal(await page.locator('.flight-check').count(),6);assert.equal(await page.locator('.check-meter').count(),4);assert.equal(await page.locator('.check-status').count(),2);
  assert.equal(await page.locator('[data-report-score]').innerText(),'75');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.match(await page.locator('.flight-check').nth(1).innerText(),/8.3% saved/);
  if(width===390||width===1280)await page.locator('.checks-grid').screenshot({path:`${out}/${name}-checks-${width}.png`});
  await page.locator('.report-details > summary').click();await page.locator('.report-details > summary').click();assert.equal(await page.locator('.check-visual').count(),6);
  checks.push({engine:name,mobileEmulation:name!=='firefox',touch:true,width,score:75,checks:6,meters:4,milestones:2,noOverflow:true,mortgageOrange:true,nineSteps:true});
 }
 assert.deepEqual(errors,[]);await browser.close();
}
await writeFile(`${out}/visual-verification.json`,JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
