import { generatePersonalizedFlightPlan } from './personalizedFlightPlan.js?v=w1-1';
import { getRelativeCategoryScores } from './flightScoreCalculator.js?v=stage-order-1';

export const money = (number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(Math.abs(number)) ? 0 : 2, maximumFractionDigits: 2 }).format(Math.abs(number));
// Source stage copy contains punctuation that is not used in the report's publishable copy.
const plain = (text) => text.replace(/(\d)[-–—](\d)/g, '$1 to $2').replace(/[-–—]/g, ' ');
const pct = (number) => `${(number * 100).toFixed(1)}%`;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function buildFlightReport(result, { flightDate, immediatePressure = 'Stable', shortTermObjective = '' }) {
  const { values: v, metrics: m, briefing: b, stage } = result;
  const relative = Object.fromEntries(getRelativeCategoryScores(result.categoryScores));
  const instruments = [
    ['cashRemaining', 'Cash Flow'], ['savingsRate', 'Savings Rate'],
    ['debtPressure', 'Debt Load'], ['emergencyFund', 'Runway'], ['investments', 'Investing Fuel'],
  ].map(([key, label]) => {
    const rating = clamp(Math.round(relative[key] * 5), 1, 5);
    return { key, label, rating, word: ['Warning', 'Watch', 'Steady', 'Solid', 'Strong'][rating - 1], tone: rating >= 4 ? 'good' : rating === 3 ? 'watch' : 'warning' };
  });
  const overBy = Math.max(0, -m.cashRemaining);
  const denominator = overBy ? v.needs + v.wants + v.savings + v.extraDebtPayment : v.income;
  const mix = [['needs', 'Needs', v.needs], ['wants', 'Wants', v.wants], ['savings', 'Savings', v.savings], ['extraDebt', 'Extra debt', v.extraDebtPayment]];
  if (!overBy) mix.push(['unassigned', 'Unassigned', m.cashRemaining]);
  const paycheckMix = { overBy, unassigned: Math.max(0, m.cashRemaining), shares: mix.map(([key, label, amount]) => ({ key, label, amount, percent: denominator > 0 ? Math.round(amount / denominator * 100) : 0 })) };
  // With no essential bills, saved cash covers the full display scale. No savings means no runway.
  const months = v.needs > 0 ? v.emergencyFundSaved / v.needs : v.emergencyFundSaved > 0 ? Infinity : 0;
  const goal = v.needs > 0 ? v.emergencyFundGoal / v.needs : v.emergencyFundGoal > 0 ? Infinity : 0;
  const checks = [
    { label: 'Income covers the plan', state: m.cashRemaining >= 0 ? 'yes' : 'no', answer: overBy ? 'Over' : 'Covered', sentence: overBy ? `Your plan is over by ${money(overBy)} each month.` : `Your income covers your plan with ${money(m.cashRemaining)} unassigned.` },
    { label: 'Saving 10% or more', state: m.savingsRate >= .1 ? 'yes' : m.savingsRate >= .05 ? 'partial' : 'no', answer: m.savingsRate >= .1 ? 'Yes' : m.savingsRate >= .05 ? 'Almost' : 'Not yet', sentence: `Your savings rate is ${pct(m.savingsRate)} of take home pay.` },
    { label: 'Debt under 2x monthly income', state: !v.totalDebtBalance || m.debtToIncome <= 2 ? 'yes' : m.debtToIncome <= 4 ? 'partial' : 'no', answer: !v.totalDebtBalance ? 'No debt' : m.debtToIncome <= 2 ? 'Yes' : m.debtToIncome <= 4 ? 'Close' : 'Not yet', sentence: !v.totalDebtBalance ? 'You have no debt outside your mortgage.' : `Your debt of ${money(v.totalDebtBalance)} is ${m.debtToIncome.toFixed(2)} times your monthly income.` },
    { label: 'One month of runway', state: months >= 1 ? 'yes' : months >= .5 ? 'partial' : 'no', answer: months >= 1 ? 'Yes' : months >= .5 ? 'Almost' : 'Not yet', sentence: v.needs === 0 && v.emergencyFundSaved > 0 ? `You have ${money(v.emergencyFundSaved)} saved and no monthly needs entered.` : `Your emergency savings cover ${months.toFixed(1)} months of needs.` },
    { label: 'Paying extra on debt', state: !v.totalDebtBalance || v.extraDebtPayment > 0 ? 'yes' : 'no', answer: !v.totalDebtBalance ? 'No debt' : v.extraDebtPayment > 0 ? 'Yes' : 'Not yet', sentence: !v.totalDebtBalance ? 'You have no debt requiring extra payments.' : `You put ${money(v.extraDebtPayment)} toward debt above minimums each month.` },
    { label: 'Investing for later', state: v.investmentsCurrentValue > 0 ? 'yes' : 'no', answer: v.investmentsCurrentValue > 0 ? 'Started' : 'Not yet', sentence: v.investmentsCurrentValue > 0 ? `You have ${money(v.investmentsCurrentValue)} invested for later.` : 'You have not started investing yet.' },
  ];
  const greenLights = checks.filter(c => c.state === 'yes').slice(0, 3).map(c => c.sentence);
  const warningLights = [...new Set([
    ...b.priorityAlerts.map(a => plain(a.message)),
    ...checks.filter(c => c.state === 'no').map(c => c.sentence),
    ...checks.filter(c => c.state === 'partial').map(c => c.sentence),
  ])].slice(0, 3);
  // Preserve the approved plan ranking, subjective-pressure safeguards and objective tie breaks.
  // The Flight Report is the single view of that existing plan, not a second priority engine.
  const plan = generatePersonalizedFlightPlan({
    derivedContext: { score: result.score, stageKey: stage.key, stageName: stage.name,
      relativeScores: getRelativeCategoryScores(result.categoryScores),
      pressureMetrics: { cashRemaining: m.cashRemaining, savingsRate: m.savingsRate, emergencyFundLevel: m.emergencyFundLevel } },
    immediatePressure, shortTermObjective,
  });
  const primaryAction = plan.warningLights?.[0]?.actionId;
  let move = plain(plan.doNow);
  let followLine = '';
  if (overBy) move = `Find ${money(Math.round((overBy + Number.EPSILON) * 100) / 100)} to close the gap before your next payday.`;
  else if (m.savingsRate < .1 && m.cashRemaining > 0 && ['savingsSystem', 'emergencyRunway'].includes(primaryAction)) {
    // Work in cents and never recommend more than cash or the savings shortfall.
    const availableCents = Math.max(0, Math.floor((Math.min(m.cashRemaining, .1 * v.income - v.savings) + 1e-9) * 100));
    const transfer = (availableCents >= 2500 ? Math.floor(availableCents / 2500) * 2500 : availableCents) / 100;
    if (transfer > 0) {
      move = `Move ${money(transfer)} of unassigned cash into savings on payday.`;
      followLine = `That lifts your savings rate to ${pct((v.savings + transfer) / v.income)}.`;
    } else move = 'Review your bills before payday. There is less than one cent available for an extra transfer.';
  } else if (m.cashRemaining === 0) {
    move = 'Review your bills before payday. Your current plan has no unassigned cash for an extra transfer.';
  }
  // Construct date-only strings in local time, without UTC date shifts or DST arithmetic.
  const date = typeof flightDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(flightDate)
    ? new Date(...flightDate.split('-').map((part, i) => Number(part) - (i === 1 ? 1 : 0))) : new Date(flightDate);
  const next = new Date(date); next.setDate(next.getDate() + 30);
  const formatDate = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    focus: [immediatePressure, shortTermObjective].filter(Boolean),
    plan: { strongSignal: plain(plan.strongSignal.category), warningLights: (plan.warningLights || []).map(w => plain(w.category)),
      doNow: plain(plan.doNow), thisPayday: plain(plan.thisPayday), thisMonth: plain(plan.thisMonth),
      thirtyDayMission: plain(plan.thirtyDayMission), flagContextNote: plan.flagContextNote ? plain(plan.flagContextNote) : '',
      workbookTab: plain(plan.workbookConnection.tab), workbookAction: plain(plan.workbookConnection.action) },
    inputs: [
      ['Monthly take home income', v.income], ['Monthly needs including minimum debt payments', v.needs],
      ['Monthly wants', v.wants], ['Monthly cash savings contributions', v.savings],
      ['Monthly extra debt payments', v.extraDebtPayment], ['Current debt balance excluding mortgage', v.totalDebtBalance],
      ['Current emergency cash saved', v.emergencyFundSaved], ['Emergency cash goal', v.emergencyFundGoal],
      ['Current long term investments', v.investmentsCurrentValue],
    ].map(([label, amount]) => ({ label, amount })),
    score: result.score, stage: { ...stage, message: plain(stage.message), nextAction: plain(stage.nextAction) },
    flightDate: formatDate(date), nextCheckDate: formatDate(next), instruments, paycheckMix, checks,
    runway: { monthsCovered: Number.isFinite(months) ? Math.round(months * 10) / 10 : 6, goalMonths: Number.isFinite(goal) ? goal : 6, zone: months < 1 ? 'Thin' : months < 3 ? 'Building' : 'Cleared', scaleMonths: Math.min(6, months), scaleMax: 6, noMonthlyNeeds: v.needs === 0 },
    greenLights, warningLights, oneMove: { text: move, followLine, starterSection: plain(plan.workbookConnection.tab) },
    readouts: [
      ['Cash left', overBy ? `Over by ${money(overBy)}` : money(m.cashRemaining)],
      ['Savings rate', pct(m.savingsRate)], ['Debt vs monthly income', `${m.debtToIncome.toFixed(2)}x`],
      ['Runway goal reached', pct(m.emergencyFundLevel)], ['Invested so far', money(v.investmentsCurrentValue)],
      ['Extra to debt', money(v.extraDebtPayment)],
    ].map(([label, text]) => ({ label, text })),
  };
}
