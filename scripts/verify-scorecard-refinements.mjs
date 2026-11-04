import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fillMoney} from './scorecard-test-helpers.mjs';
const out=process.env.SCORECARD_EVIDENCE_DIR||'docs/scorecard-refinements/evidence';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:process.env.FFM_SINGLE_PROCESS?['--single-process','--no-zygote','--in-process-gpu']:[]});
const checks=[],errors=[],requests=[];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4'};
const baseline={income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,minimumDebtPayment:500,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500};
async function load(page,entry='/') {await page.goto('http://ffm.test'+entry);await page.locator('[data-start]').waitFor();}
async function run(page,v,{invalid=false}={}) {
 await page.locator('[data-start]').click();
 for(const field of ['income','needs','wants','savings','extraDebtPayment']){await fillMoney(page,field,v[field]);await page.locator('[data-next]').click();}
 await fillMoney(page,'totalDebtBalance',v.totalDebtBalance);
 if(v.totalDebtBalance>0){
  assert.equal(await page.locator('#minimumDebtPayment').isVisible(),true);
  if(invalid){await fillMoney(page,'minimumDebtPayment',v.needs+1);await page.locator('[data-next]').click();assert.match(await page.locator('#form-error').innerText(),/part of your needs/);}
  if(v.minimumDebtPayment!==null)await fillMoney(page,'minimumDebtPayment',v.minimumDebtPayment);else await page.locator('#minimumDebtPayment').fill('');
 }else assert.equal(await page.locator('#minimumDebtPayment').isVisible(),false);
 await page.locator('[data-next]').click();
 await fillMoney(page,'emergencyFundSaved',v.emergencyFundSaved);await fillMoney(page,'emergencyFundGoal',v.emergencyFundGoal);await page.locator('[data-next]').click();
 await fillMoney(page,'investmentsCurrentValue',v.investmentsCurrentValue);await page.locator('[data-next]').click();
 await page.getByRole('button',{name:'Stable',exact:true}).click();await page.locator('[data-next]').click();
 await page.locator('[data-save-report]').waitFor();
 assert.equal(await page.locator('#flight-report').count(),1);
 assert.equal(await page.locator('.report-details').getAttribute('open'),null);
 assert.equal(await page.locator('[data-save-report]').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,JSON.stringify(await page.locator('#flight-report *').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(n=>({tag:n.tagName,cls:n.className,text:n.textContent.slice(0,90),right:n.getBoundingClientRect().right})))));
}
try {
 const context=await browser.newContext({reducedMotion:'reduce',acceptDownloads:true,viewport:{width:390,height:844}});
 // Serve the checkout directly. Block remote analytics and email so this test cannot send user data.
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());requests.push({url:u.href,body:route.request().postData()});
  if(u.protocol==='file:') return route.continue();
  if(u.hostname!=='ffm.test')return route.abort();
  const file=path.join(process.cwd(),decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
  if(!file.startsWith(process.cwd()+path.sep))return route.abort();
  try{return await route.fulfill({body:await readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:width===1280?1000:844});await load(page);
  assert.match(await page.locator('h1').innerText(),/Your numbers\.\s+A clearer picture\.\s+One practical next move\./);
  assert.equal(await page.locator('.v3-ring strong').innerText(),'69');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,JSON.stringify(await page.locator('#flight-report *').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(n=>({tag:n.tagName,cls:n.className,text:n.textContent.slice(0,90),right:n.getBoundingClientRect().right})))));
  await page.screenshot({path:`${out}/landing-${width}.png`});
  await run(page,baseline,{invalid:true});assert.equal(await page.locator('[data-report-score]').innerText(),'75');
  const opening=await page.locator('#flight-report').innerText();assert.match(opening,/Why this comes first/);
  const order=await page.locator('#flight-report').evaluate(n=>['.report-score','.one-move','#report-checkpoint','.report-details'].map(s=>n.querySelector(s).getBoundingClientRect().top));assert.ok(order.every((n,i)=>!i||n>order[i-1]));
  await page.locator('#flight-report').screenshot({path:`${out}/report-opening-${width}.png`});
  await page.locator('.report-details > summary').click();assert.equal(await page.locator('.instrument-grid').isVisible(),true);
  assert.match(await page.locator('#flight-report').innerText(),/Required debt payment share/);
  assert.match(await page.locator('#flight-report').innerText(),/\$4,000 of \$8,000/);
  await page.locator('#flight-report').screenshot({path:`${out}/report-expanded-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,JSON.stringify(await page.locator('#flight-report *').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(n=>({tag:n.tagName,cls:n.className,text:n.textContent.slice(0,90),right:n.getBoundingClientRect().right})))));
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-save-report]').click()]);
  await download.saveAs(`${out}/synthetic-report-${width}.html`);const html=await readFile(`${out}/synthetic-report-${width}.html`,'utf8');
  assert.match(html,/\$500.00/);assert.match(html,/Why this comes first/);assert.doesNotMatch(html,/<script|<form|<iframe|https?:\/\//i);
  assert.ok(html.includes(await page.locator('.one-move h3').textContent()));
  if(width===390){
    const saved=await context.newPage();await saved.goto('file://'+path.resolve(out,`synthetic-report-${width}.html`));
    assert.match(await saved.locator('h1').innerText(),/Your Flight Report/);
    assert.equal(await saved.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await saved.setViewportSize({width:850,height:1100});await saved.screenshot({path:`${out}/saved-report-desktop.png`,fullPage:true});
    await saved.pdf({path:`${out}/synthetic-report.pdf`,format:'A4',printBackground:true});await saved.close();
  }
  await page.evaluate(()=>{window.open=()=>null;});await page.locator('[data-print-report]').click();assert.match(await page.locator('[data-save-status]').innerText(),/Allow this print window/);
  await page.locator('[data-edit-report]').click();assert.equal(await page.locator('#flight-report').isVisible(),false);assert.equal(await page.locator('#income').inputValue(),'6,000');
  checks.push({width,score:75,download:true,edit:true,openingOrder:true,noOverflow:true});
 }
 for(const [name,v,score] of [['Unknown payment',{...baseline,minimumDebtPayment:null},63],['No debt',{...baseline,totalDebtBalance:0,minimumDebtPayment:null},75],['Deficit',{...baseline,income:4200},50],['Fully assigned',{...baseline,savings:1150},85]]){
  await load(page);await run(page,v);assert.equal(Number(await page.locator('[data-report-score]').innerText()),score,name);
  if(name==='Unknown payment')assert.match(await page.locator('.report-score').innerText(),/Debt assessment limited/);
  if(name==='Deficit')assert.match(await page.locator('.one-move h3').textContent(),/Find \$1,150/);
  if(name==='Fully assigned')assert.match(await page.locator('.report-score').innerText(),/every dollar is assigned/);
  checks.push({name,score});
 }
 await page.emulateMedia({reducedMotion:'no-preference'});await load(page);await run(page,baseline);
 await page.waitForFunction(()=>!document.querySelector('.reveal-overlay'));checks.push({animatedReveal:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 await load(page,'/ffm-scorecard.html');await run(page,baseline);assert.equal(await page.locator('[data-report-score]').innerText(),'75');checks.push({legacyEntry:true});
 const ev=await page.evaluate(()=>window.dataLayer.filter(e=>e[0]==='event').map(e=>({name:e[1],params:e[2]})));
 for(const event of ev)for(const key of Object.keys(event.params||{}))assert.doesNotMatch(key,/income|needs|wants|savings|debt|fund|invest|amount|value/i);
 assert.equal(requests.some(r=>r.url.includes('/subscribe')),false);
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 assert.deepEqual(errors,[]);
 const evidence={browser:await browser.version(),checks,errors,analyticsKeysOnly:true,noFinancialSubmission:true};await writeFile(`${out}/verification.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
}finally{await browser.close();}
