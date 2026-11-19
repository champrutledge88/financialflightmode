import {chromium,webkit,firefox} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';
const directory=process.env.SCORECARD_EVIDENCE_DIR||'/tmp/ffm-marker-review';
await mkdir(directory,{recursive:true});
const checks=[];const errors=[];
for (const engine of [chromium,webkit,firefox]) {
const browser=await engine.launch();
try {
 for(const width of [320,390,412,760,1280]) {
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#scorecard');await page.locator('[data-start]').waitFor();
  for(const [score,cashRemaining] of [...[0,39,40,65,69,70,89,90,100].map(score=>[score,100]),[70,-1],[89,-1],[90,-1],[100,-1]]) {
   await page.evaluate(async ({score,cashRemaining})=>{
    const {renderFlightReport}=await import('/src/flightReportUI.js?v=path-dot-1');
    const {calculateFlightScore,getStage}=await import('/src/flightScoreCalculator.js?v=stage-order-1');
    const result=calculateFlightScore({income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500});
    // Isolate display positions; no changes to calculator behavior or source.
    result.score=score;result.metrics.cashRemaining=cashRemaining;result.stage=getStage({score,cashRemaining});
    renderFlightReport(result,{example:true});
   },{score,cashRemaining});
   await page.locator('.report-details > summary').click();
   const marker=page.locator('.flight-track .score-position-marker');const {track,dot,stage}=await marker.evaluate(n=>({track:n.parentElement.getBoundingClientRect().toJSON(),dot:n.getBoundingClientRect().toJSON(),stage:n.closest(".report-card").querySelector(".current").getBoundingClientRect().toJSON()}));
   assert.ok(Math.abs(dot.x+dot.width/2-(stage.x+stage.width/2))<.6,`Horizontal position ${width}/${score}: ${JSON.stringify({track,dot,stage})}`);
   assert.ok(Math.abs(dot.y+dot.height/2-(track.y+track.height/2))<.6,`Vertical alignment ${width}/${score}`);
   assert.equal(dot.width,14);assert.equal(dot.height,14);const stageName=await page.locator(".flight-stages .current strong").innerText();
   assert.equal(await marker.getAttribute("aria-label"),`Current stage: ${stageName}. Score: ${score} out of 100.`);
   assert.equal(await page.locator(".flight-stages [aria-current=step]").count(),1);
   assert.equal(stageName,await page.locator(".report-stage").textContent());
   if(cashRemaining<0) assert.equal(stageName,"Turbulence");
   assert.equal(await marker.locator('svg').count(),0);
   assert.equal(await marker.evaluate(n=>getComputedStyle(n).borderRadius),'50%');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('.flight-stages strong').evaluateAll(nodes=>nodes.every(n=>{
    const range=document.createRange();range.selectNodeContents(n);
    const cell=n.parentElement.getBoundingClientRect();
    return [...range.getClientRects()].every(r=>r.left>=cell.left && r.right<=cell.right);
   })),true,'Stage labels stay within their own columns');
   checks.push({engine:engine.name(),width,score,cashRemaining,stageName,centerAligned:true,circular:true});
   if([65,70,100].includes(score)) await page.locator('.flight-track').locator('..').screenshot({path:`${directory}/flight-path-${engine.name()}-${width}-${score}-${cashRemaining}.png`});
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
}
