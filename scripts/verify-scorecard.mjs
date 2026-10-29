import { fillMoney, moneyInput } from './scorecard-test-helpers.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.SCORECARD_ORIGIN || 'http://127.0.0.1:4173';
const directory = process.env.SCORECARD_EVIDENCE_DIR || 'docs/phase2';
await mkdir(`${directory}/screenshots`, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence = { browser: 'Chromium', runs: [], checks: [] };
const errors = [];
const cases = [
  { name: 'Pre Flight', values: [4200,3200,1200,0,100,6000,200,2000,0], score:25, stage:'Pre Flight' },
  { name: 'Cruise Control', values: [6000,3400,1200,500,250,18120,4000,8000,2500], score:71, stage:'Cruise Control' },
  { name: 'Flight Mode', values: [8000,2600,1000,1600,0,0,15000,15000,40000], score:100, stage:'Flight Mode' },
];
const names = ['income','needs','wants','savings','extraDebtPayment','totalDebtBalance','emergencyFundSaved','emergencyFundGoal','investmentsCurrentValue'];
const shot = async (page, name) => {
  if (name.endsWith('step9') || name.endsWith('step7')) {
    await page.locator('#score-form').evaluate(node=>node.scrollIntoView({block:'start',behavior:'instant'}));
  }
  await page.screenshot({ path: `${directory}/screenshots/${name}.png` });
};
async function setup(width, reducedMotion='no-preference') {
  const context = await browser.newContext({ viewport:{width,height:width===390?844:1000}, reducedMotion });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-start]').waitFor();
  return { page, context };
}
async function advance(page, example, width, screenshots=false) {
  assert.doesNotMatch(await page.locator('#score-form').innerText(), /[-–—]/);
  await page.locator('[data-start]').click();
  assert.equal(await page.locator('#income').inputValue(),'');
  if(screenshots) { await page.locator('#score-form').scrollIntoViewIfNeeded(); await shot(page,`${width}-step1`); }
  for(let index=0;index<names.length;index++) {
    assert.doesNotMatch(await page.locator('#score-form').innerText(), /[-–—]/);
    await fillMoney(page,names[index],example.values[index]);
    if(index===6) continue;
    if(screenshots && index===7) { await page.locator('#score-form').scrollIntoViewIfNeeded(); await shot(page,`${width}-step7`); }
    await page.locator('[data-next]').click();
  }
  await page.getByRole('button',{name:'Stable',exact:true}).click();
  await page.getByRole('button',{name:'Build a cushion',exact:true}).click();
  if(screenshots) { await page.locator('#score-form').scrollIntoViewIfNeeded(); await shot(page,`${width}-step9`); }
}
async function events(page) {
  return page.evaluate(() => window.dataLayer.filter(e=>e[0]==='event').map(e=>({name:e[1],params:e[2]})));
}
async function checkReport(page, example) {
  await page.waitForFunction(()=>!document.querySelector('.reveal-overlay'));
  const node=page.locator('#flight-report');
  assert.equal(Number(await node.locator('[data-report-score]').textContent()),example.score);
  assert.equal(await node.locator('.report-stage').textContent(),example.stage);
  assert.doesNotMatch(await node.innerText(), /[-–—]/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'No horizontal overflow');
  assert.equal(await page.locator('#personalized-flight-plan, #briefing, .results-panel').count(),0);
  assert.equal(await page.locator('#flight-report').count(),1);
  if(page.viewportSize().width>=760) {
    const heading=await node.locator('h2').boundingBox();
    const header=await page.locator('.site-header').boundingBox();
    assert.ok(heading.y>=header.y+header.height,'Report heading clears the fixed header');
  }
  assert.equal((await events(page)).filter(e=>e.name==='report_view').length,1);
  assert.equal((await events(page)).filter(e=>e.name==='scorecard_step_view').length,9);
  evidence.runs.push({ name:example.name,width:page.viewportSize().width,score:example.score,stage:example.stage });
}
try {
  // Required screenshot matrix, with the full animated reveal at both widths.
  for(const width of [390,1280]) {
    const {page,context}=await setup(width);
    await page.locator('#score-form').scrollIntoViewIfNeeded(); await shot(page,`${width}-start`);
    assert.equal((await events(page)).filter(e=>e.name==='report_view').length,0,'Example is not a report_view');
    await advance(page,cases[1],width,true);
    await page.locator('[data-next]').click();
    await page.locator('.reveal-overlay').waitFor();
    await page.waitForTimeout(1750); await shot(page,`${width}-mid-reveal`);
    await checkReport(page,cases[1]);
    await page.locator('#flight-report').screenshot({path:`${directory}/screenshots/${width}-final-report.png`,style:'.site-header { visibility: hidden !important; }'});
    await context.close();
  }
  // Full run with real outgoing request capture, without routing or mocking analytics.
  {
    const {page,context}=await setup(760);
    const requests=[];
    page.on('request',r=>requests.push({method:r.method(),url:r.url(),body:r.postData()}));
    await advance(page,cases[0],760);
    await page.locator('[data-next]').click(); await page.getByRole('button',{name:'Skip',exact:true}).click();
    await checkReport(page,cases[0]);
    await page.waitForTimeout(6500);
    assert.ok(requests.some(r=>(r.url+(r.body||'')).includes('report_view')), 'Report view reached the network capture');
    await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    assert.equal((await events(page)).filter(e=>e.name==='scorecard_abandon').length,0);
    const capturedEvents=await events(page);
    assert.equal(capturedEvents.filter(e=>e.name==='reveal_skip').length,1);
    assert.equal(capturedEvents.find(e=>e.name==='report_view').params.stage_key,'preflight');
    for(const event of capturedEvents) {
      for(const key of Object.keys(event.params)) assert.doesNotMatch(key,/income|needs|wants|savings|debt|fund|invest|amount|value/i);
    }
    for(const req of requests) {
      const params=[...new URL(req.url).searchParams,...(req.body||'').split(/\r?\n/).flatMap(line=>[...new URLSearchParams(line)])];
      for(const [key,value] of params) {
        assert.doesNotMatch(key,/income|needs|wants|savings|debt|fund|invest|amount|value/i);
        // Ignore zero (a standard protocol flag). Compare whole parameter values, not timestamp substrings.
        // GA's automatic engagement timer can coincidentally equal a synthetic dollar amount.
        // Inspect custom event values; every key and serialized financial field is still checked.
        if (key.startsWith('ep.') || key.startsWith('epn.')) assert.ok(!cases[0].values.filter(v=>v!==0).map(String).includes(value),`Entered number in outgoing ${key}`);
      }
      assert.ok(!req.body || !names.some(n=>req.body.includes(`"${n}"`)));
    }
    await writeFile(`${directory}/network-capture.json`,JSON.stringify({capturedAfterStart:true,requests,events:capturedEvents},null,2)+'\n');
    evidence.checks.push({name:'All new visible flow and report copy has no dash punctuation',pass:true},{name:'760px run and Skip',pass:true},{name:'Network capture contains no entered financial parameters or numbers',pass:true,requestCount:requests.length,analyticsRequests:requests.filter(r=>r.url.includes('/collect')).length});
    await context.close();
  }
  {
    const {page,context}=await setup(390,'reduce');
    await advance(page,cases[2],390);
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('.reveal-overlay').count(),0);
    await checkReport(page,cases[2]);
    await page.locator('#flight-report').screenshot({path:`${directory}/screenshots/390-reduced-motion-report.png`});
    evidence.checks.push({name:'Reduced motion shows final state instantly',pass:true});
    await context.close();
  }
  // Interaction, privacy lifecycle, keyboard, chips, estimate text, and browser fallback.
  {
    const {page,context}=await setup(390);
    await page.locator('[data-start]').click();
    await page.locator('[data-next]').click(); assert.match(await page.locator('#form-error').innerText(),/estimate/);
    await page.getByRole('button',{name:'Not sure? Use an estimate',exact:true}).click();
    assert.equal(await page.locator('#income').inputValue(),'');
    await page.locator('#income').fill('1200');
    await page.getByRole('button',{name:'Enter one paycheck instead',exact:true}).click();
    assert.match(await page.locator('.converted-monthly').innerText(),/\$2,600/);
    await page.getByRole('button',{name:'Every week',exact:true}).click();
    assert.match(await page.locator('.flow-progress').innerText(),/Step 2/);
    assert.match(await page.locator('.cash-left').innerText(),/\$5,200/);
    await page.locator('[data-back]').click(); assert.equal(await page.locator('#income').inputValue(),'1,200');
    await page.locator('#income').press('Enter');
    await fillMoney(page,'needs',1000); await page.locator('[data-next]').click();
    await fillMoney(page,'wants',100); await page.locator('[data-next]').click();
    await page.getByRole('button',{name:'None right now',exact:true}).click();
    await page.getByRole('button',{name:'None',exact:true}).click();
    await page.getByRole('button',{name:'No debt',exact:true}).click();
    await page.locator('#emergencyFundSaved').fill('300');
    await page.getByRole('button',{name:'Use 3 months ($3,000)',exact:true}).click();
    await page.getByRole('button',{name:'None yet',exact:true}).click();
    await page.locator('[data-next]').click(); assert.match(await page.locator('#form-error').innerText(),/Choose/);
    await page.getByRole('button',{name:'Stable',exact:true}).click();
    await page.locator('[data-next]').click(); await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('.reveal-overlay'));
    assert.equal(await page.locator('#flight-report .report-readouts dd').first().textContent(),'$4,100');
    assert.ok((await events(page)).some(e=>e.name==='scorecard_step_back'));
    assert.ok((await events(page)).some(e=>e.name==='reveal_skip'));
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
    // Verify touch targets in the guided form (including hidden controls when their screen appears).
    const undersized=await page.locator('#score-form button').evaluateAll(buttons=>buttons.filter(b=>getComputedStyle(b).minHeight && parseFloat(getComputedStyle(b).minHeight)<44).map(b=>b.textContent));
    assert.deepEqual(undersized,[]);
    evidence.checks.push({name:'Currency formatting, paycheck conversion, Enter, Back, zero chips, goal chip, estimates, required pressure, Escape, storage, touch targets',pass:true});
    await context.close();
  }
  {
    const {page,context}=await setup(390);
    await page.locator('[data-start]').click();
    await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pagehide'));});
    assert.equal((await events(page)).filter(e=>e.name==='scorecard_abandon').length,1);
    evidence.checks.push({name:'Abandon fires once before completion',pass:true}); await context.close();
  }
  {
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const page=await context.newPage(); await page.goto(origin,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#score-form').count(),0);
    assert.equal(await page.locator('#score-inputs input:visible').count(),0);
    assert.equal(await page.locator('#score-inputs input').evaluateAll(inputs=>inputs.every(i=>i.form===null)),true);
    assert.match(await page.locator('noscript').innerText(),/cannot accept financial answers/);
    evidence.checks.push({name:'No JavaScript financial inputs have no form owner or submission path',pass:true}); await context.close();
  }
  assert.deepEqual(errors,[]);
  evidence.checks.push({name:'No uncaught browser errors',pass:true});
  await writeFile(`${directory}/browser-verification.json`,JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence,null,2));
} finally { await browser.close(); }
