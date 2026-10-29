import { parseCurrency, formatCurrencyInput, paycheckToMonthly, moneyError } from './scorecardFlow.js?v=final-review-1';
import { money } from './flightReport.js?v=release-1';
import { trackEvent } from './analytics.js?v=ga4-1';

const steps = [
  { name: 'monthly_income', question: 'What is your monthly take home income?', helper: 'Use money received after taxes and deductions. All amounts are in US dollars.', fields: ['income'], example: 'For example, add up what lands in your account after taxes each month.' },
  { name: 'monthly_needs', question: 'What do your bills and must pays cost each month?', fields: ['needs'], helper: 'Include rent or your monthly mortgage payment, utilities, insurance, groceries and minimum debt payments. Count each payment once.', example: 'For example, add rent, groceries, utilities, insurance, and minimum payments.' },
  { name: 'monthly_wants', question: 'What do you spend on wants each month?', fields: ['wants'], helper: 'Dining out, optional subscriptions and shopping. Essential subscriptions belong in needs. Count each expense once.', example: 'For example, add a typical month of dining out, entertainment, and shopping.' },
  { name: 'monthly_saving', question: 'How much cash do you set aside each month?', helper: 'New cash savings contributions, not the balance already saved. Do not count payroll retirement deductions again.', fields: ['savings'], zero: 'None right now', example: 'For example, count regular transfers into savings, even small ones.' },
  { name: 'extra_payment', question: 'How much extra do you pay toward debt each month?', helper: 'Only payments above the minimum. Your minimum payments belong in monthly needs.', fields: ['extraDebtPayment'], zero: 'None', example: 'For example, count only the extra you pay above the amount due.' },
  { name: 'total_balance', question: 'Total debt you owe today, not counting your mortgage?', fields: ['totalDebtBalance'], zero: 'No debt', helper: 'Include car loans, credit cards, student loans, personal loans, and medical bills. Leave out your mortgage.', example: 'For example, add your latest balances for loans and cards outside your mortgage.' },
  { name: 'emergency_runway', question: 'How much emergency cash do you have today?', helper: 'Enter the current cash balance and your savings goal. Leave investments out. Your goal is a balance, not a monthly transfer.', fields: ['emergencyFundSaved', 'emergencyFundGoal'], example: 'For example, count cash you could use for an unexpected bill. Your goal can be three months of needs.' },
  { name: 'long_term', question: 'Invested so far for the long term?', fields: ['investmentsCurrentValue'], zero: 'None yet', helper: 'Current account balances, including retirement accounts. This is not a monthly contribution.', example: 'For example, add your retirement account and other investment balances.' },
  { name: 'current_pressure', question: 'What feels most pressing right now?', helper: 'Your focus can guide your plan when supported by your numbers. It does not change your score.', fields: ['immediatePressure', 'shortTermObjective'] },
];
const labels = { income: 'Monthly take home income', needs: 'Monthly needs', wants: 'Monthly wants', savings: 'Monthly cash savings contributions', extraDebtPayment: 'Monthly extra debt payment', totalDebtBalance: 'Total debt balance', emergencyFundSaved: 'Emergency fund saved', emergencyFundGoal: 'Emergency fund goal', investmentsCurrentValue: 'Invested so far' };

