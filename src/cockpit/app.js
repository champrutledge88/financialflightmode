import { readStatement } from "./bankFormats.js";
import { BANK_HINTS, EXPORT_STEPS, SUPPORTED_BANKS } from "./banks.js";
import { CATEGORIES, CATEGORY_NAMES, GROUPS, displayMerchant, groupOf, isSpending, merchantKey } from "./categorize.js";
import { columnBars, divergingBars, foldSlices, glassDonut, lineChart, pairedBars, ring, stackedBar } from "./charts.js";
import { PERIODS, categoryBreakdown, categoryChanges, categoryDetail, dailyStats, keepRateTrend, outlook, spendingPace } from "./deepInsights.js";
import { confetti, haptic, prefersReducedMotion } from "./effects.js";
import { addDays, daysBetween, todayIso } from "./dates.js";
import {
  compactMoney,
  dateRange,
  escapeHtml,
  longDate,
  money,
  monthLabel,
  percent,
  plural,
  relativeDay,
  shortDate,
  signedMoney,
  wholeMoney,
} from "./format.js";
import { ICONS, medalBadge } from "./icons.js";
import { buildInsights } from "./insights.js";
import { evaluateMedals, medalCount, newlyEarned, reviewStreak, weekIndex } from "./medals.js";
import { buildSampleStatement, buildTestCsv } from "./sampleData.js";
import { createStore, emptyState, exportBackup, importBackup, mergeImport, removeAccount, withCategories } from "./store.js";

const EDUCATION_NOTE =
  "Cockpit is financial education and decision support, not personal financial, investment, tax, legal, or debt advice. It never recommends a security, lender, credit product, debt settlement provider, tax position, or legal action.";

