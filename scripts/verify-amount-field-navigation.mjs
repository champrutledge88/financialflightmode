import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fillMoney } from './scorecard-test-helpers.mjs';

const origin = process.env.SCORECARD_ORIGIN || 'http://127.0.0.1:4173';
const out = process.env.SCORECARD_EVIDENCE_DIR || '/tmp/ffm-amount-navigation';
await mkdir(out, { recursive: true });
const results = [];
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch();
  try {
    for (const width of [390, 1280]) {
      const mobile = width === 390;
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // No provider writes can leave this test, even if future UI code changes.
      await page.route('https://assets.mailerlite.com/jsonp/**', route => route.abort());
      await page.goto(origin + (mobile ? '/' : '/ffm-scorecard.html'));
      await page.locator('[data-start]').click();
      const toolbar = page.locator('.amount-field-navigation');
      const nextAmount = page.locator('[data-next-amount]');
      const activate = async () => mobile ? nextAmount.tap() : nextAmount.click();
      const focused = async id => page.waitForFunction(id => document.activeElement.id === id, id);
      const stepIs = async number => assert.match(await page.locator('.flow-progress').innerText(), new RegExp(`Step ${number} of 9`));
      const checkVisible = async () => {
        await page.waitForFunction(() => {
          const bar = document.querySelector('.amount-field-navigation').getBoundingClientRect();
          const input = document.activeElement.getBoundingClientRect();
          const v = window.visualViewport;
          const top = v?.offsetTop ?? 0, left = v?.offsetLeft ?? 0;
          return input.top >= top - 1 && input.bottom <= bar.top + 1 &&
            bar.left >= left - 1 && bar.right <= left + (v?.width ?? innerWidth) + 1 &&
            bar.bottom <= top + (v?.height ?? innerHeight) + 1;
        });
      };

      // A single amount offers Done, not an accidental step submit.
      await page.locator('#income').focus();
      assert.equal(await nextAmount.innerText(), 'Done');
      await activate();
      await toolbar.waitFor({ state: 'hidden' });
      assert.equal(await page.locator('[data-next]').evaluate(n => n === document.activeElement), true);
      assert.equal(await page.locator('#income').inputValue(), '');
      await stepIs(1);
      await fillMoney(page, 'income', 6000);
      await page.locator('[data-next]').click();
      await stepIs(2);
      const amounts = page.locator('[data-field="needs"] [data-row-amount]');
      const ids = await amounts.evaluateAll(nodes => nodes.map(n => n.id));
      await amounts.nth(0).fill('3000');
      await amounts.nth(2).fill('123.45');
      await amounts.nth(2).focus();
      assert.equal(await nextAmount.innerText(), 'Next field');
      await activate(); await focused(ids[3]);
      await activate(); await focused(ids[4]);
      assert.equal(await nextAmount.innerText(), 'Done');
      await activate();
      await toolbar.waitFor({ state: 'hidden' });
      await stepIs(2);
      assert.equal(await amounts.nth(2).inputValue(), '123.45');
      assert.equal(await amounts.nth(4).inputValue(), '');
      assert.match(await page.locator('[data-field="needs"] .category-total').innerText(), /3,123.45/);

      // Disabled, hidden and readonly fields are skipped without changing values.
      await amounts.nth(1).evaluate(n => n.disabled = true);
      await amounts.nth(2).evaluate(n => n.closest('fieldset').hidden = true);
      await amounts.nth(3).evaluate(n => n.readOnly = true);
      await amounts.nth(0).focus(); await activate(); await focused(ids[4]);
      await amounts.nth(1).evaluate(n => n.disabled = false);
      await amounts.nth(2).evaluate(n => n.closest('fieldset').hidden = false);
      await amounts.nth(3).evaluate(n => n.readOnly = false);

      // Keyboard access to the accessory works without changing Enter on inputs.
      // macOS WebKit uses Option+Tab to include buttons with its default preference.
      const forwardTab = engine === 'webkit' ? 'Alt+Tab' : 'Tab';
      const backwardTab = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
      await amounts.nth(0).focus(); await amounts.nth(0).press(forwardTab);
      assert.equal(await nextAmount.evaluate(n => n === document.activeElement), true);
      await nextAmount.press(backwardTab); await focused(ids[0]);
      await amounts.nth(0).press(forwardTab); await nextAmount.press('Enter'); await focused(ids[1]);
      await amounts.nth(1).press('Enter'); await focused(ids[2]);

      // Recompute destinations after category edits, including removal of the focused row.
      await page.locator('[data-field="needs"] .add-category').click();
      await page.waitForFunction(() => document.querySelector('.amount-field-navigation').hidden);
      const custom = page.locator('[data-field="needs"] .category-row').last();
      await custom.locator('[data-row-label]').fill('Other bill');
      const customId = await custom.locator('[data-row-amount]').getAttribute('id');
      await amounts.nth(4).focus(); await activate(); await focused(customId);
      assert.equal(await nextAmount.innerText(), 'Done');
      await activate(); await stepIs(2);
      await page.locator('[data-next]').click();
      await stepIs(2); await focused(customId);
      assert.match(await page.locator('#form-error').innerText(), /Enter an amount/);
      await custom.locator('.remove-category').click(); await focused(ids[4]);
      assert.equal(await nextAmount.innerText(), 'Done');

      // No implicit zero, formatting, validation bypass, or step jump on navigation.
      await amounts.nth(2).fill('-5'); await activate(); await focused(ids[3]);
      assert.equal(await amounts.nth(2).inputValue(), '-5');
      await page.locator('[data-next]').click(); await stepIs(2); await focused(ids[2]);
      assert.equal(await amounts.nth(2).getAttribute('aria-invalid'), 'true');
      await amounts.nth(2).fill('123.45');

      // A smaller visible area approximates an open keyboard; rotate and restore.
      await page.setViewportSize({ width: mobile ? 390 : 900, height: 400 });
      await amounts.nth(2).focus(); await checkVisible();
      await activate(); await focused(ids[3]); await checkVisible();
      await page.screenshot({ path: `${out}/${engine}-${width}-short-viewport.png` });
      await page.setViewportSize({ width: 844, height: 390 }); await checkVisible();
      await page.setViewportSize({ width, height: 844 }); await checkVisible();
      if (engine === 'chromium') {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
        await page.waitForFunction(() => visualViewport.scale === 2);
        await checkVisible(); await activate(); await focused(ids[4]); await checkVisible();
        await page.screenshot({ path: `${out}/${engine}-${width}-zoom.png` });
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
      }
      await page.locator('[data-next]').click(); await stepIs(3);
      await page.waitForFunction(() => document.querySelector('.amount-field-navigation').hidden);
      await page.locator('[data-back]').click(); await stepIs(2);
      assert.equal(await amounts.nth(2).inputValue(), '123.45');
      await page.locator('[data-next]').click();
      for (const [field, value] of [['wants', 500], ['savings', 200], ['extraDebtPayment', 0], ['totalDebtBalance', 0]]) {
        await fillMoney(page, field, value); await page.locator('[data-next]').click();
      }
      await stepIs(7);
      await page.locator('#emergencyFundSaved').fill('100');
      await activate(); await focused('emergencyFundGoal');
      assert.equal(await nextAmount.innerText(), 'Done');
      await activate(); await stepIs(7);
      await page.locator('[data-next]').click(); await stepIs(7);
      assert.equal(await page.locator('#emergencyFundGoal').getAttribute('aria-invalid'), 'true');
      await page.locator('#emergencyFundGoal').fill('1000');
      await page.locator('[data-next]').click(); await stepIs(8);
      const investments = page.locator('[data-field="investmentsCurrentValue"] [data-row-amount]');
      await investments.first().fill('0'); await activate();
      await focused(await investments.last().getAttribute('id'));
      assert.equal(await nextAmount.innerText(), 'Done');
      await activate(); await stepIs(8);
      await page.locator('[data-next]').click(); await stepIs(9);
      await toolbar.waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Stable', exact: true }).click();
      await page.locator('[data-next]').click();
      await page.locator('[data-save-report]').waitFor();
      await toolbar.waitFor({ state: 'hidden' });
      assert.deepEqual(errors, []);
      results.push({ engine, width, singleAndLastDone: true, consecutiveTaps: true, dynamicRows: true, hiddenDisabledReadonlySkipped: true, valuesAndValidationPreserved: true, keyboard: true, shortViewportAndRotation: true, zoom: engine === 'chromium' ? '2x viewport scale passed' : 'not emulated', fullReportCompleted: true, errors });
      await context.close();
    }
  } finally { await browser.close(); }
}
await writeFile(`${out}/verification.json`, JSON.stringify({ origin, results, nativeKeyboard: 'Requires physical iOS Safari verification; headless engines do not display the system keyboard.' }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
