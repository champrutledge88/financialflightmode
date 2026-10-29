import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN || 'http://127.0.0.1:4173';
const out=process.env.WALKTHROUGH_EVIDENCE_DIR || 'docs/video-launch';
await mkdir(`${out}/screenshots`,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const width of [390,760,1280]) {
    const context=await browser.newContext({viewport:{width,height:1000}});
    const page=await context.newPage(); const requests=[];const errors=[];
    page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.locator('[data-start]').waitFor();
    assert.equal(await page.locator('#cockpit-walkthrough').getAttribute('open'),null);
    assert.equal(requests.some(url=>url.includes('.mp4')),false,'No video download before the visitor presses play');
    await page.locator('#cockpit-walkthrough > summary').click();
    const video=page.locator('#cockpit-walkthrough-video');
    assert.equal(await video.isVisible(),true);
    assert.equal(await video.evaluate(v=>v.autoplay),false);
    assert.equal(await video.evaluate(v=>v.paused),true);
    assert.doesNotMatch(await page.locator('#cockpit-walkthrough').innerText(),/[-–—]/);
    await video.evaluate(v=>{v.muted=true;return v.play();});
    await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough-video').currentTime>.1);
    await video.evaluate(v=>new Promise(resolve=>{v.pause();v.addEventListener('seeked',resolve,{once:true});v.currentTime=2.9;}));
    await page.waitForFunction(()=>{const v=document.querySelector('#cockpit-walkthrough-video');return v.readyState>=2&&v.textTracks[0]?.cues?.length>0;});
    const metadata=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,cues:v.textTracks[0].cues.length,captions:v.textTracks[0].mode,preload:v.preload}));
    assert.equal(metadata.duration,134);assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert.equal(metadata.cues,39);assert.equal(metadata.captions,'showing');assert.equal(metadata.preload,'none');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await video.evaluate(v=>v.play());
    await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough-video').textTracks[0].activeCues?.length>0);
    await video.evaluate(v=>v.pause());
    await video.screenshot({path:`${out}/screenshots/walkthrough-${width}.png`});
    await video.evaluate(v=>v.play());
    await page.locator('#cockpit-walkthrough > summary').click();
    await page.waitForFunction(()=>document.querySelector('#cockpit-walkthrough-video').paused);
    assert.equal(await video.isVisible(),false);assert.deepEqual(errors,[]);
    results.push({viewportWidth:width,...metadata,playback:true,pauseOnClose:true,noAutoload:true,noOverflow:true,browserErrors:errors});
    await context.close();
  }
  await writeFile(`${out}/verification.json`,JSON.stringify({origin,results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