export function enhanceScorecard(form, { onStart }) {
  const originalLabels = Object.fromEntries([...form.querySelectorAll('label')].map(label => [label.htmlFor, label]));
  const error = form.querySelector('#form-error');
  form.classList.add('guided-form'); form.noValidate = true;
  form.innerHTML = `<div class="flow-start"><p class="eyebrow">Your first checkpoint</p><h3 tabindex="-1">Run your Pre Flight check.</h3><p>About 90 seconds. Use estimates if needed. No financial answers stored. Education only.</p><button class="primary-button" type="button" data-start>Start</button></div><div class="flow-journey" hidden><div class="flow-top"><p class="flow-progress" aria-live="polite"></p><p class="cash-left" hidden aria-live="polite"></p></div><progress max="9" value="1" aria-label="Scorecard progress"></progress><div class="flow-steps"></div><div class="flow-nav"><button type="button" data-back>Back</button><button type="button" class="primary-button" data-next>Continue</button></div><p class="privacy-note">Your financial answers stay in this browser. Usage analytics include your stage and a broad score range. <a href="/privacy.html">Privacy details</a>. Education only.</p></div>`;
  const journey = form.querySelector('.flow-journey');
  const panels = steps.map((step, index) => {
    const panel = document.createElement('section'); panel.className = 'flow-step'; panel.hidden = true;
    panel.innerHTML = `<h3 tabindex="-1" id="step-heading-${index + 1}">${step.question}</h3>${step.helper ? `<p class="flow-helper">${step.helper}</p>` : ''}`;
    panel.setAttribute('aria-labelledby', `step-heading-${index + 1}`);
    step.fields.forEach(field => {
      const label = originalLabels[field];
      if (labels[field]) {
        label.querySelector(':scope > span').textContent = labels[field];
        const input = label.querySelector('input');
        input.type = 'text'; input.value = ''; input.inputMode = 'decimal'; input.autocomplete = 'off';
        input.removeAttribute('min'); input.removeAttribute('step'); input.required = true;
        input.setAttribute('aria-describedby', 'form-error');
        input.addEventListener('input', () => {
          const start = input.selectionStart; const before = input.value;
          const formatted = formatCurrencyInput(before);
          if (formatted !== null) {
            input.value = formatted;
            const position = Math.max(0, start + formatted.length - before.length);
            input.setSelectionRange(position, position);
          }
          input.removeAttribute('aria-invalid'); error.textContent = ''; updateGauge(); updateMonthly();
        });
      } else {
        const select = label.querySelector('select'); select.value = ''; label.hidden = true;
        const group = document.createElement('fieldset'); group.className = 'choice-chips';
        const legend = document.createElement('legend'); legend.textContent = field === 'immediatePressure' ? 'Current pressure' : 'Short term objective (optional)'; group.append(legend);
        [...select.options].filter(o => o.value || field === 'shortTermObjective').forEach(option => {
          const chip = document.createElement('button'); chip.type = 'button'; chip.textContent = option.value || 'No objective selected'; chip.setAttribute('aria-pressed', String(select.value === option.value));
          chip.onclick = () => { select.value = option.value; group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === chip))); error.textContent = ''; if (field === 'immediatePressure') { panel.querySelectorAll('fieldset')[1]?.querySelector('button')?.focus(); } else form.querySelector('[data-next]').focus(); };
          group.append(chip);
        });
        panel.append(group);
      }
      panel.append(label);
    });
    if (index === 0) {
      const pay = document.createElement('div'); pay.className = 'paycheck-controls';
      pay.innerHTML = `<button type="button" aria-pressed="false" data-pay-toggle>Enter one paycheck instead</button><fieldset hidden><legend>Paycheck frequency</legend><div class="frequency-chips">${[['weekly','Every week'],['biweekly','Every two weeks'],['twice','Twice a month'],['monthly','Once a month']].map(([key, name]) => `<button type="button" data-frequency="${key}" aria-pressed="${key === 'biweekly'}">${name}</button>`).join('')}</div></fieldset><p class="converted-monthly" aria-live="polite" hidden></p>`;
      panel.append(pay);
    }
    if (step.zero) {
      const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'zero-chip'; chip.textContent = step.zero;
      chip.onclick = () => { form.elements[step.fields[0]].value = '0'; next(); }; panel.append(chip);
    }
    if (index === 6) {
      const chip = document.createElement('button'); chip.type = 'button'; chip.dataset.runwayGoal = ''; chip.onclick = () => { form.elements.emergencyFundGoal.value = formatCurrencyInput(String(parseCurrency(form.elements.needs.value) * 3)); next(); }; panel.append(chip);
    }
    if (step.example) {
      const hint = document.createElement('button'); hint.type = 'button'; hint.className = 'estimate-link'; hint.textContent = 'Not sure? Use an estimate'; hint.setAttribute('aria-expanded', 'false');
      const sentence = document.createElement('p'); sentence.id = `estimate-${index}`; sentence.className = 'estimate-copy'; sentence.textContent = step.example; sentence.hidden = true; hint.setAttribute('aria-controls', sentence.id);
      hint.onclick = () => { sentence.hidden = !sentence.hidden; hint.setAttribute('aria-expanded', String(!sentence.hidden)); }; panel.append(hint, sentence);
    }
    form.querySelector('.flow-steps').append(panel); return panel;
  });
  journey.insertBefore(error, journey.querySelector('.flow-nav'));
  let current = 0, started = false, completed = false, abandoned = false, paycheck = false, frequency = 'biweekly';
  const monthlyValue = () => paycheckToMonthly(parseCurrency(form.elements.income.value) || 0, paycheck ? frequency : 'monthly');
  const updateMonthly = () => {
    const node = form.querySelector('.converted-monthly'); node.hidden = !paycheck;
    node.textContent = `${money(monthlyValue())} each month`;
  };
  const updateGauge = () => {
    const remaining = monthlyValue() - ['needs', 'wants', 'savings', 'extraDebtPayment'].reduce((sum, field) => sum + (parseCurrency(form.elements[field].value) || 0), 0);
    const node = form.querySelector('.cash-left'); node.hidden = current < 1;
    node.textContent = remaining < 0 ? `Cash left so far: over by ${money(remaining)}` : `Cash left so far: ${money(remaining)}`;
    const goal = form.querySelector('[data-runway-goal]'); goal.textContent = `Use 3 months (${money((parseCurrency(form.elements.needs.value) || 0) * 3)})`;
  };
  const show = index => {
    current = index; panels.forEach((panel, i) => panel.hidden = i !== current);
    form.querySelector('.flow-progress').textContent = `Step ${current + 1} of 9`;
    form.querySelector('progress').value = current + 1;
    form.querySelector('[data-next]').textContent = current === 8 ? 'Run My Flight Check' : 'Continue';
    error.textContent = ''; updateGauge(); panels[current].querySelector('h3').focus();
    trackEvent('scorecard_step_view', { step_number: current + 1, step_name: steps[current].name });
  };
  const valid = () => {
    for (const field of steps[current].fields.filter(field => labels[field])) {
      const input = form.elements[field]; const message = moneyError(parseCurrency(input.value), field);
      if (message) { error.textContent = message; input.setAttribute('aria-invalid', 'true'); input.focus(); return false; }
    }
    if (current === 8 && !form.elements.immediatePressure.value) { error.textContent = 'Choose what feels most pressing to run your Flight Check.'; panels[current].querySelector('button').focus(); return false; }
    error.textContent = ''; return true;
  };
  function next() {
    if (!valid()) return;
    if (current < 8) show(current + 1);
    else form.requestSubmit();
  }
  form.querySelector('[data-start]').onclick = () => { started = true; form.querySelector('.flow-start').hidden = true; journey.hidden = false; onStart(); show(0); };
  form.querySelector('[data-back]').onclick = () => {
    trackEvent('scorecard_step_back', { step_number: current + 1 });
    if (current > 0) show(current - 1);
    else { journey.hidden = true; form.querySelector('.flow-start').hidden = false; form.querySelector('[data-start]').focus(); }
  };
  form.querySelector('[data-next]').onclick = next;
  form.querySelector('[data-pay-toggle]').onclick = event => {
    paycheck = !paycheck; event.currentTarget.setAttribute('aria-pressed', String(paycheck));
    form.querySelector('.paycheck-controls fieldset').hidden = !paycheck;
    originalLabels.income.querySelector(':scope > span').textContent = paycheck ? 'One take home paycheck' : 'Monthly take home income'; updateMonthly(); updateGauge();
  };
  form.querySelectorAll('[data-frequency]').forEach(button => button.onclick = () => {
    frequency = button.dataset.frequency;
    form.querySelectorAll('[data-frequency]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); updateMonthly(); updateGauge();
    if (!moneyError(parseCurrency(form.elements.income.value), 'income')) next();
  });
  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input')) { event.preventDefault(); if (current === 6 && event.target.name === 'emergencyFundSaved') form.elements.emergencyFundGoal.focus(); else next(); }
  });
  form.addEventListener('submit', event => { if (current !== 8 || !valid()) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  window.addEventListener('pagehide', () => {
    if (!started || completed || abandoned) return; abandoned = true;
    trackEvent('scorecard_abandon', { last_step_number: current + 1, last_step_name: steps[current].name, transport_type: 'beacon' });
  });
  return {
    getValues: () => Object.fromEntries(Object.keys(labels).map(field => [field, field === 'income' ? monthlyValue() : parseCurrency(form.elements[field].value)])),
    complete: () => { completed = true; },
    edit: () => { journey.hidden = false; form.querySelector('.flow-start').hidden = true; completed = false; show(0); form.scrollIntoView({block:'start'}); },
  };
}