const safeStorage = () => {
  try {
    const probe = "__ffm_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
};

const store = createStore(safeStorage());
let state = store.load();
let derived = null;
let pendingImport = null;
const view = { tab: "today", query: "", filter: "all", limit: 120, period: "90", slices: [], selectedSlice: null };

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const today = () => todayIso();
const tap = () => navigator.vibrate?.(8);

// ---------- Derived data ----------

const emptyInsights = () => ({ today: today(), range: { days: 0 }, months: [], monthsCounted: 0, averages: { savingsRate: 0 }, cycles: [] });

const activitySummary = () => ({
  imports: state.activity.imports,
  audits: state.activity.audits,
  reviews: state.activity.reviews,
  accounts: state.accounts.length,
  rules: Object.keys(state.overrides).length,
});

const recompute = () => {
  const transactions = withCategories(state);
  const insights = transactions.length
    ? buildInsights({ transactions, today: today(), balanceOverride: state.settings.balance, cushion: state.settings.cushion })
    : null;
  const medals = evaluateMedals({ insights: insights ?? emptyInsights(), activity: activitySummary() });
  derived = { transactions, insights, medals };
};

const persist = () => {
  if (!store.save(state)) showToast("Storage is full or blocked. Export a backup from Settings.");
};

const commit = ({ celebrate = true } = {}) => {
  const before = state.medals ?? [];
  recompute();
  const earned = newlyEarned(before, derived.medals);
  state.medals = derived.medals.map(({ id, tier }) => ({ id, tier }));
  persist();
  render();
  if (celebrate && earned.length && !state.sample) setTimeout(() => openMedalCelebration(earned), 380);
};

// ---------- Small render helpers ----------

const amountClass = (cents) => (cents > 0 ? "amount-in" : "amount-out");

const categoryDot = (category) => {
  const color = CATEGORIES[category]?.color ?? "#636366";
  const letter = escapeHtml(category.charAt(0));
  return `<span class="cat-dot" style="--dot:${color}" aria-hidden="true">${letter}</span>`;
};

const section = (title, body, { footer = "", action = "" } = {}) => `
  <section class="group">
    ${title ? `<div class="group-header"><h2>${title}</h2>${action}</div>` : ""}
    ${body}
    ${footer ? `<p class="group-footer">${footer}</p>` : ""}
  </section>`;

const row = ({ leading = "", title, subtitle = "", trailing = "", action = "", data = "", chevron = false }) => {
  const tag = action ? "button" : "div";
  const attrs = action ? ` type="button" data-action="${action}" ${data}` : "";
  return `<${tag} class="row${action ? " row-button" : ""}"${attrs}>
    ${leading}
    <span class="row-text"><span class="row-title">${title}</span>${subtitle ? `<span class="row-subtitle">${subtitle}</span>` : ""}</span>
    ${trailing ? `<span class="row-trailing">${trailing}</span>` : ""}
    ${chevron ? `<span class="row-chevron">${ICONS.chevron}</span>` : ""}
  </${tag}>`;
};

const list = (rows) => `<div class="list">${rows.join("")}</div>`;

const stat = (label, value, note = "", tone = "") => `
  <div class="stat ${tone}">
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
    ${note ? `<span class="stat-note">${note}</span>` : ""}
  </div>`;

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// ---------- Financial Flight Mode content ----------

const FLIGHT_MODE_LINKS = [
  { title: "Flight Scorecard", copy: "Find your Flight Score in a few minutes.", href: "/#scorecard", icon: "today" },
  { title: "The Weekly Briefing", copy: "One useful money move every week.", href: "https://briefing.financialflightmode.com", icon: "mail" },
  { title: "Flight Notes", copy: "Plain guides for real money decisions.", href: "/flight-notes.html", icon: "book" },
  { title: "Starter Kit", copy: "The Flight Plan workbook and Pre Flight setup.", href: "/#starter-kit", icon: "kit" },
  { title: "Join the Conversation", copy: "Follow Financial Flight Mode on X.", href: "https://x.com/MarkFlightmode", icon: "people" },
];

const flightModeHub = () => `
  <section class="group">
    <div class="group-header"><h2>From Financial Flight Mode</h2></div>
    <div class="hub">${FLIGHT_MODE_LINKS.map(
      (link) => `<a class="hub-tile glass" href="${link.href}" target="_blank" rel="noopener">
        <span class="hub-icon">${ICONS[link.icon]}</span>
        <strong>${link.title}</strong>
        <span>${link.copy}</span>
      </a>`,
    ).join("")}</div>
  </section>`;

const flightModeList = () =>
  section(
    "Financial Flight Mode",
    list(
      FLIGHT_MODE_LINKS.map(
        (link) => `<a class="row row-button" href="${link.href}" target="_blank" rel="noopener">
          <span class="row-icon accent">${ICONS[link.icon]}</span>
          <span class="row-text"><span class="row-title">${link.title}</span><span class="row-subtitle">${link.copy}</span></span>
          <span class="row-chevron">${ICONS.external}</span>
        </a>`,
      ),
    ),
  );

// ---------- Appearance ----------

const THEMES = [
  ["auto", "Automatic"],
  ["light", "Light"],
  ["dark", "Dark"],
];

const applyTheme = () => {
  const theme = state.settings.theme ?? "auto";
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const dark = theme === "dark" || (theme === "auto" && !window.matchMedia?.("(prefers-color-scheme: light)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#050505" : "#F2F2F7");
};

// ---------- Today ----------

const renderWelcome = () => `
  <div class="welcome">
    <img class="welcome-mark" src="/assets/logos/ffm-icon-mark.png" alt="" width="96" height="62" />
    <h2 class="welcome-title">Your money, in command.</h2>
    <p class="welcome-copy">Import a CSV from your bank. Cockpit reads it on this device, learns your paydays and bills, and shows you what you can safely spend before the next paycheck.</p>
    <div class="button-stack">
      <button type="button" class="button button-primary" data-action="import">${ICONS.upload}<span>Import Bank CSV</span></button>
      <button type="button" class="button button-secondary" data-action="sample">Explore With Sample Data</button>
      <button type="button" class="button button-plain" data-action="bank-guide">How do I get a CSV from my bank?</button>
      <button type="button" class="button button-plain" data-action="test-csv">${ICONS.file}<span>Download a test CSV</span></button>
    </div>
  </div>
  ${section(
    "",
    list([
      row({ leading: `<span class="row-icon">${ICONS.lock}</span>`, title: "Stays on this device", subtitle: "No bank login. No upload to our servers. Nothing to sell." }),
      row({ leading: `<span class="row-icon">${ICONS.bank}</span>`, title: `${SUPPORTED_BANKS.length} bank formats recognized`, subtitle: "Plus most other banks and credit unions." }),
      row({ leading: `<span class="row-icon">${ICONS.spark}</span>`, title: "Gets smarter as you import", subtitle: "More history means sharper payday plans and trends." }),
    ]),
  )}
  ${flightModeHub()}`;

const installCard = () => {
  if (isStandalone() || !isIos() || state.settings.installHintDismissed) return "";
  return `<div class="card card-install">
    <span class="row-icon">${ICONS.share}</span>
    <div><strong>Add Cockpit to your Home Screen</strong><p>Tap Share in Safari, then Add to Home Screen. It opens full screen like any app.</p></div>
    <button type="button" class="icon-button" data-action="dismiss-install" aria-label="Dismiss">${ICONS.close}</button>
  </div>`;
};

const sampleBanner = () =>
  state.sample
    ? `<div class="card card-sample"><div><strong>You are exploring sample data.</strong><p>Import your own CSV and the sample disappears. Want to test importing? <button type="button" class="inline-link" data-action="test-csv">Download a test CSV</button></p></div>
        <button type="button" class="button button-small" data-action="import">Import</button></div>`
    : "";

const staleBanner = (insights) =>
  insights.staleDays > 10
    ? `<div class="card card-notice"><span class="row-icon">${ICONS.calendar}</span><div><strong>Your latest transaction is from ${shortDate(insights.range.last)}.</strong><p>Import a fresh CSV to keep your numbers current.</p></div></div>`
    : "";

const heroCard = (insights) => {
  const { plan, paycheck } = insights;
  const cycle = plan.cycle;
  const rings = cycle
    ? ring({
        size: 112,
        stroke: 12,
        rings: [
          { value: cycle.spentShare, color: cycle.spentShare > cycle.elapsedShare + 0.1 ? "var(--red)" : "var(--accent)", track: "var(--ring-track)" },
          { value: cycle.elapsedShare, color: "var(--label)", track: "var(--ring-track)" },
        ],
      })
    : "";
  const paydayLine = paycheck
    ? `Next payday ${relativeDay(plan.nextPayday, insights.today, plan.daysLeft)} · ${plural(plan.daysLeft, "day")}`
    : "Cockpit needs three paychecks to learn your payday.";

  let headline;
  if (plan.safeToSpend === null) {
    headline = `<span class="hero-label">Safe to Spend</span>
      <button type="button" class="hero-cta" data-action="balance">Add your current balance</button>
      <span class="hero-sub">${paydayLine}</span>`;
  } else if (plan.safeToSpend < 0) {
    headline = `<span class="hero-label">Short Before Payday</span>
      <span class="hero-value value-short" data-count="${plan.safeToSpend}">${money(plan.safeToSpend)}</span>
      <span class="hero-sub">${paydayLine}</span>`;
  } else {
    headline = `<span class="hero-label">Safe to Spend</span>
      <span class="hero-value" data-count="${plan.safeToSpend}">${money(plan.safeToSpend)}</span>
      <span class="hero-sub">${money(plan.perDay)} a day · ${paydayLine}</span>`;
  }

  const legend = cycle
    ? `<div class="ring-legend">
        <span><i style="background:${cycle.spentShare > cycle.elapsedShare + 0.1 ? "var(--red)" : "var(--accent)"}"></i>Flexible spending ${percent(Math.min(cycle.spentShare, 1.5))} of usual</span>
        <span><i style="background:var(--label)"></i>Pay cycle ${percent(cycle.elapsedShare)} complete</span>
      </div>`
    : "";

  return `<div class="card hero">
    <div class="hero-main"><div class="hero-copy">${headline}</div>${rings ? `<div class="hero-ring">${rings}</div>` : ""}</div>
    ${legend}
    ${plan.balance ? `<button type="button" class="hero-foot" data-action="balance">Balance ${money(plan.balance.amount)} as of ${shortDate(plan.balance.date)}${plan.balance.source === "statement" ? " from your statement" : ""} · Bills ${money(plan.billsTotal)}${plan.cushion ? ` · Cushion ${money(plan.cushion)}` : ""}</button>` : ""}
  </div>`;
};

const beforePayday = (insights) => {
  const { plan } = insights;
  const rows = plan.billsDue.map((bill) =>
    row({
      leading: categoryDot(bill.category),
      title: escapeHtml(bill.name),
      subtitle: `${relativeDay(bill.nextDate, insights.today, daysBetween(insights.today, bill.nextDate))} · ${bill.cadence.label}`,
      trailing: `<span class="amount-out">${money(bill.typicalAmount)}</span>`,
    }),
  );
  const projection =
    plan.projectedLanding !== null
      ? row({
          leading: `<span class="row-icon">${ICONS.plane}</span>`,
          title: plan.projectedLanding >= 0 ? "Projected landing" : "Projected shortfall",
          subtitle: `If flexible spending holds at your usual ${money(plan.dailyFlexible)} a day`,
          trailing: `<span class="${plan.projectedLanding >= 0 ? "amount-in" : "amount-out"}">${money(plan.projectedLanding)}</span>`,
        })
      : "";
  const body = rows.length
    ? list([...rows, row({ title: "<strong>Total before payday</strong>", trailing: `<strong>${money(plan.billsTotal)}</strong>` }), projection])
    : list([row({ leading: `<span class="row-icon ok">${ICONS.check}</span>`, title: "No known bills before payday", subtitle: "Cockpit lists bills it has seen at least twice." }), projection]);
  return section(plan.nextPayday ? `Before ${shortDate(plan.nextPayday)}` : "Next Two Weeks", body);
};

const signalCards = (insights) => {
  const lights = insights.warningLights.slice(0, 2).map(
    (light) => `<div class="card signal signal-${light.level}">
      <span class="signal-icon">${ICONS.warning}</span>
      <div><span class="signal-kicker">Warning Light</span><strong>${escapeHtml(light.title)}</strong><p>${escapeHtml(light.detail)}${light.amount ? ` <b>${money(light.amount)}${light.amountLabel ? ` ${light.amountLabel}` : ""}</b>` : ""}</p></div>
    </div>`,
  );
  const strong = insights.strongSignal
    ? `<div class="card signal signal-green"><span class="signal-icon">${ICONS.spark}</span><div><span class="signal-kicker">Strong Signal</span><strong>${escapeHtml(insights.strongSignal.title)}</strong><p>${escapeHtml(insights.strongSignal.detail)}</p></div></div>`
    : "";
  return `<div class="signals">${strong}${lights.join("")}</div>`;
};

const reviewCard = (insights) => {
  const streak = reviewStreak(state.activity.reviews, insights.today);
  const doneThisWeek = state.activity.reviews.some((date) => weekIndex(date) === weekIndex(insights.today));
  return `<button type="button" class="card review-card" data-action="weekly-review">
    <span class="review-badge">${streak}<small>wk</small></span>
    <span class="review-text"><strong>${doneThisWeek ? "Weekly review complete" : "Run your weekly review"}</strong><span>${doneThisWeek ? "Nice work. Come back next week to keep the streak." : "Five minutes. One thing to correct."}</span></span>
    <span class="row-chevron">${ICONS.chevron}</span>
  </button>`;
};

const renderToday = () => {
  $("#today-date").textContent = longDate(today());
  const { insights } = derived;
  if (!insights) {
    $("#today-body").innerHTML = installCard() + renderWelcome();
    return;
  }
  $("#today-body").innerHTML = `
    ${installCard()}
    ${sampleBanner()}
    ${staleBanner(insights)}
    ${heroCard(insights)}
    <div class="card next-move"><span class="signal-kicker">Your Next Move</span><p>${escapeHtml(insights.nextMove)}</p></div>
    ${beforePayday(insights)}
    ${signalCards(insights)}
    ${reviewCard(insights)}
    ${flightModeHub()}
    <p class="fine-print">${escapeHtml(EDUCATION_NOTE)}</p>`;
  animateCounts($("#today-body"));
};

// ---------- Insights ----------

const STAGES = [
  { key: "preflight", name: "Pre Flight" },
  { key: "turbulence", name: "Turbulence" },
  { key: "cruise", name: "Cruise Control" },
  { key: "flight", name: "Flight Mode" },
];

const stageCard = (insights) => {
  const index = STAGES.findIndex((stage) => stage.key === insights.stage.key);
  return `<div class="card stage-card">
    <span class="signal-kicker">Flight Stage</span>
    <h2 class="stage-name">${escapeHtml(insights.stage.name)}</h2>
    <div class="stage-track">${STAGES.map((stage, position) => `<span class="${position <= index ? "on" : ""}${position === index ? " current" : ""}" title="${stage.name}"></span>`).join("")}</div>
    <div class="stage-labels">${STAGES.map((stage) => `<span>${stage.name}</span>`).join("")}</div>
    <p>${escapeHtml(insights.stage.reason)}</p>
    <a class="stage-link" href="/#scorecard" target="_blank" rel="noopener">Take the Flight Scorecard ${ICONS.chevron}</a>
  </div>`;
};

const numbersGrid = (insights) => {
  const { averages, monthsCounted, range } = insights;
  const basis = monthsCounted ? `Average of ${plural(monthsCounted, "full month")}` : "Based on your latest month so far";
  const net = averages.net;
  return section(
    "Know Your Numbers",
    `<div class="stat-grid">
      ${stat("Monthly income", wholeMoney(averages.income))}
      ${stat("Monthly spending", wholeMoney(averages.spending))}
      ${stat(net >= 0 ? "Monthly margin" : "Monthly shortfall", wholeMoney(net), "", net >= 0 ? "tone-in" : "tone-out")}
      ${stat("Keep rate", percent(averages.savingsRate), "of income not spent")}
    </div>
    <div class="spacer"></div>
    ${dailySection()}`,
    { footer: `${basis}. History covers ${dateRange(range.first, range.last)}.` },
  );
};

const cashFlowChart = (insights) => {
  const months = insights.months.slice(-6);
  if (months.length < 2) return "";
  const latest = months.at(-1);
  return section(
    "Cash Flow",
    `<div class="card chart-card">
      <div class="legend"><span><i class="dot-in"></i>Money in</span><span><i class="dot-out"></i>Money out</span></div>
      ${pairedBars({ items: months.map((month) => ({ label: monthLabel(month.key), a: month.income, b: month.spending })) })}
      <p class="chart-note">${monthLabel(latest.key)} so far: ${money(latest.income)} in, ${money(latest.spending)} out.</p>
    </div>`,
  );
};

const categoriesSection = () => {
  const breakdown = categoryBreakdown(derived.transactions, today(), PERIODS.find((period) => period.key === view.period).days);
  if (!breakdown.categories.length) return "";
  const slices = foldSlices(breakdown.categories.map((item) => ({ name: item.name, value: item.total, color: item.color, monthly: item.monthly })));
  view.slices = slices;
  const [first, second] = breakdown.categories;
  const groups = ["essentials", "lifestyle", "financial"].map((key) => ({
    key,
    label: GROUPS[key],
    value: breakdown.categories.filter((item) => item.group === key).reduce((sum, item) => sum + item.total, 0),
    color: { essentials: "#E95C03", lifestyle: "#BF5AF2", financial: "#FF453A" }[key],
  }));
  return section(
    "Where It Goes",
    `<div class="segmented segmented-3">${PERIODS.map(
      (period) => `<button type="button" class="${view.period === period.key ? "selected" : ""}" data-action="period" data-period="${period.key}">${period.label}</button>`,
    ).join("")}</div>
    <div class="glass glass-donut-card" style="--blob-a:${first.color};--blob-b:${second?.color ?? first.color}">
      <div class="donut-stage">
        ${glassDonut({ slices })}
        <div class="donut-center" id="donut-center" aria-live="polite">
          <span class="donut-center-value">${compactMoney(breakdown.monthly)}</span>
          <span class="donut-center-label">a month</span>
        </div>
      </div>
      <p class="glass-hint">Tap the ring or a category for more.</p>
      <div class="bar-list">${breakdown.categories
        .slice(0, 8)
        .map(
          (item) => `<button type="button" class="bar-row" data-action="category" data-name="${escapeHtml(item.name)}">
            <span class="bar-row-label">${categoryDot(item.name)}${escapeHtml(item.name)}</span>
            <span class="bar-row-value">${wholeMoney(item.monthly)}<small>/mo</small><span class="row-chevron">${ICONS.chevron}</span></span>
            <span class="bar-track"><span style="width:${(item.total / breakdown.categories[0].total) * 100}%;background:linear-gradient(90deg, ${item.color}99, ${item.color})"></span></span>
          </button>`,
        )
        .join("")}</div>
    </div>
    <div class="card chart-card">
      ${stackedBar(groups)}
      <div class="group-legend">${groups
        .map((group) => `<span><i style="background:${group.color}"></i>${group.label} <b>${percent(group.value / (breakdown.total || 1))}</b></span>`)
        .join("")}</div>
    </div>`,
    { footer: "Transfers, card payments, and savings are left out so nothing is counted twice." },
  );
};

const selectSlice = (index) => {
  const slice = view.slices?.[index];
  const center = $("#donut-center");
  if (!slice || !center) return;
  const same = view.selectedSlice === index;
  view.selectedSlice = same ? null : index;
  for (const element of $$(".glass-donut .slice, .glass-donut .slice-glow")) {
    element.classList.toggle("dim", !same && Number(element.dataset.index ?? [...element.parentNode.children].indexOf(element)) !== index);
  }
  const total = view.slices.reduce((sum, item) => sum + item.value, 0) || 1;
  center.innerHTML = same
    ? `<span class="donut-center-value">${compactMoney(total * (30.4 / PERIODS.find((period) => period.key === view.period).days))}</span><span class="donut-center-label">a month</span>`
    : `<span class="donut-center-name" style="color:${slice.color}">${escapeHtml(slice.name)}</span>
       <span class="donut-center-value">${percent(slice.value / total)}</span>
       <span class="donut-center-label">${compactMoney(slice.monthly ?? 0)} a month</span>`;
  center.classList.remove("pop");
  void center.offsetWidth;
  center.classList.add("pop");
  tap();
};

const dailySection = () => {
  const stats = dailyStats(derived.transactions, today());
  return `<div class="stat-grid">
    ${stat("Average day", wholeMoney(stats.averageDay), "last 90 days")}
    ${stat("No spend days", `${stats.noSpendDays}<small> of ${stats.daysThisMonth}</small>`, "this month", stats.noSpendDays ? "tone-in" : "")}
    ${stats.biggestDay ? stat("Biggest day", wholeMoney(stats.biggestDay.amount), shortDate(stats.biggestDay.date)) : ""}
    ${stat("Purchases", stats.perMonth.toLocaleString("en-US"), "per month")}
  </div>`;
};

const paceSection = (insights) => {
  const pace = spendingPace(derived.transactions, insights, today());
  if (!pace.typical.length || pace.day < 2) return "";
  const labels = pace.typical.map((_, index) => ([0, 9, 19].includes(index) || index === pace.typical.length - 1 ? String(index + 1) : ""));
  const ahead = pace.ahead > 0;
  return section(
    "Spending Pace",
    `<div class="card chart-card">
      <p class="chart-headline">${Math.abs(pace.ahead) < 2500 ? "Right on your usual pace this month." : `<strong class="${ahead ? "text-danger" : "amount-in"}">${wholeMoney(pace.ahead)} ${ahead ? "ahead of" : "behind"}</strong> your usual pace.`}</p>
      <div class="legend"><span><i style="background:var(--accent)"></i>This month</span><span><i style="background:var(--label-3)"></i>Typical month</span></div>
      ${lineChart({ series: [{ values: pace.typical, color: "var(--label-3)", dashed: true }, { values: pace.thisMonth, color: "#E95C03", fill: true, dot: true }], labels })}
    </div>`,
    { footer: "Cumulative spending by day of the month against the average of your last three months." },
  );
};

const changesSection = (insights) => {
  const changes = categoryChanges(insights, today());
  if (!changes.length) return "";
  return section(
    "What Changed",
    list(
      changes.map((entry) => {
        const up = entry.projected > entry.average;
        return row({
          leading: categoryDot(entry.name),
          title: escapeHtml(entry.name),
          subtitle: `On pace for ${wholeMoney(entry.projected)} vs usual ${wholeMoney(entry.average)}`,
          trailing: `<span class="change ${up ? "change-up" : "change-down"}">${up ? ICONS.arrowUp : ICONS.arrowDown}${percent(Math.abs(entry.change))}</span>`,
          action: "category",
          data: `data-name="${escapeHtml(entry.name)}"`,
        });
      }),
    ),
    { footer: "This month's pace against your three month average." },
  );
};

const keepTrendSection = (insights) => {
  const trend = keepRateTrend(insights);
  if (trend.length < 2) return "";
  const latest = trend.at(-1);
  return section(
    "Keep Rate Trend",
    `<div class="card chart-card">
      <p class="chart-headline">You kept <strong>${percent(Math.max(latest.rate, 0))}</strong> of income in ${monthLabel(latest.key)}.</p>
      ${lineChart({ series: [{ values: trend.map((item) => Math.round(item.rate * 100)), color: "#30D158", fill: true, dot: true }], labels: trend.map((item) => monthLabel(item.key)), format: (value) => `${Math.round(value)}%`, height: 130 })}
    </div>`,
    { footer: "Share of each month's income that was not spent. Flight Mode starts at 10%." },
  );
};

const outlookSection = (insights) => {
  const ahead = outlook(insights, today());
  if (!ahead.events.length) return "";
  return section(
    "Next 30 Days",
    `<div class="stat-grid">
      ${stat("Expected in", wholeMoney(ahead.income), plural(ahead.events.filter((event) => event.kind === "income").length, "paycheck"), "tone-in")}
      ${stat("Bills scheduled", wholeMoney(ahead.bills), plural(ahead.events.filter((event) => event.kind === "bill").length, "bill"))}
      ${stat("Usual flexible", wholeMoney(ahead.flexible), "at your daily pace")}
      ${stat(ahead.net >= 0 ? "Left over" : "Shortfall", wholeMoney(ahead.net), "if the month goes as usual", ahead.net >= 0 ? "tone-in" : "tone-out")}
    </div>
    ${list(
      ahead.events.slice(0, 8).map((event) =>
        row({
          leading: categoryDot(event.category),
          title: escapeHtml(event.name),
          subtitle: relativeDay(event.date, today(), daysBetween(today(), event.date)),
          trailing: `<span class="${event.amount > 0 ? "amount-in" : "amount-out"}">${signedMoney(event.amount)}</span>`,
        }),
      ),
    )}`,
    { footer: `Built from the paychecks and bills Cockpit has seen repeat${ahead.saving ? `, after ${wholeMoney(ahead.saving)} of planned saving` : ""}. Plan before payday.` },
  );
};

const openCategory = (name) => {
  const detail = categoryDetail(derived.transactions, name, today());
  const thisMonth = detail.months.at(-1).total;
  openSheet(`${sheetHeader(escapeHtml(name))}
    <div class="glass category-hero" style="--blob-a:${detail.color};--blob-b:${detail.color}">
      ${categoryDot(name)}
      <span class="txn-amount">${wholeMoney(detail.average)}</span>
      <span class="muted-line">average month · ${wholeMoney(thisMonth)} so far this month</span>
    </div>
    ${section("Last 6 Months", `<div class="card chart-card">${columnBars({ items: detail.months.map((month) => ({ label: monthLabel(month.key), value: month.total })), highlight: detail.months.length - 1, height: 130 })}</div>`)}
    ${detail.merchants.length ? section("Where", list(detail.merchants.map((merchant) => row({ title: escapeHtml(merchant.name), subtitle: plural(merchant.count, "visit"), trailing: money(merchant.total) }))), { footer: "Last 90 days." }) : ""}
    ${section("Recent", list(detail.recent.map((item) => row({ title: escapeHtml(displayMerchant(item.description)), subtitle: shortDate(item.date), trailing: money(item.amount), action: "transaction", data: `data-id="${item.id}"` }))))}`);
};

const cyclesSection = (insights) => {
  if (insights.cycles.length < 2) return "";
  const ahead = insights.cycles.filter((cycle) => cycle.net >= 0).length;
  const averageFront = insights.cycles.reduce((sum, cycle) => sum + cycle.frontLoad, 0) / insights.cycles.length;
  return section(
    "Pay Cycles",
    `<div class="card chart-card">
      <p class="chart-headline"><strong>${ahead} of ${insights.cycles.length}</strong> recent pay cycles ended ahead.</p>
      ${divergingBars({ items: insights.cycles.map((cycle) => ({ label: shortDate(cycle.start).replace(" ", " "), value: cycle.net })) })}
      <p class="chart-note">On average ${percent(averageFront)} of a cycle's spending happens in the first three days after payday.</p>
    </div>`,
    { footer: `Paycheck from ${escapeHtml(insights.paycheck.name)}, ${insights.paycheck.cadence.label.toLowerCase()}, about ${money(insights.paycheck.typicalAmount)}.` },
  );
};

const weekdaySection = (insights) => {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const values = insights.weekdays;
  if (!values.some(Boolean)) return "";
  const peak = values.indexOf(Math.max(...values));
  const names = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  return section(
    "Spending Rhythm",
    `<div class="card chart-card">
      <p class="chart-headline">You spend the most on <strong>${names[peak]}</strong>.</p>
      ${columnBars({ items: labels.map((label, index) => ({ label, value: values[index] })), highlight: peak })}
    </div>`,
    { footer: "Last 90 days of flexible and fixed spending by day of the week." },
  );
};

const merchantsSection = (insights) =>
  insights.merchants.length
    ? section(
        "Top Merchants",
        list(
          insights.merchants.map((merchant) =>
            row({ leading: categoryDot(merchant.category), title: escapeHtml(merchant.name), subtitle: `${plural(merchant.count, "visit")} · ${escapeHtml(merchant.category)}`, trailing: money(merchant.total) }),
          ),
        ),
        { footer: "Last 90 days." },
      )
    : "";

const recurringSection = (insights) => {
  if (!insights.recurring.length) return "";
  const monthly = insights.recurring.reduce((sum, item) => sum + (item.typicalAmount * 30.4) / item.cadence.days, 0);
  const subscriptionsYear = insights.subscriptions.reduce((sum, item) => sum + item.annualCost, 0);
  return section(
    "Bills and Subscriptions",
    list(
      insights.recurring.map((item) =>
        row({
          leading: categoryDot(item.category),
          title: escapeHtml(item.name),
          subtitle: `${item.cadence.label} · next ${shortDate(item.nextDate)}`,
          trailing: `${money(item.typicalAmount)}${item.isSubscription ? `<small>${wholeMoney(item.annualCost)}/yr</small>` : ""}`,
        }),
      ),
    ),
    {
      footer: `About ${wholeMoney(monthly)} a month is already spoken for. Subscriptions add up to ${wholeMoney(subscriptionsYear)} a year.`,
      action: insights.subscriptions.length ? `<button type="button" class="link-button" data-action="audit">Audit</button>` : "",
    },
  );
};

const incomeSection = (insights) =>
  insights.incomeStreams.length
    ? section(
        "Income Streams",
        list(
          insights.incomeStreams.map((stream) =>
            row({
              leading: categoryDot("Paycheck"),
              title: escapeHtml(stream.name),
              subtitle: `${stream.cadence.label} · next ${shortDate(stream.nextDate)}`,
              trailing: `<span class="amount-in">${money(stream.typicalAmount)}</span>`,
            }),
          ),
        ),
      )
    : "";

const renderInsights = () => {
  const { insights } = derived;
  $("#insights-body").innerHTML = insights
    ? [
        stageCard(insights),
        numbersGrid(insights),
        categoriesSection(),
        changesSection(insights),
        paceSection(insights),
        outlookSection(insights),
        cashFlowChart(insights),
        keepTrendSection(insights),
        cyclesSection(insights),
        recurringSection(insights),
        incomeSection(insights),
        weekdaySection(insights),
        merchantsSection(insights),
        `<p class="fine-print">${escapeHtml(EDUCATION_NOTE)}</p>`,
      ].join("")
    : emptyScreen("Insights appear after your first import.", "The more history you bring, the sharper your trends, pay cycles, and bill forecasts become.");
};

const emptyScreen = (title, copy) => `<div class="empty">
  <span class="empty-icon">${ICONS.insights}</span>
  <h2>${title}</h2><p>${copy}</p>
  <button type="button" class="button button-primary" data-action="import">${ICONS.upload}<span>Import Bank CSV</span></button>
  <button type="button" class="button button-plain" data-action="sample">Explore With Sample Data</button>
</div>`;

// ---------- Activity ----------

const filterTransactions = () => {
  const query = view.query.trim().toLowerCase();
  return derived.transactions
    .filter((transaction) => {
      if (view.filter === "in" && transaction.amount <= 0) return false;
      if (view.filter === "out" && transaction.amount >= 0) return false;
      if (view.filter === "bills" && !derived.insights?.recurring.some((item) => item.key === merchantKey(transaction.description))) return false;
      if (!query) return true;
      return transaction.description.toLowerCase().includes(query) || transaction.category.toLowerCase().includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.amount - b.amount);
};

const dayLabel = (date) => {
  const ago = daysBetween(date, today());
  if (ago === 0) return "Today";
  if (ago === 1) return "Yesterday";
  return `${shortDate(date)}, ${date.slice(0, 4)}`;
};

const activityList = () => {
  const items = filterTransactions();
  if (!items.length) return `<p class="empty-inline">No transactions match.</p>`;
  const shown = items.slice(0, view.limit);
  const days = new Map();
  for (const item of shown) {
    if (!days.has(item.date)) days.set(item.date, []);
    days.get(item.date).push(item);
  }
  const accounts = new Map(state.accounts.map((account) => [account.id, account.name]));
  const groups = [...days.entries()].map(([date, entries]) => {
    const net = entries.filter((entry) => isSpending(entry)).reduce((sum, entry) => sum + entry.amount, 0);
    return `<div class="day-group">
      <div class="day-header"><span>${dayLabel(date)}</span>${net ? `<span>${money(net)} spent</span>` : ""}</div>
      ${list(
        entries.map((entry) =>
          row({
            leading: categoryDot(entry.category),
            title: escapeHtml(displayMerchant(entry.description) || entry.description),
            subtitle: `${escapeHtml(entry.category)}${state.accounts.length > 1 ? ` · ${escapeHtml(accounts.get(entry.accountId) ?? "")}` : ""}`,
            trailing: `<span class="${amountClass(entry.amount)}">${signedMoney(entry.amount)}</span>`,
            action: "transaction",
            data: `data-id="${entry.id}"`,
          }),
        ),
      )}
    </div>`;
  });
  const more = items.length > shown.length ? `<button type="button" class="button button-secondary" data-action="more">Show ${Math.min(120, items.length - shown.length)} more</button>` : "";
  return `<p class="result-count">${plural(items.length, "transaction")}</p>${groups.join("")}${more}`;
};

const renderActivity = () => {
  if (!derived.transactions.length) {
    $("#activity-body").innerHTML = emptyScreen("No activity yet.", "Import a CSV and every transaction appears here, sorted and categorized.");
    return;
  }
  const filters = [
    ["all", "All"],
    ["out", "Money Out"],
    ["in", "Money In"],
    ["bills", "Bills"],
  ];
  $("#activity-body").innerHTML = `
    <label class="search">${ICONS.search}<input type="search" id="activity-search" placeholder="Search merchants or categories" value="${escapeHtml(view.query)}" autocomplete="off" /></label>
    <div class="segmented" role="tablist">${filters
      .map(([key, label]) => `<button type="button" role="tab" aria-selected="${view.filter === key}" class="${view.filter === key ? "selected" : ""}" data-action="filter" data-filter="${key}">${label}</button>`)
      .join("")}</div>
    <div id="activity-list">${activityList()}</div>`;
};

// ---------- Medals ----------

const renderMedals = () => {
  const medals = derived.medals;
  const earned = medalCount(medals);
  $("#medals-body").innerHTML = `
    <div class="card medal-summary">
      <div><span class="medal-count">${earned}</span><span class="medal-of">of ${medals.length} earned</span></div>
      <p>Medals are earned from your own history and habits. Bronze, silver, and gold mark each level.</p>
    </div>
    <div class="medal-grid">${medals
      .map(
        (medal) => `<button type="button" class="medal${medal.tier ? " earned" : ""}" data-action="medal" data-id="${medal.id}">
          <span class="medal-3d">${medalBadge(medal)}</span>
          <span class="medal-name">${escapeHtml(medal.name)}</span>
          <span class="medal-tier">${medal.tier ? medal.tier.charAt(0).toUpperCase() + medal.tier.slice(1) : `Next: ${escapeHtml(medal.nextGoal)}`}</span>
        </button>`,
      )
      .join("")}</div>
    ${state.sample ? `<p class="fine-print">Medals shown here reflect the sample data. Import your own CSV to start earning yours.</p>` : ""}`;
};

// ---------- Settings ----------

const renderSettings = () => {
  const { settings } = state;
  const accounts = state.accounts.map((account) =>
    row({
      leading: `<span class="row-icon">${ICONS.bank}</span>`,
      title: escapeHtml(account.name),
      subtitle: `${escapeHtml(account.formatName)} · ${plural(account.count, "transaction")} · imported ${shortDate(account.importedAt)}`,
      trailing: `<button type="button" class="icon-button danger" data-action="remove-account" data-id="${account.id}" aria-label="Remove ${escapeHtml(account.name)}">${ICONS.trash}</button>`,
    }),
  );
  const rules = Object.entries(state.overrides).map(([key, category]) =>
    row({
      leading: categoryDot(category),
      title: escapeHtml(displayMerchant(key)),
      subtitle: `Always ${escapeHtml(category)}`,
      trailing: `<button type="button" class="icon-button" data-action="remove-rule" data-key="${escapeHtml(key)}" aria-label="Remove rule">${ICONS.close}</button>`,
    }),
  );

  const theme = settings.theme ?? "auto";
  $("#settings-body").innerHTML = `
    ${section(
      "Appearance",
      `<div class="segmented segmented-3 appearance">${THEMES.map(
        ([key, label]) => `<button type="button" class="${theme === key ? "selected" : ""}" data-action="theme" data-theme-choice="${key}">${label}</button>`,
      ).join("")}</div>`,
      { footer: "Automatic follows your iPhone's Light and Dark setting." },
    )}
    ${section("Accounts", list(accounts.length ? [...accounts, row({ leading: `<span class="row-icon accent">${ICONS.plus}</span>`, title: "Import another CSV", action: "import" })] : [row({ leading: `<span class="row-icon accent">${ICONS.plus}</span>`, title: "Import your first CSV", action: "import" })]), {
      footer: "Importing the same statement twice is safe. Cockpit skips transactions it already has.",
    })}
    ${section(
      "Payday Plan",
      list([
        row({ title: "Current balance", trailing: settings.balance ? money(settings.balance.amount) : "Not set", action: "balance", chevron: true }),
        row({ title: "Cushion to protect", trailing: settings.cushion ? money(settings.cushion) : "None", action: "balance", chevron: true }),
      ]),
      { footer: "Safe to Spend is your balance minus bills due before payday minus your cushion." },
    )}
    ${rules.length ? section("Category Rules", list(rules), { footer: "Rules you taught Cockpit. They apply to past and future imports." }) : ""}
    ${section(
      "Help",
      list([
        row({ leading: `<span class="row-icon">${ICONS.download}</span>`, title: "Get a CSV from your bank", action: "bank-guide", chevron: true }),
        row({ leading: `<span class="row-icon">${ICONS.share}</span>`, title: "Add Cockpit to your Home Screen", action: "install-help", chevron: true }),
        row({ leading: `<span class="row-icon">${ICONS.file}</span>`, title: "Download a test CSV", subtitle: "A fictional Chase checking export to try the import", action: "test-csv", chevron: true }),
        row({ leading: `<span class="row-icon">${ICONS.spark}</span>`, title: "Explore with sample data", action: "sample", chevron: true }),
      ]),
    )}
    ${flightModeList()}
    ${section(
      "Your Data",
      list([
        row({ leading: `<span class="row-icon">${ICONS.lock}</span>`, title: "Stored only on this device", subtitle: "Cockpit never sends your transactions to Financial Flight Mode or anyone else. Clearing Safari website data erases it, so keep a backup." }),
        row({ title: "Export backup", action: "export", chevron: true }),
        row({ title: "Restore from backup", action: "restore", chevron: true }),
        row({ title: '<span class="text-danger">Erase all Cockpit data</span>', action: "erase" }),
      ]),
    )}
    <p class="fine-print">${escapeHtml(EDUCATION_NOTE)}</p>
    <p class="fine-print"><a href="/">Financial Flight Mode</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></p>`;
};

// ---------- Rendering and navigation ----------

const render = () => {
  renderToday();
  renderInsights();
  renderActivity();
  renderMedals();
  renderSettings();
};

const TITLES = { today: "Today", insights: "Insights", activity: "Activity", medals: "Medals", settings: "Settings" };

const showTab = (tab, { focus = false } = {}) => {
  if (!TITLES[tab]) tab = "today";
  view.tab = tab;
  for (const screen of $$(".screen")) screen.hidden = screen.dataset.screen !== tab;
  for (const button of $$(".tab")) {
    const active = button.dataset.tab === tab;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  $("#nav-title").textContent = TITLES[tab];
  window.scrollTo({ top: 0 });
  observeTitle();
  if (focus) $("#screens").focus({ preventScroll: true });
  if (location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
};

let titleObserver = null;
const observeTitle = () => {
  titleObserver?.disconnect();
  const title = $(`.screen[data-screen="${view.tab}"] .large-title`);
  if (!title || !("IntersectionObserver" in window)) return;
  titleObserver = new IntersectionObserver(([entry]) => $("#nav-bar").classList.toggle("scrolled", !entry.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
  titleObserver.observe(title);
};

const animateCounts = (root) => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  for (const element of $$("[data-count]", root)) {
    const target = Number(element.dataset.count);
    const start = performance.now();
    const duration = 700;
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = money(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
};

// ---------- Sheets ----------

let lastFocus = null;
const openSheet = (html, { onOpen } = {}) => {
  lastFocus = document.activeElement;
  $("#sheet-content").innerHTML = html;
  $("#sheet-content").scrollTop = 0;
  const layer = $("#sheet-layer");
  layer.hidden = false;
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => layer.classList.add("open"));
  onOpen?.();
  setTimeout(() => ($("[autofocus]", layer) ?? $(".sheet-close", layer) ?? $("#sheet"))?.focus?.({ preventScroll: true }), 60);
};

const closeSheet = () => {
  const layer = $("#sheet-layer");
  if (layer.hidden) return;
  layer.classList.remove("open");
  document.body.classList.remove("sheet-open");
  $("#sheet").style.transform = "";
  setTimeout(() => {
    layer.hidden = true;
    $("#sheet-content").innerHTML = "";
  }, 320);
  lastFocus?.focus?.({ preventScroll: true });
};

const sheetHeader = (title, { done = "Done", doneAction = "close-sheet" } = {}) => `
  <div class="sheet-header">
    <span></span>
    <h2 id="sheet-title">${title}</h2>
    <button type="button" class="link-button sheet-close" data-action="${doneAction}">${done}</button>
  </div>`;

let toastTimer = null;
const showToast = (message) => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 300);
  }, 3200);
};

// ---------- Import flow ----------

const startImport = () => {
  tap();
  closeSheet();
  $("#csv-input").value = "";
  $("#csv-input").click();
};

const handleFile = async (file) => {
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) {
    openSheet(`${sheetHeader("File Too Large")}<p class="sheet-copy">That file is over 15 MB. Export a shorter date range and try again.</p>`);
    return;
  }
  const text = await file.text();
  const result = readStatement(text);
  if (!result.ok) {
    openSheet(`${sheetHeader("Could Not Read This File")}
      <p class="sheet-copy">${escapeHtml(result.error)} Make sure you exported a CSV file of transactions, not a PDF statement.</p>
      <div class="button-stack"><button type="button" class="button button-secondary" data-action="bank-guide">How to export a CSV</button></div>`);
    return;
  }
  const existing = state.sample ? null : state.accounts.find((account) => account.formatId === result.format.id);
  pendingImport = {
    fileName: file.name,
    result,
    flipped: false,
    accountName: existing?.name ?? (result.format.id === "generic" ? "My Account" : result.format.name),
  };
  openSheet(reviewSheet(), { onOpen: bindReviewSheet });
};

const pendingTransactions = () =>
  pendingImport.flipped ? pendingImport.result.transactions.map((transaction) => ({ ...transaction, amount: -transaction.amount })) : pendingImport.result.transactions;

const reviewSheet = () => {
  const { result, fileName, accountName } = pendingImport;
  const transactions = pendingTransactions();
  const dates = transactions.map((transaction) => transaction.date).sort();
  const moneyIn = transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const moneyOut = transactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const preview = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const accountChips = state.sample
    ? ""
    : state.accounts
        .map((account) => `<button type="button" class="chip${account.name === accountName ? " selected" : ""}" data-action="pick-account" data-name="${escapeHtml(account.name)}">${escapeHtml(account.name)}</button>`)
        .join("");
  return `${sheetHeader("Review Import", { done: "Cancel" })}
    <div class="import-hero">
      <span class="row-icon accent">${ICONS.bank}</span>
      <div><strong>${escapeHtml(result.format.name)}</strong><span>${escapeHtml(fileName)}</span></div>
    </div>
    <div class="stat-grid compact">
      ${stat("Transactions", transactions.length.toLocaleString("en-US"))}
      ${stat("Dates", `${shortDate(dates[0])} to ${shortDate(dates.at(-1))}`)}
      ${stat("Money in", wholeMoney(moneyIn), "", "tone-in")}
      ${stat("Money out", wholeMoney(moneyOut), "", "tone-out")}
    </div>
    <label class="field"><span>Account name</span><input type="text" id="account-name" value="${escapeHtml(accountName)}" maxlength="40" autocomplete="off" /></label>
    ${accountChips ? `<div class="chips">${accountChips}</div>` : ""}
    ${section(
      "Preview",
      list(preview.map((transaction) => row({ title: escapeHtml(transaction.description), subtitle: shortDate(transaction.date), trailing: `<span class="${amountClass(transaction.amount)}">${signedMoney(transaction.amount)}</span>` }))),
      { footer: "Purchases should show without a plus sign. Paychecks and refunds should show with one." },
    )}
    <label class="toggle-row"><span><strong>Purchases look like money in?</strong><small>Flip every amount in this file.</small></span>
      <input type="checkbox" class="switch" id="flip-signs" ${pendingImport.flipped ? "checked" : ""} /></label>
    ${result.skipped ? `<p class="sheet-copy muted">${plural(result.skipped, "row")} without a date or amount will be skipped.</p>` : ""}
    <div class="button-stack"><button type="button" class="button button-primary" data-action="confirm-import">Import ${plural(transactions.length, "Transaction")}</button></div>
    <p class="fine-print">${ICONS.lock} Read on this device. Nothing is uploaded.</p>`;
};

const bindReviewSheet = () => {
  $("#flip-signs")?.addEventListener("change", (event) => {
    pendingImport.flipped = event.target.checked;
    pendingImport.accountName = $("#account-name").value;
    $("#sheet-content").innerHTML = reviewSheet();
    bindReviewSheet();
  });
};

const confirmImport = () => {
  if (!pendingImport) return;
  const accountName = ($("#account-name")?.value || pendingImport.accountName).trim() || "My Account";
  const base = state.sample ? emptyState() : state;
  const { state: next, added, duplicates } = mergeImport(base, {
    accountName,
    format: pendingImport.result.format,
    transactions: pendingTransactions(),
    importedAt: today(),
  });
  if (state.sample) next.settings = { ...next.settings, installHintDismissed: state.settings.installHintDismissed, theme: state.settings.theme };
  state = next;
  pendingImport = null;
  navigator.storage?.persist?.().catch(() => {});
  closeSheet();
  commit();
  showTab("today");
  showToast(duplicates ? `Added ${plural(added, "transaction")}. Skipped ${plural(duplicates, "duplicate")}.` : `Added ${plural(added, "transaction")}.`);
};

const loadSample = () => {
  if (state.transactions.length && !state.sample) {
    openSheet(`${sheetHeader("Sample Data")}
      <p class="sheet-copy">Sample data is only available before you import your own statements, so your real history is never mixed with a fictional one.</p>`);
    return;
  }
  const fresh = emptyState();
  const { state: next } = mergeImport(fresh, {
    accountName: "Sample Checking",
    format: { id: "sample", name: "Sample pilot", kind: "checking" },
    transactions: buildSampleStatement(today()),
    importedAt: today(),
  });
  state = { ...next, sample: true, settings: { ...next.settings, installHintDismissed: state.settings.installHintDismissed, theme: state.settings.theme } };
  closeSheet();
  commit({ celebrate: false });
  showTab("today");
  showToast("Sample data loaded. Nothing here is real.");
};

// ---------- Other sheets ----------

const openBankGuide = () =>
  openSheet(`${sheetHeader("Get a CSV From Your Bank")}
    <ol class="steps">${EXPORT_STEPS.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    ${section("Recognized Automatically", `<div class="chips static">${SUPPORTED_BANKS.map((bank) => `<span class="chip">${escapeHtml(bank)}</span>`).join("")}</div>`, {
      footer: "Other banks and credit unions usually work too. Cockpit finds the date, description, and amount columns on its own.",
    })}
    ${section("Good to Know", list(Object.entries(BANK_HINTS).map(([bank, hint]) => row({ title: escapeHtml(bank), subtitle: escapeHtml(hint) }))))}
    <div class="button-stack">
      <button type="button" class="button button-primary" data-action="import">${ICONS.upload}<span>Import Bank CSV</span></button>
      <button type="button" class="button button-secondary" data-action="test-csv">${ICONS.file}<span>Download a test CSV first</span></button>
    </div>`);

const openInstallHelp = () =>
  openSheet(`${sheetHeader("Add to Home Screen")}
    <ol class="steps">
      <li>Open this page in Safari on your iPhone.</li>
      <li>Tap the Share button at the bottom of the screen.</li>
      <li>Scroll and tap Add to Home Screen, then Add.</li>
      <li>Open Cockpit from your Home Screen. It runs full screen and works offline.</li>
    </ol>
    <p class="sheet-copy muted">Your data stays in Cockpit on this device. A Home Screen install keeps it from being cleared when Safari tidies up website data.</p>`);

const parseMoneyInput = (value) => {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? Math.round(number * 100) : NaN;
};

const openBalanceSheet = () => {
  const statement = derived.insights?.statementBalance;
  openSheet(`${sheetHeader("Payday Plan", { done: "Save", doneAction: "save-balance" })}
    <label class="field"><span>Current checking balance</span><input type="text" inputmode="decimal" id="balance-input" placeholder="$0.00" value="${state.settings.balance ? (state.settings.balance.amount / 100).toFixed(2) : ""}" autofocus /></label>
    <p class="sheet-copy muted">${statement ? `Your latest statement shows ${money(statement.amount)} on ${shortDate(statement.date)}. Enter today's balance if it has changed.` : "Check your banking app and enter what is in checking right now."}</p>
    <label class="field"><span>Cushion to protect</span><input type="text" inputmode="decimal" id="cushion-input" placeholder="$0.00" value="${state.settings.cushion ? (state.settings.cushion / 100).toFixed(2) : ""}" /></label>
    <p class="sheet-copy muted">Money you never want Safe to Spend to touch, like a small buffer against surprises.</p>
    ${state.settings.balance ? `<div class="button-stack"><button type="button" class="button button-plain" data-action="clear-balance">Use statement balance instead</button></div>` : ""}`);
};

const saveBalance = () => {
  const balance = parseMoneyInput($("#balance-input")?.value);
  const cushion = parseMoneyInput($("#cushion-input")?.value);
  if (Number.isNaN(balance) || Number.isNaN(cushion)) {
    showToast("Enter amounts as numbers, like 1250.00");
    return;
  }
  state.settings = { ...state.settings, balance: balance === null ? state.settings.balance : { amount: balance, date: today(), source: "manual" }, cushion: Math.max(0, cushion ?? 0) };
  closeSheet();
  commit();
};

const openTransaction = (id) => {
  const transaction = derived.transactions.find((item) => item.id === id);
  if (!transaction) return;
  const account = state.accounts.find((item) => item.id === transaction.accountId);
  const merchant = displayMerchant(transaction.description);
  const choices = CATEGORY_NAMES.filter((name) => (transaction.amount > 0 ? ["income", "movement", "future"].includes(groupOf(name)) || name === "Refund" : groupOf(name) !== "income"));
  openSheet(`${sheetHeader("Transaction")}
    <div class="txn-hero">
      ${categoryDot(transaction.category)}
      <span class="txn-amount ${amountClass(transaction.amount)}">${signedMoney(transaction.amount)}</span>
      <strong>${escapeHtml(merchant)}</strong>
      <span>${longDate(transaction.date)}</span>
    </div>
    ${list([row({ title: "Bank description", subtitle: escapeHtml(transaction.description) }), row({ title: "Account", trailing: escapeHtml(account?.name ?? "") })])}
    ${section("Category", `<div class="chips">${choices.map((name) => `<button type="button" class="chip${name === transaction.category ? " selected" : ""}" data-action="set-category" data-id="${id}" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}</div>`)}
    <label class="toggle-row"><span><strong>Apply to every ${escapeHtml(merchant)}</strong><small>Past and future transactions from this merchant.</small></span>
      <input type="checkbox" class="switch" id="apply-all" checked /></label>`);
};

const setCategory = (id, category) => {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;
  const applyAll = $("#apply-all")?.checked ?? true;
  if (applyAll) {
    state.overrides = { ...state.overrides, [merchantKey(transaction.description)]: category };
    state.transactions = state.transactions.map((item) => (merchantKey(item.description) === merchantKey(transaction.description) ? { ...item, categoryOverride: undefined } : item));
  } else {
    state.transactions = state.transactions.map((item) => (item.id === id ? { ...item, categoryOverride: category } : item));
  }
  tap();
  closeSheet();
  commit();
  showToast(applyAll ? `${displayMerchant(transaction.description)} is now ${category}.` : `Category updated.`);
};

const openWeeklyReview = () => {
  const insights = derived.insights;
  if (!insights) return startImport();
  const start = addDays(insights.today, -6);
  const week = derived.transactions.filter((transaction) => transaction.date >= start && transaction.date <= insights.today);
  const spent = -week.filter(isSpending).reduce((sum, transaction) => sum + transaction.amount, 0);
  const came = week.filter((transaction) => transaction.amount > 0 && groupOf(transaction.category) === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const typicalWeek = Math.round((insights.averages.spending * 12) / 52);
  const byCategory = {};
  for (const transaction of week.filter(isSpending)) byCategory[transaction.category] = (byCategory[transaction.category] ?? 0) - transaction.amount;
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const upcoming = insights.recurring.filter((bill) => bill.nextDate >= insights.today && bill.nextDate <= addDays(insights.today, 7));
  const stale = insights.staleDays > 3;
  openSheet(`${sheetHeader("Weekly Review")}
    <p class="sheet-copy">${shortDate(start)} to ${shortDate(insights.today)}. Know your numbers, then correct one thing.</p>
    ${stale ? `<div class="card card-notice"><span class="row-icon">${ICONS.calendar}</span><div><strong>Import this week's transactions first.</strong><p>Your latest data is from ${shortDate(insights.range.last)}.</p></div></div>` : ""}
    <div class="stat-grid compact">
      ${stat("Came in", wholeMoney(came), "", "tone-in")}
      ${stat("Went out", wholeMoney(spent), typicalWeek ? `${spent <= typicalWeek ? "Under" : "Over"} your usual ${wholeMoney(typicalWeek)}` : "", spent <= typicalWeek ? "" : "tone-out")}
    </div>
    ${top.length ? section("Biggest Categories", list(top.map(([category, total]) => row({ leading: categoryDot(category), title: escapeHtml(category), trailing: money(total) })))) : ""}
    ${section("Coming Up in 7 Days", list(upcoming.length ? upcoming.map((bill) => row({ leading: categoryDot(bill.category), title: escapeHtml(bill.name), subtitle: shortDate(bill.nextDate), trailing: money(bill.typicalAmount) })) : [row({ title: "No known bills this week" })]))}
    <div class="card next-move"><span class="signal-kicker">Correct One Thing</span><p>${escapeHtml(insights.nextMove)}</p></div>
    <div class="button-stack"><button type="button" class="button button-primary" data-action="complete-review">${ICONS.check}<span>Complete Review</span></button></div>`);
};

const completeReview = () => {
  const day = today();
  if (!state.activity.reviews.includes(day)) state.activity = { ...state.activity, reviews: [...state.activity.reviews, day].slice(-120) };
  closeSheet();
  commit();
  showToast(`Review logged. Streak: ${plural(reviewStreak(state.activity.reviews, day), "week")}.`);
};

const openAudit = () => {
  const subscriptions = derived.insights?.subscriptions ?? [];
  const total = subscriptions.reduce((sum, item) => sum + item.annualCost, 0);
  openSheet(`${sheetHeader("Subscription Audit")}
    <p class="sheet-copy">${plural(subscriptions.length, "subscription")} costing about <strong>${wholeMoney(total)} a year</strong>. For each one, ask: would I sign up again today?</p>
    ${list(subscriptions.map((item) => row({ leading: categoryDot(item.category), title: escapeHtml(item.name), subtitle: `${money(item.typicalAmount)} ${item.cadence.label.toLowerCase()}`, trailing: `${wholeMoney(item.annualCost)}<small>/yr</small>` })))}
    <p class="sheet-copy muted">Cancel inside each service or with Apple subscriptions in Settings. Cockpit cannot cancel anything for you.</p>
    <div class="button-stack"><button type="button" class="button button-primary" data-action="complete-audit">${ICONS.check}<span>I Reviewed Every One</span></button></div>`);
};

const completeAudit = () => {
  const day = today();
  if (!state.activity.auditDates.includes(day)) {
    state.activity = { ...state.activity, audits: state.activity.audits + 1, auditDates: [...state.activity.auditDates, day].slice(-24) };
  }
  closeSheet();
  commit();
  showToast("Audit logged.");
};

const tierName = (tier) => tier.charAt(0).toUpperCase() + tier.slice(1);

const openMedal = (id) => {
  const medal = derived.medals.find((item) => item.id === id);
  if (!medal) return;
  const levels = ["bronze", "silver", "gold"];
  const reached = medal.tier ? levels.indexOf(medal.tier) : -1;
  openSheet(`${sheetHeader(escapeHtml(medal.name))}
    <button type="button" class="medal-hero ${medal.tier ? "earned" : ""}" data-action="spin-medal" aria-label="Spin medal">
      <span class="medal-glow"></span>
      <span class="medal-3d spin-in">${medalBadge(medal, 168)}</span>
    </button>
    ${medal.tier ? `<p class="tier-pill tier-pill-${medal.tier}">${tierName(medal.tier)}</p>` : ""}
    <p class="sheet-copy center">${escapeHtml(medal.description)}</p>
    ${list(levels.map((level, index) => row({ leading: `<span class="tier-dot tier-${level}${index <= reached ? " reached" : ""}"></span>`, title: tierName(level), trailing: index <= reached ? `<span class="amount-in">${ICONS.check}</span>` : escapeHtml(medal.tiers[index]) })))}
    ${medal.nextGoal ? `<div class="progress"><span style="width:${Math.round(medal.progress * 100)}%"></span></div><p class="sheet-copy muted center">Next level at ${escapeHtml(medal.nextGoal)}. You are ${percent(medal.progress)} of the way there.</p>` : `<p class="sheet-copy center">Top level reached.</p>`}`);
};

const spinElement = (element, className = "spin") => {
  if (!element) return;
  element.classList.remove("spin", "spin-in", "nudge");
  void element.offsetWidth;
  element.classList.add(className);
};

let stopConfetti = () => {};
const openMedalCelebration = (earned) => {
  if (!$("#sheet-layer").hidden || !$("#celebration").hidden) return;
  const [lead, ...others] = earned;
  haptic([12, 60, 18]);
  $("#celebration-content").innerHTML = `
    <div class="celebration-rays" aria-hidden="true"></div>
    <span class="signal-kicker">Medal Earned</span>
    <div class="medal-3d celebrate-spin">${medalBadge(lead, 196)}</div>
    <h2 id="celebration-title">${escapeHtml(lead.name)}</h2>
    <p class="tier-pill tier-pill-${lead.tier}">${tierName(lead.tier)}</p>
    <p class="celebration-copy">${escapeHtml(lead.description)}</p>
    ${others.length ? `<div class="celebration-more">${others.slice(0, 4).map((medal) => `<span>${medalBadge(medal, 52)}<small>${escapeHtml(medal.name)}</small></span>`).join("")}</div>` : ""}
    <div class="button-stack">
      <button type="button" class="button button-primary" data-action="go-medals">See All Medals</button>
      <button type="button" class="button button-plain" data-action="close-celebration">Continue</button>
    </div>`;
  const layer = $("#celebration");
  layer.hidden = false;
  requestAnimationFrame(() => layer.classList.add("open"));
  stopConfetti = confetti($("#confetti"));
  setTimeout(() => $("#celebration .button-primary")?.focus({ preventScroll: true }), 400);
};

const closeCelebration = () => {
  const layer = $("#celebration");
  if (layer.hidden) return;
  stopConfetti();
  layer.classList.remove("open");
  setTimeout(() => (layer.hidden = true), 300);
};

const confirmSheet = ({ title, copy, confirm, action, data = "" }) =>
  openSheet(`${sheetHeader(title, { done: "Cancel" })}
    <p class="sheet-copy">${copy}</p>
    <div class="button-stack"><button type="button" class="button button-danger" data-action="${action}" ${data}>${confirm}</button></div>`);

const downloadFile = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------- Events ----------

const ACTIONS = {
  import: startImport,
  sample: loadSample,
  "bank-guide": openBankGuide,
  "install-help": openInstallHelp,
  "close-sheet": closeSheet,
  "confirm-import": confirmImport,
  "pick-account": (button) => {
    pendingImport.accountName = button.dataset.name;
    $("#account-name").value = button.dataset.name;
    for (const chip of $$('[data-action="pick-account"]')) chip.classList.toggle("selected", chip === button);
  },
  balance: openBalanceSheet,
  "save-balance": saveBalance,
  "clear-balance": () => {
    state.settings = { ...state.settings, balance: null };
    closeSheet();
    commit();
  },
  "weekly-review": openWeeklyReview,
  "complete-review": completeReview,
  audit: openAudit,
  "complete-audit": completeAudit,
  medal: (button) => {
    const medal = derived.medals.find((item) => item.id === button.dataset.id);
    spinElement($(".medal-3d", button), medal?.tier ? "spin" : "nudge");
    haptic(medal?.tier ? 10 : [6, 30, 6]);
    setTimeout(() => openMedal(button.dataset.id), prefersReducedMotion() ? 0 : 520);
  },
  "spin-medal": (button) => {
    spinElement($(".medal-3d", button), button.classList.contains("earned") ? "spin" : "nudge");
    haptic(10);
  },
  "go-medals": () => {
    closeCelebration();
    closeSheet();
    showTab("medals");
  },
  "close-celebration": closeCelebration,
  theme: (button) => {
    state.settings = { ...state.settings, theme: button.dataset.themeChoice };
    applyTheme();
    persist();
    tap();
    renderSettings();
  },
  "test-csv": () => {
    downloadFile("cockpit-test-chase-checking.csv", buildTestCsv(today()), "text/csv");
    showToast("Test CSV saved to Downloads. Now tap Import and choose it.");
  },
  period: (button) => {
    view.period = button.dataset.period;
    view.selectedSlice = null;
    tap();
    renderInsights();
  },
  slice: (element) => selectSlice(Number(element.dataset.index)),
  category: (button) => openCategory(button.dataset.name),
  transaction: (button) => openTransaction(button.dataset.id),
  "set-category": (button) => setCategory(button.dataset.id, button.dataset.category),
  filter: (button) => {
    view.filter = button.dataset.filter;
    view.limit = 120;
    renderActivity();
  },
  more: () => {
    view.limit += 120;
    $("#activity-list").innerHTML = activityList();
  },
  "dismiss-install": () => {
    state.settings = { ...state.settings, installHintDismissed: true };
    persist();
    renderToday();
  },
  "remove-account": (button) => {
    const account = state.accounts.find((item) => item.id === button.dataset.id);
    confirmSheet({
      title: "Remove Account",
      copy: `Remove ${escapeHtml(account?.name ?? "this account")} and its ${plural(account?.count ?? 0, "transaction")} from this device?`,
      confirm: "Remove Account",
      action: "confirm-remove-account",
      data: `data-id="${button.dataset.id}"`,
    });
  },
  "confirm-remove-account": (button) => {
    state = removeAccount(state, button.dataset.id);
    if (!state.accounts.length) state.sample = false;
    closeSheet();
    commit({ celebrate: false });
  },
  "remove-rule": (button) => {
    const overrides = { ...state.overrides };
    delete overrides[button.dataset.key];
    state.overrides = overrides;
    commit({ celebrate: false });
  },
  export: () => {
    downloadFile(`cockpit-backup-${today()}.json`, exportBackup(state), "application/json");
    showToast("Backup saved. Keep it somewhere private.");
  },
  restore: () => {
    $("#backup-input").value = "";
    $("#backup-input").click();
  },
  erase: () =>
    confirmSheet({
      title: "Erase Everything",
      copy: "This permanently deletes every transaction, rule, review, and medal Cockpit stored on this device. Export a backup first if you might want it back.",
      confirm: "Erase All Data",
      action: "confirm-erase",
    }),
  "confirm-erase": () => {
    store.clear();
    state = { ...emptyState(), settings: { ...emptyState().settings, theme: state.settings.theme } };
    closeSheet();
    commit({ celebrate: false });
    showTab("today");
    showToast("All Cockpit data erased from this device.");
  },
};

document.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (tab) {
    tap();
    showTab(tab.dataset.tab);
    return;
  }
  if (event.target.closest("[data-close-sheet]")) {
    closeSheet();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const handler = ACTIONS[button.dataset.action];
  if (handler) {
    event.preventDefault();
    handler(button);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "activity-search") return;
  view.query = event.target.value;
  view.limit = 120;
  $("#activity-list").innerHTML = activityList();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCelebration();
    closeSheet();
  }
});

$("#csv-input").addEventListener("change", (event) => handleFile(event.target.files?.[0]).catch(() => showToast("That file could not be read.")));

$("#backup-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state = importBackup(await file.text());
    commit({ celebrate: false });
    showToast("Backup restored.");
  } catch (error) {
    showToast(error.message || "That backup could not be restored.");
  }
});

// Drag the sheet down to dismiss, like a native iOS sheet.
(() => {
  const sheet = $("#sheet");
  let startY = null;
  let delta = 0;
  sheet.addEventListener("pointerdown", (event) => {
    const content = $("#sheet-content");
    const onGrabber = event.target.closest(".sheet-grabber, .sheet-header");
    if (!onGrabber && content.scrollTop > 0) return;
    if (event.target.closest("button, input, label, a")) return;
    startY = event.clientY;
    delta = 0;
    sheet.style.transition = "none";
  });
  window.addEventListener("pointermove", (event) => {
    if (startY === null) return;
    delta = Math.max(0, event.clientY - startY);
    sheet.style.transform = `translate(-50%, ${delta}px)`;
  });
  window.addEventListener("pointerup", () => {
    if (startY === null) return;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (delta > 110) closeSheet();
    startY = null;
  });
})();

for (const slot of $$("[data-icon]")) slot.innerHTML = ICONS[slot.dataset.icon];
$("#import-button").innerHTML = ICONS.plus;
$("#import-button").dataset.action = "import";

window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && derived?.insights && derived.insights.today !== today()) commit({ celebrate: false });
});

applyTheme();
window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", applyTheme);
recompute();
render();
showTab(location.hash.slice(1) || "today");

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("/cockpit-sw.js", { scope: "/cockpit" }).catch(() => {});
}
