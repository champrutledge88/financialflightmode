import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';
const out=process.env.SCORECARD_EVIDENCE_DIR||'docs/landing-layout';
await mkdir(`${out}/screenshots`,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [390,760,1280]) {
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('[data-start]').waitFor();
  const sections=await page.locator('main > section').evaluateAll(ns=>ns.map(n=>n.className));
  assert.deepEqual(sections.slice(0,3),['hero-section','walkthrough-section','scorecard-shell']);
  assert.equal(await page.locator('.flight-notes-feature,.starter-kit-strip,.cta-section').count(),0);
  assert.equal(await page.locator('#cockpit-walkthrough-video').isVisible(),true);
  assert.match(await page.locator('h1').innerText(),/Flight Plan Budget/i);
  assert.ok(await page.locator('.hero-copy').evaluate(n=>n.getBoundingClientRect().right<=innerWidth),'Hero copy fits without hidden clipping');
  const ctas=await page.locator('a,button').evaluateAll(ns=>ns.filter(n=>/starter kit/i.test(n.textContent)&&n.checkVisibility()).map(n=>n.textContent.trim()));
  assert.deepEqual(ctas,['Get Starter Kit','Send Me The Starter Kit']);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  const broken=await page.locator('a[href^="#"]').evaluateAll(ns=>ns.filter(n=>!document.getElementById(n.hash.slice(1))).map(n=>n.hash));assert.deepEqual(broken,[]);
  await page.screenshot({path:`${out}/screenshots/after-${width}.png`,fullPage:true});
  await page.locator('#cockpit-walkthrough').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/screenshots/video-cockpit-${width}.png`});
  const summary=page.locator('#cockpit-walkthrough > summary');await summary.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('#cockpit-walkthrough').open);
  await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough').open);
  await page.locator('.header-cta').click();assert.equal(new URL(page.url()).hash,'#flight-briefing-form');
  assert.match(await page.locator('.signup-disclosure').innerText(),/Weekly Briefing is separate/);
  assert.equal(await page.getByRole('link',{name:'Get Newsletter',exact:true}).getAttribute('href'),'https://briefing.financialflightmode.com');
  let requests=0;
  await page.route('https://assets.mailerlite.com/jsonp/**',route=>{requests++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(requests===1?{success:false}:{success:true})});});
  await page.locator('#lead-form button').click();assert.equal(requests,0);
  await page.locator('#leadEmail').fill('preview-check@example.com');await page.locator('#lead-form button').click();
  await page.waitForFunction(()=>document.querySelector('#leadStatus').textContent.includes("couldn't"));
  await page.locator('#lead-form button').click();await page.waitForURL('**/thank-you.html');assert.equal(requests,2);
  await page.goto(`${new URL(origin).origin}/thank-you-download.html`);
  assert.equal(await page.locator('a[download]').getAttribute('href'),'/assets/downloads/financial-flight-mode-starter-kit.zip');
  assert.deepEqual(errors,[]);results.push({width,sections,ctas,noOverflow:true,reducedMotion:true,keyboardDisclosure:true,anchors:true,consent:true,newsletter:true,mockedLeadErrorAndSuccess:true,downloadLink:true,errors});await page.close();
 }
 await writeFile(`${out}/verification.json`,JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
