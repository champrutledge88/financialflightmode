// Standalone, script-free two-page report. All detailed rows remain in the on-screen cockpit.
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollars = number => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(number);
const shortLabels = {
  'Monthly take home income':'Take home income / month',
  'Monthly needs including minimum debt payments':'Needs / month (includes minimum debt payments)',
  'Monthly wants':'Wants / month',
  'Monthly cash savings contributions':'Cash savings contributions / month',
  'Monthly extra debt payments':'Extra debt payments / month',
  'Current debt balance excluding mortgage':'Debt balance (excluding mortgage)',
  'Current emergency cash saved':'Emergency cash saved',
  'Emergency cash goal':'Personal emergency goal',
  'Current long term investments':'Long term investments',
  'Required monthly debt payments outside mortgage (already included in needs)':'Required debt payments / month (included in needs)',
};
export function buildSnapshotHTML(report) {
  const rows = entries => entries.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'; base-uri 'none'">
<title>Financial Flight Mode · ${escape(report.flightDate)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eee;color:#151515;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.sheet{max-width:850px;margin:24px auto;background:#fff}.report-page{padding:32px 40px}.report-page+.report-page{border-top:2px solid #ddd}
header{border-top:6px solid #e95c03;padding-top:12px}h1,h2,h3{line-height:1.15}h1,.page-title{font-size:32px;letter-spacing:-.8px;margin:7px 0}h2{font-size:19px;margin:19px 0 9px}h3{font-size:19px;margin:9px 0}p{margin:8px 0}.brand{font-size:12px;font-weight:800;letter-spacing:2px}.meta,.note{color:#555;font-size:12px}
.score{background:#111;color:#fff;padding:18px;border-radius:10px;display:flex;align-items:center;gap:20px;margin-top:16px}.score>strong{font-size:58px;color:#ff8b43;white-space:nowrap;flex-shrink:0}.score h2{margin:0}.score p{font-size:13px}
.priority{border-left:5px solid #e95c03;padding:10px 16px;margin:18px 0;background:#fff5ed}.priority h2{margin-top:0}.priority p{font-size:13px}
dl{margin:0}dl div{display:flex;justify-content:space-between;align-items:baseline;gap:14px;border-bottom:1px solid #ddd;padding:7px 0}dt{min-width:0;max-width:70%;overflow-wrap:anywhere}dd{margin:0;font-weight:700;text-align:right;max-width:45%;overflow-wrap:anywhere}
.follow{padding:10px 0}.follow p{font-size:13px}.lines{margin-top:22px}.lines p{font-size:14px;margin:17px 0 0;padding-bottom:28px;border-bottom:1px solid #aaa}
footer{font-size:11px;color:#555;border-top:1px solid #bbb;margin-top:22px;padding-top:10px}.page-number{font-size:11px;color:#666;text-align:right;margin-top:14px}.print-hint{font-size:12px;color:#555}
@media(max-width:600px){.sheet{margin:0}.report-page{padding:24px 20px}h1{font-size:28px}.score{gap:12px}.score>strong{font-size:45px}dl{font-size:13px}dd{max-width:42%}}
@page{size:auto;margin:12mm}
@media print{
 body{background:white;font-size:10pt;line-height:1.3}.sheet{margin:0;max-width:none}.report-page{padding:0;break-after:page}.report-page:last-child{break-after:auto}.report-page+.report-page{border:0;padding-top:2mm}
 header{padding-top:8px}h1,.page-title{font-size:26px}h2{font-size:15px;margin:14px 0 7px}h3{font-size:16px}.score{padding:12px;margin-top:12px;background:white;color:black;border:1px solid #111}.score>strong{font-size:46px;color:#e95c03}.score p{font-size:10pt}.priority{margin:14px 0;padding:8px 12px;background:#fff5ed}.priority p,.follow p{font-size:10pt}dl{font-size:10pt}dl div{padding:5px 0}.follow{padding:6px 0}.lines{margin-top:20px}.lines p{font-size:11pt;padding-bottom:33px;margin-top:18px}.meta,.note{font-size:9pt}footer{font-size:8pt;margin-top:20px}.print-hint{display:none}.page-number{font-size:8pt;margin-top:12px}
 header,.score,.priority,.follow,dl div,.lines{break-inside:avoid}h2,h3{break-after:avoid}
}
</style></head><body><main class="sheet">
<section class="report-page" aria-label="Page 1: Your briefing">
<header><p class="brand">FINANCIAL FLIGHT MODE</p><h1>Your Flight Report</h1><p class="meta">${escape(report.flightDate)} · Next check ${escape(report.nextCheckDate)} · US dollars</p></header>
<p class="print-hint">Keep this file privately. Print or save as PDF for a two-page report.</p>
<section class="score"><strong>${report.score}<small style="font-size:16px"> / 100</small></strong><div><h2>${escape(report.stage.name)}</h2><p>${escape(report.summary)}</p>${report.stageNote ? `<p>${escape(report.stageNote)}</p>` : ''}<p class="note">Educational estimate.${report.debtAssessmentLimited ? ' Debt assessment limited.' : ''}</p></div></section>
<section class="priority"><h2>Your next 7 days</h2><h3>${escape(report.oneMove.text)}</h3><p><strong>Why this comes first:</strong> ${escape(report.reason)}</p>${report.oneMove.followLine ? `<p>${escape(report.oneMove.followLine)}</p>` : ''}<p><strong>Starter Kit:</strong> ${escape(report.oneMove.starterSection)}</p></section>
<h2>Your instrument readouts</h2><dl>${rows(report.readouts.map(r=>[r.label,r.text]))}</dl>
<div class="follow"><p><strong>Your 30 day mission:</strong> ${escape(report.plan.thirtyDayMission)}</p>${report.plan.thisPayday !== report.oneMove.text ? `<p><strong>This payday:</strong> ${escape(report.plan.thisPayday)}</p>` : ''}${report.plan.flagContextNote ? `<p class="note">${escape(report.plan.flagContextNote)}</p>` : ''}</div>
<p class="page-number">1 / 2</p>
</section>
<section class="report-page" aria-label="Page 2: Your snapshot and reflection">
<header><p class="brand">YOUR CHECKPOINT</p><h2 class="page-title">Review. Reflect. Adjust.</h2><p class="meta">${escape(report.flightDate)} · Return on ${escape(report.nextCheckDate)}</p></header>
<h2>Your input snapshot</h2><p class="note">Monthly amounts are flows; other amounts are balances. Required debt payments are already included in needs.</p>
<dl>${rows(report.inputs.map(r=>[shortLabels[r.label]||r.label,dollars(r.amount)]))}</dl>
<p class="note">Category and account details remain in your on-screen cockpit. This concise report keeps the totals.</p>
<section class="lines"><h2>Reflect on ${escape(report.nextCheckDate)}</h2><p>What action did I take?</p><p>What changed in my cash, savings or debt?</p><p>What will I adjust before the next payday?</p></section>
<footer>Education only. A planning signal, not personal financial advice. FFM does not store your answers. Keep this saved copy private. Scoring ${escape(report.scoringVersion)}. Compare future checkpoints using the same definitions.</footer>
<p class="page-number">2 / 2</p>
</section></main></body></html>`;
}
export function snapshotFilename(report) {
  return `FFM-Flight-Report-${report.flightDate.replace(/[^a-z0-9]+/gi,'-')}.html`;
}
