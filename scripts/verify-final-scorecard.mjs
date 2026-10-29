import { fillMoney, moneyInput } from './scorecard-test-helpers.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dir=process.env.SCORECARD_EVIDENCE_DIR||'/tmp/ffm-final-review';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const fields=['income','needs','wants','savings','extraDebtPayment','totalDebtBalance','emergencyFundSaved','emergencyFundGoal','investmentsCurrentValue'];
async function run(values){
 for(let i=0;i<fields.length;i++) {await fillMoney(page,fields[i],values[i]);if(i!==6)await page.locator('[data-next]').click();}
 await page.getByRole('button',{name:'Stable',exact:true}).click();
 await page.getByRole('button',{name:'Save more consistently',exact:true}).click();
 await page.locator('[data-next]').click();
 await page.locator('[data-save-report]').waitFor();
}
const checks=[];
try {
 await page.goto(origin+'/#scorecard');
 assert.equal(await page.locator('[data-save-report]').count(),0);
 await page.locator('[data-start]').click();
 for(const invalid of ['', '-1','unknown','1.234','Infinity']){
  await page.locator('#income').fill(invalid);await page.locator('[data-next]').click();
  assert.match(await page.locator('.flow-progress').innerText(),/Step 1/);
  assert.equal(await page.locator('#income').getAttribute('aria-invalid'),'true');
 }
 await run([6000,4240,1200,300,250,6000,200,2000,0]);
 assert.match(await page.locator('.one-move h3').innerText(),/Move \$10 /i);
 assert.equal(await page.locator('#flight-report').count(),1);
 assert.equal(await page.locator('#briefing,#personalized-flight-plan').count(),0);
 assert.match(await page.locator('#flight-report').innerText(),/Your focus: Stable · Save more consistently/);
 checks.push('Invalid and unknown income cannot advance; tiny cash recommends only $10; one canonical result and saved focus');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-save-report]').click()]);
 const path=dir+'/'+download.suggestedFilename();await download.saveAs(path);const html=await readFile(path,'utf8');
 assert.match(html,/Move \$10 /i);assert.match(html,/\$4,240.00/);assert.match(html,/What will I adjust/);assert.doesNotMatch(html,/<script|<form|<iframe|https?:\/\//i);
 const saved=await context.newPage();const requests=[];saved.on('request',r=>requests.push(r.url()));
 await saved.goto('file://'+path);await saved.emulateMedia({media:'print'});
 await saved.screenshot({path:dir+'/saved-report-print-layout.png',fullPage:true});
 assert.equal(await saved.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await saved.setViewportSize({width:850,height:1100});await saved.screenshot({path:dir+'/saved-report-desktop.png',fullPage:true});
 assert.equal(requests.filter(u=>/^https?:/.test(u)).length,0);
 await saved.pdf({path:dir+'/synthetic-flight-report.pdf',format:'A4',printBackground:true});
 checks.push('HTML download opens offline with exact input amounts, dated priority and reflection; no network requests; print layout rendered at mobile and desktop widths');
 await page.evaluate(()=>{window.__printCalls=0;const open=window.open.bind(window);window.open=(...args)=>{const w=open(...args);w.print=()=>{window.__printCalls++};return w;};});
 const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator('[data-print-report]').click()]);
 assert.match(await popup.locator('body').innerText(),/Move \$10 /i);
 assert.equal(await page.evaluate(()=>window.__printCalls),1);await popup.close();
 checks.push('Print control opens same canonical standalone report and invokes native print entry point');
 await page.locator('[data-edit-report]').click();assert.equal(await page.locator('#flight-report').isVisible(),false);
 assert.equal(await page.locator('#income').inputValue(),'6,000');
 await page.locator('#income').fill('6100');await page.locator('[data-next]').click();await page.locator('[data-back]').click();assert.equal(await page.locator('#income').inputValue(),'6,100');
 await run([6000,4249.01,1200,300,250,6000,200,2000,0]);
 assert.match(await page.locator('.one-move h3').innerText(),/Move \$0.99 /i);
 assert.equal(await page.locator('#flight-report').count(),1);
 await page.locator('a[href="#flight-report"]').first().click();assert.equal(new URL(page.url()).hash,'#flight-report');
 assert.equal(new URL(page.url()).search,'');assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 checks.push('Edit, Back and recalculation preserve answers and replace stale report; cents cap; Results navigation; no answers in URL or web storage');
 await page.locator('#flight-report').screenshot({path:dir+'/final-report-390.png'});
 // Both entry points must retain the same safe no JavaScript behavior.
 for(const path of ['/', '/ffm-scorecard.html']) {
  const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();await p.goto(origin+path);
  assert.equal(await p.locator('#score-inputs input').evaluateAll(a=>a.every(i=>i.form===null)),true);
  assert.equal(await p.locator('#score-inputs input:visible').count(),0);
  assert.equal(await p.locator('form').count(),1); // Separate email form remains unchanged.
  assert.match(await p.locator('noscript').innerText(),/cannot accept financial answers/);await c.close();
 }
 checks.push('Both entry pages: no JavaScript financial form or form-owned financial inputs; email lead form preserved');
 const legacy=await context.newPage();await legacy.goto(origin+'/ffm-scorecard.html');await legacy.locator('[data-start]').click();assert.equal(await legacy.locator('#income').inputValue(),'');await legacy.close();
 assert.deepEqual(errors,[]);await writeFile(dir+'/finalization-verification.json',JSON.stringify({checks,errors},null,2)+'\n');console.log(JSON.stringify({checks,errors},null,2));
} finally {await browser.close();}
