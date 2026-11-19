import { chromium, webkit, firefox } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fillMoney } from './scorecard-test-helpers.mjs';

const out = process.env.SCORECARD_EVIDENCE_DIR || '/tmp/ffm-view-report';
await mkdir(out, { recursive: true });
const results = [];
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.mp4':'video/mp4' };
for (const [engine, type] of Object.entries({ chromium, webkit, firefox })) {
  const browser = await type.launch();
  try {
    for (const width of [320, 390, 1280]) {
      const mobile = width < 760;
      const context = await browser.newContext({ viewport:{width,height:844}, hasTouch:mobile, isMobile:mobile && engine !== 'firefox', reducedMotion:'reduce', acceptDownloads:true });
      const requests = [];
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        requests.push({url:url.href,method:route.request().method()});
        if (url.hostname !== 'ffm.test') return route.abort();
        const file = path.join(process.cwd(), url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
        if (!file.startsWith(process.cwd()+path.sep)) return route.abort();
        try { await route.fulfill({body:await readFile(file),contentType:types[path.extname(file)] || 'application/octet-stream'}); }
        catch { await route.fulfill({status:404,body:'Not found'}); }
      });
      const page = await context.newPage();
      const errors = []; let downloads = 0;
      page.on('pageerror', e => errors.push(e.message));
      page.on('download', () => downloads++);
      await page.goto('http://ffm.test/');
      assert.equal(await page.locator('[data-view-report]').count(), 0, 'example must not offer personal report action');
      await page.locator('[data-start]').click();
      for (const [field,value] of [['income',6000],['needs',3400],['wants',1200],['savings',500],['extraDebtPayment',250],['totalDebtBalance',0]]) {
        await fillMoney(page,field,value); await page.locator('[data-next]').click();
      }
      await fillMoney(page,'emergencyFundSaved',4000); await fillMoney(page,'emergencyFundGoal',8000);
      await page.locator('[data-next]').click();
      await fillMoney(page,'investmentsCurrentValue',2500); await page.locator('[data-next]').click();
      await page.getByRole('button',{name:'Stable',exact:true}).click(); await page.locator('[data-next]').click();
      const view = page.getByRole('button',{name:'View my full report',exact:true});
      await view.waitFor();
      const details = page.locator('#report-full-details');
      const summary = details.locator('summary');
      assert.equal(await view.getAttribute('aria-controls'), 'report-full-details');
      assert.equal(await view.getAttribute('aria-expanded'), 'false');
      assert.equal(await details.getAttribute('open'), null);
      const order = await page.locator('#flight-report').evaluate(n => ['.one-move','[data-view-report]','#report-checkpoint','.report-details'].map(s=>n.querySelector(s).getBoundingClientRect().top));
      assert.ok(order.every((v,i)=>!i || v>order[i-1]));
      await view.scrollIntoViewIfNeeded();
      await page.screenshot({path:`${out}/${engine}-${width}-action.png`});
      const beforeRequests = requests.length;
      if (mobile) await view.tap(); else await view.press('Enter');
      await page.waitForFunction(()=>document.querySelector('#report-full-details').open);
      assert.equal(await summary.evaluate(n=>n===document.activeElement), true);
      assert.equal(await view.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('.instrument-grid').isVisible(), true);
      assert.equal(downloads,0); assert.equal(context.pages().length,1);
      assert.equal(requests.length,beforeRequests,'viewing results must stay local');
      const rect = await summary.boundingBox();
      assert.ok(rect.y >= 0 && rect.y+rect.height < 844, 'focused summary is visible');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:`${out}/${engine}-${width}-opened.png`});
      await summary.press('Enter');
      await page.waitForFunction(()=>document.querySelector('[data-view-report]').getAttribute('aria-expanded')==='false');
      await view.press('Space');
      await page.waitForFunction(()=>document.querySelector('#report-full-details').open);
      assert.equal(await summary.evaluate(n=>n===document.activeElement),true);
      await view.press('Enter');
      assert.equal(await details.evaluate(n=>n.open),true,'repeated view must not close results');
      const [download] = await Promise.all([page.waitForEvent('download'),page.locator('[data-save-report]').click()]);
      const filename = `${out}/${engine}-${width}-report.html`; await download.saveAs(filename);
      const html = await readFile(filename,'utf8');
      assert.match(html,/Reflect on/); assert.match(html,/What will I adjust before the next payday/);
      assert.doesNotMatch(html,/<script|<form|<iframe|https?:\/\//i);
      assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
      assert.equal(requests.some(r=>r.method==='POST'||r.url.includes('/subscribe')),false);
      await page.evaluate(()=>{window.open=()=>null;});
      await page.locator('[data-print-report]').click();
      assert.match(await page.locator('[data-save-status]').innerText(),/Allow this print window/);
      await page.locator('[data-edit-report]').click();
      assert.equal(await page.locator('#flight-report').isVisible(),false);
      assert.equal(await page.locator('#income').inputValue(),'6,000');
      assert.deepEqual(errors,[]);
      results.push({engine,width,viewInPage:true,keyboardFocus:true,expandedStateSynced:true,noDownloadOrNetworkOnView:true,exportReflectPreserved:true,printFallback:true,editPreserved:true,errors});
      console.log(`Passed ${engine} ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
}
await writeFile(`${out}/verification.json`,JSON.stringify({results,physicalDevice:false},null,2)+'\n');
