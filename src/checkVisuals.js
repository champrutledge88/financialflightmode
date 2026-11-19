// Presentation only: these visuals explain the existing checks, never rescore them.
import { money } from './flightReport.js?v=refinements-2';
const pct = n => `${(n * 100).toFixed(1)}%`;
const meter = (value, max, reference, label, ends, note) => ({
  kind: 'meter', fill: max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0,
  marker: max > 0 ? reference / max * 100 : 0, label, ends, note,
});
const status = (active, label, note) => ({ kind: 'status', active, label, note });
export function buildCheckVisuals({ values: v, metrics: m }) {
  const allocated = v.needs + v.wants + v.savings + v.extraDebtPayment;
  const allocationShare = v.income > 0 ? allocated / v.income : 0;
  const share = m.debtPaymentShare;
  const months = m.runwayMonths;
  return [
    v.income <= 0 ? status(null, 'Income required', 'Add take home income to compare your plan.') : meter(allocated, Math.max(v.income, allocated), v.income,
      `${money(allocated)} planned / ${money(v.income)} income`,
      ['0', allocationShare > 1 ? `${pct(allocationShare)} of income` : '100% of income'],
      m.cashRemaining < 0 ? `${money(-m.cashRemaining)} over income. The white mark is your income limit.` : `${money(m.cashRemaining)} unassigned. The white mark is your income limit.`),
    meter(m.savingsRate, Math.max(.2, m.savingsRate), .1,
      `${pct(m.savingsRate)} saved / 10% check`,
      ['0%', pct(Math.max(.2, m.savingsRate))],
      `${money(v.savings)} saved monthly. White mark: the existing 10% check, not a requirement for everyone.`),
    !v.totalDebtBalance ? status(true, 'No debt outside your mortgage', 'No required debt payment share to assess.')
      : share === null ? status(null, 'Required payments not entered', 'Add required monthly payments to see this bar. Missing is not zero.')
      : meter(share, Math.max(.3, share), .1,
        `${pct(share)} of take home pay`, ['0%', pct(Math.max(.3, share))],
        `${money(v.minimumDebtPayment)} required monthly. Lower leaves more flexibility. White mark: 10%; the existing check flags above 20%.`),
    months === null ? status(null, 'Monthly needs required', `${money(v.emergencyFundSaved)} saved. Add needs to assess runway.`)
      : meter(months, Math.max(1, months), 1,
        `${months.toFixed(1)} months covered / 1 month check`, ['0 months', `${Math.max(1, months).toFixed(1)} months`],
        `${money(v.emergencyFundSaved)} emergency cash / ${money(v.needs)} monthly needs. White mark: one month.`),
    status(!v.totalDebtBalance || v.extraDebtPayment > 0,
      !v.totalDebtBalance ? 'No debt to pay extra on' : `${money(v.extraDebtPayment)} extra each month`,
      !v.totalDebtBalance ? 'This check does not require a payment.' : 'Above minimums only. This is a habit check, not a debt payoff percentage.'),
    status(v.investmentsCurrentValue > 0, `${money(v.investmentsCurrentValue)} invested so far`,
      'This checks whether you have started. Balance is not investment return or retirement readiness.'),
  ];
}
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function renderCheckVisual(visual) {
  const graphic = visual.kind === 'meter'
    ? `<div class="check-meter" aria-hidden="true"><i style="width:${visual.fill}%"></i><b style="left:${visual.marker}%"></b></div><div class="check-scale" aria-hidden="true"><span>${escape(visual.ends[0])}</span><span>${escape(visual.ends[1])}</span></div>`
    : `<div class="check-status" aria-hidden="true"><i class="${visual.active === null ? 'unknown' : visual.active ? 'active' : 'inactive'}"></i><span>${visual.active === null ? 'Needs information' : visual.active ? 'Check met' : 'Not yet'}</span></div>`;
  return `<div class="check-visual"><p class="check-value">${escape(visual.label)}</p>${graphic}<p class="check-context">${escape(visual.note)}</p></div>`;
}
