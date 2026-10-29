import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';const out=process.env.SCORECARD_EVIDENCE_DIR||'/tmp/ffm-category-review';await mkdir(out,{recursive:true});
const browser=await chromium.launch();const checks=[];const errors=[];
const editor=(page,field)=>page.locator(`[data-field="${field}"]`);
const amounts=(page,field)=>editor(page,field).locator('[data-row-amount]');
const total=(page,field)=>editor(page,field).locator('.category-total');
async function fillRows(page,field,values){for(let i=0;i<values.length;i++)await amounts(page,field).nth(i).fill(String(values[i]));}
async function next(page){await page.locator('[data-next]').click();}
try {
 for(const width of [390,1280]) {
  const context=await browser.newContext({viewport:{width,height:1080},reducedMotion:'reduce',acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#scorecard');await page.locator('[data-start]').click();const requests=[];page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
  await page.locator('#income').fill('6000');await next(page);
  await next(page);assert.match(await page.locator('#form-error').innerText(),/at least one row/);
  for(const invalid of ['-1','unknown','1.234']) {await amounts(page,'needs').first().fill(invalid);await next(page);assert.match(await page.locator('.flow-progress').innerText(),/Step 2/);assert.match(await total(page,'needs').innerText(),/Check your entries/);}
  await fillRows(page,'needs',[1800,250,150,700,500]);assert.match(await total(page,'needs').innerText(),/\$3,400.00/);assert.equal(await page.locator('#needs').inputValue(),'3400.00');
  await page.locator('#score-form').screenshot({path:out+`/needs-${width}.png`,style:'.site-header,.skip-link{visibility:hidden!important}'});
  await next(page);await fillRows(page,'wants',[300,300,600]);assert.match(await total(page,'wants').innerText(),/\$1,200.00/);
  await page.locator('#score-form').screenshot({path:out+`/wants-${width}.png`,style:'.site-header,.skip-link{visibility:hidden!important}'});
  await next(page);assert.equal(await page.locator('.flow-step:visible input:not([type=hidden])').count(),1);await page.locator('#savings').fill('500');await next(page);
  await page.locator('#extraDebtPayment').fill('250');await next(page);await page.locator('#totalDebtBalance').fill('18120');await next(page);await page.locator('#emergencyFundSaved').fill('4000');await page.locator('#emergencyFundGoal').fill('8000');
  assert.match(await page.locator('[data-runway-goal]').innerText(),/\$10,200/);await next(page);
  await fillRows(page,'investmentsCurrentValue',[1500,1000]);const accounts=editor(page,'investmentsCurrentValue');
  await accounts.locator('[data-row-label]').nth(1).fill('HYSA');await next(page);assert.match(await page.locator('#form-error').innerText(),/Choose Cash or high yield savings/);
  await accounts.locator('[data-row-label]').nth(1).fill('');await accounts.locator('.add-category').click();
  await accounts.locator('[data-row-kind]').last().selectOption('cash');await accounts.locator('[data-row-label]').last().fill('HYSA reserve');await accounts.locator('[data-row-amount]').last().fill('4000');
  assert.match(await total(page,'investmentsCurrentValue').innerText(),/\$2,500.00/);assert.match(await accounts.locator('.cash-reference-total').innerText(),/\$4,000.00/);
  assert.equal(await page.locator('#emergencyFundSaved').inputValue(),'4,000');
  await page.locator('#score-form').screenshot({path:out+`/accounts-${width}.png`,style:'.site-header,.skip-link{visibility:hidden!important}'});
  await next(page);await page.getByRole('button',{name:'Stable',exact:true}).click();await page.getByRole('button',{name:'Save more consistently',exact:true}).click();await next(page);await page.locator('[data-save-report]').waitFor();
  assert.equal(await page.locator('[data-report-score]').innerText(),'71');assert.equal(await page.locator('.report-stage').innerText(),'CRUISE CONTROL');assert.match(await page.locator('.one-move h3').innerText(),/MOVE \$100 /);
  assert.match(await page.locator('#flight-report').innerText(),/Cash accounts listed here are excluded from investing/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-save-report]').click()]);const path=out+`/fixture-${width}.html`;await download.saveAs(path);const html=await readFile(path,'utf8');
  for(const token of ['Housing','Minimum debt payments','Roth IRA','Brokerage investments','HYSA reserve','$2,500.00','$4,000.00'])assert.ok(html.includes(token),token);
  assert.match(html,/not added to your Step 7 emergency balance/);
  if(width===1280){const saved=await context.newPage();await saved.goto('file://'+path);await saved.pdf({path:out+'/fixture-1280.pdf',format:'A4',printBackground:true});await saved.close();}
  await page.locator('#flight-report').screenshot({path:out+`/report-${width}.png`,style:'.site-header,.skip-link{visibility:hidden!important}'});
  await page.locator('[data-edit-report]').click();await next(page);assert.equal(await amounts(page,'needs').first().inputValue(),'1,800');
  const needs=editor(page,'needs');await needs.locator('.add-category').click();await needs.locator('[data-row-label]').last().fill('Transit');await next(page);assert.match(await page.locator('#form-error').innerText(),/named row/);
  await needs.locator('[data-row-amount]').last().fill('.10');await needs.locator('.add-category').click();await needs.locator('[data-row-label]').last().fill('PRIVATE_LABEL_8Q');await needs.locator('[data-row-amount]').last().fill('.20');assert.match(await total(page,'needs').innerText(),/\$3,400.30/);
  await needs.getByRole('button',{name:'Remove Transit',exact:true}).click();assert.match(await total(page,'needs').innerText(),/\$3,400.20/);await needs.getByRole('button',{name:'Remove PRIVATE_LABEL_8Q',exact:true}).click();assert.match(await total(page,'needs').innerText(),/\$3,400.00/);
  await amounts(page,'needs').first().press('Enter');assert.match(await page.locator('.flow-progress').innerText(),/Step 2/); // Enter moves through rows; Continue remains explicit.
  await next(page);await page.locator('[data-back]').click();assert.equal(await amounts(page,'needs').first().inputValue(),'1,800');
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.equal(new URL(page.url()).search,'');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.waitForTimeout(1500);
  for(const request of requests){assert.ok(!request.includes('PRIVATE_LABEL_'),'No private account/category nickname leaves browser');assert.ok(!request.includes('HYSA'),'No account type/label leaves browser');}
  const events=await page.evaluate(()=>window.dataLayer.filter(e=>e[0]==='event').map(e=>({name:e[1],params:e[2]})));
  for(const e of events) for(const [key,value] of Object.entries(e.params)){assert.doesNotMatch(key,/income|needs|wants|savings|debt|fund|invest|amount|value|account|nickname|label/i);assert.ok(!String(value).includes('PRIVATE_LABEL_'));}
  await writeFile(out+`/network-${width}.json`,JSON.stringify({requests,events},null,2));
  checks.push({width,needs:3400,wants:1200,savingsSingleField:true,investments:2500,cashReference:4000,emergencyUnchanged:4000,score:71,stage:'Cruise Control',priority:'Savings System',nextMove:100,suggestedRunway:10200,backEdit:true,centsRemoval:true,invalidBlocked:true,privateLabelsStayLocal:true});await context.close();
 }
 // Removal to empty, deliberate zero, and keyboard access to add controls.
 const c=await browser.newContext({viewport:{width:390,height:844}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin,{waitUntil:'networkidle'});await p.locator('[data-start]').click();await p.locator('#income').fill('1000');await next(p);
 const n=editor(p,'needs');while(await n.locator('.remove-category').count())await n.locator('.remove-category').first().click();await next(p);assert.match(await p.locator('#form-error').innerText(),/at least one row/);assert.equal(await n.locator('.add-category').evaluate(e=>e===document.activeElement),true);
 await n.locator('.add-category').press('Enter');await n.locator('[data-row-label]').fill('No monthly needs');await n.locator('[data-row-amount]').fill('0');await next(p);assert.match(await p.locator('.flow-progress').innerText(),/Step 3/);await c.close();
 assert.deepEqual(errors,[]);await writeFile(out+'/verification.json',JSON.stringify({origin,checks,removeAllAndZero:true,errors},null,2));console.log(JSON.stringify({checks,removeAllAndZero:true,errors},null,2));
} finally {await browser.close();}
