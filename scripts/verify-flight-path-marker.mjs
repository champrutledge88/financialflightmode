import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';
const directory=process.env.SCORECARD_EVIDENCE_DIR||'/tmp/ffm-marker-review';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch();const checks=[];const errors=[];
try {
 for(const width of [390,1280]) {
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#scorecard');await page.locator('[data-start]').waitFor();
  for(const score of [0,39,40,69,70,89,90,100]) {
   await page.evaluate(async score=>{
    const {renderFlightReport}=await import('/src/flightReportUI.js?v=path-dot-1');
    const {calculateFlightScore,STAGES}=await import('/src/flightScoreCalculator.js?v=stage-order-1');
    const result=calculateFlightScore({income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500});
    // Isolate display positions; no changes to calculator behavior or source.
    result.score=score;result.stage=score<40?STAGES.preflight:score<70?STAGES.turbulence:score<90?STAGES.cruise:STAGES.flight;
    renderFlightReport(result,{example:true});
   },score);
   const marker=page.locator('.flight-track .score-position-marker');const {track,dot}=await marker.evaluate(n=>({track:n.parentElement.getBoundingClientRect().toJSON(),dot:n.getBoundingClientRect().toJSON()}));
   assert.ok(Math.abs(dot.x+dot.width/2-(track.x+track.width*score/100))<.6,`Horizontal position ${width}/${score}`);
   assert.ok(Math.abs(dot.y+dot.height/2-(track.y+track.height/2))<.6,`Vertical alignment ${width}/${score}`);
   assert.equal(dot.width,14);assert.equal(dot.height,14);assert.equal(await marker.getAttribute('aria-label'),`Score position ${score}`);
   assert.equal(await marker.locator('svg').count(),0);
   assert.equal(await marker.evaluate(n=>getComputedStyle(n).borderRadius),'50%');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   checks.push({width,score,centerAligned:true,circular:true});
   if([0,70,100].includes(score)) await page.locator('.flight-track').locator('..').screenshot({path:`${directory}/flight-path-${width}-${score}.png`});
  }
  // The reveal uses the same dot and center-based positioning.
  await page.evaluate(async()=>{
   const {revealFlightReport}=await import('/src/flightReportUI.js?v=path-dot-1');const {calculateFlightScore}=await import('/src/flightScoreCalculator.js?v=stage-order-1');
   const r=calculateFlightScore({income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500});
   window.__markerScore=r.score;revealFlightReport(r,{animateScore:()=>()=>{},onComplete:()=>{}});
  });
  await page.waitForTimeout(3100);
  const reveal=page.locator('.reveal-path .score-position-marker');assert.equal(await reveal.count(),1);
  assert.equal(await reveal.getAttribute('style'),`left: ${await page.evaluate(()=>window.__markerScore)}%;`);
  await page.keyboard.press('Escape');await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${directory}/verification.json`,JSON.stringify({checks,revealDot:true,errors},null,2)+'\n');console.log(JSON.stringify({positions:checks.length,revealDot:true,errors}));
}finally{await browser.close();}
