import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';
const out=process.env.SCORECARD_EVIDENCE_DIR||'docs/landing-layout';
await mkdir(`${out}/screenshots`,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [320,390,760,1280]) {
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('[data-start]').waitFor();
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  const sections=await page.locator('main > section').evaluateAll(ns=>ns.map(n=>n.className));
  assert.deepEqual(sections.slice(0,6),['hero-section v3-hero','walkthrough-section','scorecard-shell','v3-preview','v3-how','email-section v3-kit']);
  assert.equal(await page.locator('.flight-notes-feature,.starter-kit-strip,.cta-section').count(),0);
  assert.equal(await page.locator('#cockpit-walkthrough-video').isVisible(),false,'Optional player does not delay access to the scorecard');
  assert.match(await page.locator('h1').innerText(),/Know where your\s+money stands\.\s+Know what to do next\./i);
  assert.ok(await page.locator('h1').evaluate(n=>n.getBoundingClientRect().right<=innerWidth),'Hero copy fits without hidden clipping');
  assert.equal(await page.locator('#flight-report').isVisible(),false,'Personal report is hidden before a check');
  assert.match(await page.locator('.v3-report-wrap').getAttribute('aria-label'),/Illustrative example/);
  assert.equal(await page.locator('.v3-pill').innerText(),'EXAMPLE REPORT');
  assert.equal(await page.locator('.v3-ring strong').innerText(),'71');
  assert.equal(await page.locator('.v3-stat strong').allTextContents().then(a=>a.join(',')),'$650,$100');
  assert.match(await page.locator('.v3-trust').innerText(),/No email or bank connection needed for your score/);
  const positions=await page.evaluate(()=>Object.fromEntries(['h1','.v3-actions .v3-primary','.v3-video-link','#scorecard','[data-start]','.v3-preview'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [selector,{top:r.top,bottom:r.bottom}];})));
  assert.ok(positions['.v3-video-link'].top>=positions['.v3-actions .v3-primary'].bottom,'Video link follows primary CTA');
  assert.ok(positions['#scorecard'].top>=positions['.v3-video-link'].bottom,'Working scorecard immediately follows video link');
  assert.ok(positions['.v3-preview'].top>positions['[data-start]'].bottom,'Illustration follows working scorecard');
  if(width<=390) {
    assert.ok(positions['h1'].top<120,'Mobile headline moved up');
    assert.ok(positions['.v3-actions .v3-primary'].top<400,'Mobile CTA moved up');
    assert.ok(positions['[data-start]'].bottom<1000,'Working Start is reachable within the opening 1000px');
  }
  const ctas=await page.locator('a,button').evaluateAll(ns=>ns.filter(n=>/starter kit/i.test(n.textContent)&&n.checkVisibility()).map(n=>n.textContent.trim()));
  assert.deepEqual(ctas,['Get My Free Starter Kit']);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  const broken=await page.locator('a[href^="#"]').evaluateAll(ns=>ns.filter(n=>!document.getElementById(n.hash.slice(1))).map(n=>n.hash));assert.deepEqual(broken,[]);
  await page.screenshot({path:`${out}/screenshots/after-${width}.png`,fullPage:true});
  await page.screenshot({path:`${out}/screenshots/hero-${width}.png`});
  await page.locator('.v3-kit').screenshot({path:`${out}/screenshots/signup-${width}.png`});
  await page.locator('.v3-actions .v3-primary').focus();await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash,'#scorecard');
  assert.equal(await page.locator('[data-start]').isVisible(),true);
  const summary=page.locator('#cockpit-walkthrough > summary');
  await summary.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough').open);
  assert.equal(await page.locator('#cockpit-walkthrough-video').isVisible(),true);
  await page.locator('#cockpit-walkthrough').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/screenshots/video-cockpit-${width}.png`});
  await summary.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('#cockpit-walkthrough').open);
  await summary.click();await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough').open);
  await summary.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('#cockpit-walkthrough').open);
  await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough').open);
  await page.locator('.header-cta').click();assert.equal(new URL(page.url()).hash,'#scorecard');
  assert.match(await page.locator('.signup-disclosure').innerText(),/Weekly Briefing is separate/);
  assert.equal(await page.getByRole('link',{name:'Get Newsletter',exact:true}).getAttribute('href'),'https://briefing.financialflightmode.com');
  let requests=0;
  await page.route('https://assets.mailerlite.com/jsonp/**',route=>{
    requests++;
    assert.match(route.request().url(),/2411474\/forms\/189897889621738735\/subscribe$/);
    assert.deepEqual([...new URLSearchParams(route.request().postData()).keys()],['fields[email]','ml-submit','anticsrf']);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(requests===1?{success:false}:{success:true})});
  });
  await page.locator('#lead-form button').click();assert.equal(requests,0);
  await page.locator('#leadEmail').fill('preview-check@example.com');await page.locator('#lead-form button').click();
  await page.waitForFunction(()=>document.querySelector('#leadStatus').textContent.includes("couldn't"));
  assert.equal(await page.locator('#lead-form button').innerText(),'Get My Free Starter Kit');
  await page.locator('#lead-form button').click();await page.waitForURL('**/thank-you.html');assert.equal(requests,2);
  await page.goto(`${new URL(origin).origin}/thank-you-download.html`);
  assert.equal(await page.locator('a[download]').getAttribute('href'),'/assets/downloads/financial-flight-mode-starter-kit.zip');
  assert.deepEqual(errors,[]);results.push({width,sections,positions,ctas,noOverflow:true,reducedMotion:true,keyboardDisclosure:true,anchors:true,consent:true,newsletter:true,mockedLeadErrorAndSuccess:true,downloadLink:true,errors});await page.close();
 }
 await writeFile(`${out}/verification.json`,JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
