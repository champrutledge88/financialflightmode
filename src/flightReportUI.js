import { buildFlightReport, money } from './flightReport.js?v=phase2-1';
import { trackEvent, getScoreBand } from './analytics.js?v=ga4-1';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = state => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="${state === 'yes' ? 'M5 12l4 4L19 6' : state === 'partial' ? 'M5 12h14' : 'M6 6l12 12M18 6L6 18'}"/></svg>`;
const plane = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="m2 10 8 1 5-8h3l-3 8 6 2v2l-7-1-4 7H7l3-8-8-1z"/></svg>';
const stages = [['preflight', 'Pre Flight', '0 to 39'], ['turbulence', 'Turbulence', '40 to 69'], ['cruise', 'Cruise Control', '70 to 89'], ['flight', 'Flight Mode', '90 to 100']];
let activeReveal = null;

export function renderFlightReport(result, { example = false } = {}) {
  const report = buildFlightReport(result, { flightDate: new Date() });
  let node = document.querySelector('#flight-report');
  if (!node) {
    node = document.createElement('section'); node.id = 'flight-report'; node.className = 'flight-report';
    document.querySelector('.results-panel').before(node);
  }
  node.innerHTML = `
    <header class="report-header"><div><p class="eyebrow">${example ? 'Example report' : 'Your cockpit briefing'}</p><h2 tabindex="-1">Your Flight Report</h2></div><p>${escape(report.flightDate)}<br><span>Next check ${escape(report.nextCheckDate)}</span></p></header>
    <div class="report-top"><div class="report-score"><p>Financial Flight Score</p><div class="report-ring" style="--score:${report.score}"><strong data-report-score>${report.score}</strong><span>out of 100</span></div><h3 class="report-stage">${escape(report.stage.name)}</h3><p>This measures financial control.</p></div>
    <div class="instrument-grid">${report.instruments.map((i, n) => `<article class="instrument ${i.tone}" style="--order:${n}"><h3>${i.label}</h3><strong>${i.word}</strong><span>${i.rating}/5</span><div class="rating-segments" aria-label="${i.rating} out of 5">${Array.from({ length: 5 }, (_, j) => `<i class="${j < i.rating ? 'filled' : ''}"></i>`).join('')}</div></article>`).join('')}</div></div>
    <article class="report-card paycheck"><h3>Where Your Paycheck Goes</h3><p class="report-pill">${report.paycheckMix.overBy ? `Over by ${money(report.paycheckMix.overBy)}` : `${money(report.paycheckMix.unassigned)} unassigned`}</p><div class="paycheck-bar" aria-hidden="true">${report.paycheckMix.shares.map(s => `<i class="mix-${s.key}" style="flex:${s.amount}"></i>`).join('')}</div><ul class="mix-legend">${report.paycheckMix.shares.map(s => `<li><i class="mix-${s.key}"></i>${s.label} <strong>${s.percent}%</strong></li>`).join('')}</ul>${report.paycheckMix.overBy ? '<p>Shares show your total outflow because your plan exceeds income.</p>' : ''}</article>
    <article class="report-card"><h3>Pre Flight Checks</h3><div class="checks-grid">${report.checks.map(c => `<div class="flight-check ${c.state}">${icon(c.state)}<span>${c.label}</span><strong>${c.answer}</strong></div>`).join('')}</div></article>
    <article class="report-card"><h3>Flight Path</h3><div class="flight-track"><span class="plane-marker" style="left:${report.score}%" aria-label="Score position ${report.score}">${plane}</span></div><div class="flight-stages">${stages.map(([key, name, range]) => `<div class="${key === report.stage.key ? 'current' : ''}" ${key === report.stage.key ? 'aria-current="step"' : ''}><strong>${name}</strong><span>${range}</span></div>`).join('')}</div><p>${escape(report.stage.message)}</p></article>
    <div class="report-columns"><article class="report-card"><h3>Instrument Readouts</h3><dl class="report-readouts">${report.readouts.map(r => `<div><dt>${r.label}</dt><dd>${escape(r.text)}</dd></div>`).join('')}</dl></article>
    <article class="report-card"><h3>Emergency Runway</h3><p class="runway-number">${report.runway.monthsCovered.toFixed(1)} <span>months covered</span></p>${report.runway.noMonthlyNeeds ? '<p>No monthly needs entered. Saved cash covers the display scale when available.</p>' : ''}<div class="runway-track" role="img" aria-label="${report.runway.monthsCovered.toFixed(1)} months covered. Goal ${report.runway.goalMonths.toFixed(1)} months. Scale 0 to 6 months."><div class="runway-fill" style="width:${report.runway.scaleMonths / 6 * 100}%"></div><i class="goal-marker" style="left:${Math.min(6, report.runway.goalMonths) / 6 * 100}%"></i></div><div class="runway-zones"><span>Thin<br>Under 1</span><span>Building<br>1 to under 3</span><span>Cleared<br>3 or more</span></div><p>${report.runway.zone} · Goal ${report.runway.goalMonths.toFixed(1)} months · Scale 6 months</p></article></div>
    <div class="report-columns"><article class="report-card lights green-lights"><h3>Green Lights</h3>${report.greenLights.length ? report.greenLights.map(s => `<p>${escape(s)}</p>`).join('') : '<p>Start with your next move. Every check is a place to build.</p>'}</article><article class="report-card lights warning-lights ${report.warningLights.length ? 'has-warnings' : ''}"><h3>Warning Lights</h3>${report.warningLights.length ? report.warningLights.map(s => `<p>${escape(s)}</p>`).join('') : '<p>No warning lights on these checks. Keep your next review on the calendar.</p>'}</article></div>
    <article class="one-move"><p class="eyebrow">Your Next 7 Days</p><h3>${escape(report.oneMove.text)}</h3>${report.oneMove.followLine ? `<p>${escape(report.oneMove.followLine)}</p>` : ''}<p>Starter Kit section: <strong>${escape(report.oneMove.starterSection)}</strong></p></article>
    <p class="report-footer">Education only. Your numbers were not stored.</p>`;
  return node;
}

export function revealFlightReport(result, { animateScore, onComplete }) {
  activeReveal?.();
  const node = renderFlightReport(result);
  node.scrollIntoView({ behavior: 'instant', block: 'start' });
  const finish = (skipped = false) => {
    if (done) return;
    done = true; timers.forEach(clearTimeout); cancelScore();
    document.removeEventListener('keydown', onKey);
    if (skipped) trackEvent('reveal_skip', { reveal_phase: phase });
    document.querySelector('main')?.removeAttribute('inert');
    overlay.remove(); node.classList.remove('revealing'); node.removeAttribute('aria-hidden');
    onComplete();
    trackEvent('report_view', { stage_key: result.stage.key, score_band: getScoreBand(result.score), is_return: false });
    node.scrollIntoView({ behavior: 'instant', block: 'start' }); node.querySelector('h2').focus({ preventScroll: true });
    activeReveal = null;
  };
  let done = false, phase = 'instruments', cancelScore = () => {};
  const timers = [];
  const overlay = document.createElement('div'); overlay.className = 'reveal-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Your Flight Check is ready');
  overlay.innerHTML = `<div class="reveal-content"><button type="button" class="reveal-skip">Skip</button><p class="eyebrow">Your Flight Check</p><h2>Reading your instruments</h2><div class="reveal-names">${['Cash Flow', 'Savings Rate', 'Debt Load', 'Runway', 'Investing Fuel'].map(n => `<span>${n}</span>`).join('')}</div><div class="reveal-gauge" style="--score:0"><strong>0</strong><span>out of 100</span></div><h3 class="reveal-stage">${escape(result.stage.name)}</h3><div class="reveal-path"><span>${plane}</span></div><p class="reveal-status" aria-live="polite">Preparing your report</p></div>`;
  const onKey = event => {
    if (event.key === 'Escape') finish(true);
    if (event.key === 'Tab') { event.preventDefault(); overlay.querySelector('button').focus(); }
  };
  document.addEventListener('keydown', onKey);
  activeReveal = finish;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
  node.classList.add('revealing'); node.setAttribute('aria-hidden', 'true'); document.body.append(overlay); document.querySelector('main')?.setAttribute('inert', '');
  overlay.querySelector('button').focus(); overlay.querySelector('button').onclick = () => finish(true);
  const later = (fn, delay) => timers.push(setTimeout(fn, delay));
  overlay.querySelectorAll('.reveal-names span').forEach((s, i) => later(() => s.classList.add('on'), i * 220));
  later(() => {
    phase = 'score';
    cancelScore = animateScore(0, result.score, overlay.querySelector('.reveal-gauge strong'), overlay.querySelector('.reveal-gauge'), 1500);
  }, 1200);
  later(() => {
    phase = 'stage'; overlay.classList.add('stage-locked');
    overlay.querySelector('.reveal-path span').style.left = `${result.score}%`;
    try { navigator.vibrate?.(15); } catch { /* Optional device feedback. */ }
  }, 2700);
  later(() => {
    phase = 'tiles'; node.classList.add('reveal-tiles'); overlay.classList.add('reveal-finishing');
    overlay.querySelector('.reveal-status').textContent = 'Your next move is ready';
  }, 3200);
  later(() => finish(), 4000);
}
