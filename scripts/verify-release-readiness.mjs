import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const origin=process.env.SCORECARD_ORIGIN||'http://127.0.0.1:4173';const out=process.env.SCORECARD_EVIDENCE_DIR||'/tmp/ffm-release-readiness';await mkdir(out,{recursive:true});
const b=await chromium.launch();const checks=[];
const luminance=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
try{
 for(const width of [390,1280]){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await p.locator('[data-start]').waitFor();
  const colors=await p.locator('.header-cta').evaluate(n=>{const c=getComputedStyle(n);return [c.color,c.backgroundColor].map(s=>s.match(/[\d.]+/g).map(Number));});const l=colors.map(luminance);const ratio=(Math.max(...l)+.05)/(Math.min(...l)+.05);assert.ok(ratio>=4.5);
  await p.locator('[data-start]').click();assert.match(await p.locator('.privacy-note').innerText(),/stage and a broad score range/);
  const names=['income','needs','wants','savings','extraDebtPayment','totalDebtBalance','emergencyFundSaved','emergencyFundGoal','investmentsCurrentValue'];const v=[6000,4260,1200,300,250,6000,200,2000,0];
  for(let i=0;i<names.length;i++){await p.locator('#'+names[i]).fill(String(v[i]));if(i!==6)await p.locator('[data-next]').click();}
  await p.getByRole('button',{name:'Stable',exact:true}).click();await p.locator('[data-next]').click();await p.locator('[data-save-report]').waitFor();
  assert.match(await p.locator('.one-move h3').textContent(),/Find \$10 to close the gap/);
  assert.equal(await p.locator('#report-checkpoint').evaluate(n=>n.previousElementSibling.id),'report-next-move');
  assert.equal(await p.locator('#report-next-move').evaluate(n=>n.previousElementSibling.className),'report-top');
  await p.getByRole('link',{name:'Your next move',exact:true}).click();assert.equal(new URL(p.url()).hash,'#report-next-move');
  await p.getByRole('link',{name:'Save your report',exact:true}).click();assert.equal(new URL(p.url()).hash,'#report-checkpoint');
  const [download]=await Promise.all([p.waitForEvent('download'),p.locator('[data-save-report]').click()]);const path=out+'/'+width+'-'+download.suggestedFilename();await download.saveAs(path);assert.match(await readFile(path,'utf8'),/Find \$10 to close the gap/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  await p.locator('#flight-report').screenshot({path:out+'/release-report-'+width+'.png',style:'.site-header, .skip-link { visibility:hidden !important; }'});
  checks.push({width,headerContrast:ratio,exactDeficit:10,earlyActionAndSave:true,shortcuts:true,downloadMatches:true,errors});await c.close();
 }
 const c=await b.newContext();const p=await c.newPage();await p.goto(origin+'/privacy.html');assert.match(await p.locator('main').innerText(),/derived flight stage and a broad score range/);assert.match(await p.locator('main').innerText(),/do not send an exact score/);await c.close();
 await writeFile(out+'/verification.json',JSON.stringify({origin,checks,privacyDisclosure:true},null,2)+'\n');console.log(JSON.stringify({origin,checks,privacyDisclosure:true},null,2));
}finally{await b.close();}
