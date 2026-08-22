import { calculateFlightScore, getRelativeCategoryScores } from "./flightScoreCalculator.js?v=stage-order-1";
import { getScoreBand, trackEvent } from "./analytics.js?v=ga4-1";
import { generatePersonalizedFlightPlan } from "./personalizedFlightPlan.js?v=w1-1";

const MAILERLITE_ACCOUNT_ID = "2411474";
const MAILERLITE_FORM_ID = "189897889621738735";
const MAILERLITE_ENDPOINT = `https://assets.mailerlite.com/jsonp/${MAILERLITE_ACCOUNT_ID}/forms/${MAILERLITE_FORM_ID}/subscribe`;
const THANK_YOU_URL = "/thank-you.html";

const scoreForm = document.querySelector("#score-form");
const leadForm = document.querySelector("#lead-form");
const errorNode = document.querySelector("#form-error");
const leadStatus = document.querySelector("#leadStatus");

const fields = [
  "income",
  "needs",
  "wants",
  "savings",
  "extraDebtPayment",
  "totalDebtBalance",
  "emergencyFundSaved",
  "emergencyFundGoal",
  "investmentsCurrentValue",
];

let hasTrackedScorecardStart = false;
let hasTrackedScorecardComplete = false;
let hasTrackedBriefingView = false;

const trackScorecardStart = () => {
  if (hasTrackedScorecardStart) return;
  hasTrackedScorecardStart = true;
  trackEvent("scorecard_start");
};

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const percent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

const wholePercent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "percent",
});

const getInputValues = () =>
  fields.reduce((values, field) => {
    values[field] = scoreForm.elements[field].value;
    return values;
  }, {});

const createDerivedContext = (result) =>
  Object.freeze({
    score: result.score,
    stageKey: result.stage.key,
    stageName: result.stage.name,
    relativeScores: getRelativeCategoryScores(result.categoryScores),
    pressureMetrics: Object.freeze({
      cashRemaining: result.metrics.cashRemaining,
      savingsRate: result.metrics.savingsRate,
      emergencyFundLevel: result.metrics.emergencyFundLevel,
    }),
  });

const setMetricTone = (node, tone) => {
  node.style.color =
    tone === "orange" ? "var(--orange)" : tone === "red" ? "var(--red)" : "var(--green)";
};

const animateScore = (start, end) => {
  const scoreValue = document.querySelector("#scoreValue");
  const scoreRing = document.querySelector("#scoreRing");
  const duration = 520;
  const started = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    scoreValue.textContent = current;
    scoreRing.style.setProperty("--score", current);

    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const renderResults = (result, shouldScroll = false) => {
  const previousScore = Number(document.querySelector("#scoreValue").textContent) || 0;
  const cashNode = document.querySelector("#cashRemaining");
  const savingsNode = document.querySelector("#savingsRate");
  const debtNode = document.querySelector("#debtToIncome");
  const emergencyNode = document.querySelector("#emergencyFundLevel");
  const investmentNode = document.querySelector("#investmentStatus");

  cashNode.textContent = currency.format(result.metrics.cashRemaining);
  savingsNode.textContent = percent.format(result.metrics.savingsRate);
  debtNode.textContent = `${result.metrics.debtToIncome.toFixed(2)}x`;
  emergencyNode.textContent = wholePercent.format(result.metrics.emergencyFundLevel);
  investmentNode.textContent = result.metrics.investmentStatus;

  setMetricTone(cashNode, result.metrics.cashRemaining < 0 ? "red" : "green");
  setMetricTone(savingsNode, result.metrics.savingsRate >= 0.05 ? "green" : "orange");
  setMetricTone(debtNode, result.metrics.debtToIncome > 2 ? "orange" : "green");
  setMetricTone(emergencyNode, result.metrics.emergencyFundLevel >= 0.25 ? "green" : "orange");
  setMetricTone(investmentNode, result.metrics.investmentStatus === "No Fuel" ? "orange" : "green");

  document.querySelector("#stageName").textContent = result.stage.name;
  document.querySelector("#stageMessage").textContent = result.stage.message;
  document.querySelector("#briefingStage").textContent = result.briefing.stage;
  document.querySelector("#briefingMessage").textContent = result.briefing.message;
  document.querySelector("#strongestSignal").textContent = result.briefing.strongestSignal;
  document.querySelector("#warningLight").textContent = result.briefing.warningLight;
  document.querySelector("#sevenDayAction").textContent = result.briefing.sevenDayAction;
  document.querySelector("#starterSection").textContent = result.briefing.starterSection;

  animateScore(previousScore, result.score);

  if (shouldScroll) {
    document.querySelector("#briefing").scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const renderPersonalizedFlightPlan = (result) => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: createDerivedContext(result),
    immediatePressure: scoreForm.elements.immediatePressure.value,
    shortTermObjective: scoreForm.elements.shortTermObjective.value,
  });
  const planNode = document.querySelector("#personalized-flight-plan");
  const hasFallback = Boolean(plan.fallback);

  document.querySelector("#planScore").textContent = result.score;
  document.querySelector("#planStage").textContent = result.stage.name;
  document.querySelector("#planStrongSignal").textContent = plan.strongSignal.category;
  document.querySelector("#planWarningLightOne").textContent = hasFallback
    ? "Ownership Mindset"
    : plan.warningLights[0].category;
  document.querySelector("#planWarningLightTwo").textContent = hasFallback
    ? ""
    : plan.warningLights[1].category;
  document.querySelector("#planWarningLightTwoCard").hidden = hasFallback;
  document.querySelector("#planFallbackCard").hidden = !hasFallback;
  document.querySelector("#planFallback").textContent = hasFallback ? "Ownership Mindset" : "";
  document.querySelector("#planFallbackNote").textContent = hasFallback ? plan.fallback.note || "" : "";
  document.querySelector("#planDoNow").textContent = plan.doNow;
  document.querySelector("#planThisPayday").textContent = plan.thisPayday;
  document.querySelector("#planThisMonth").textContent = plan.thisMonth;
  document.querySelector("#planThirtyDayMission").textContent = plan.thirtyDayMission;
  document.querySelector("#planWorkbookTab").textContent = plan.workbookConnection.tab;
  document.querySelector("#planWorkbookAction").textContent = plan.workbookConnection.action;

  planNode.hidden = false;
  planNode.scrollIntoView({ behavior: "smooth", block: "start" });
};

const validateInputs = () => {
  const invalid = fields.find((field) => Number(scoreForm.elements[field].value) < 0);
  if (invalid) {
    errorNode.textContent = "Use zero or higher for every field.";
    return false;
  }

  if (Number(scoreForm.elements.income.value) <= 0) {
    errorNode.textContent = "Enter monthly take home income to calculate your score.";
    return false;
  }

  if (!scoreForm.elements.immediatePressure.value) {
    errorNode.textContent = "Select your current pressure to calculate your Flight Plan.";
    return false;
  }

  errorNode.textContent = "";
  return true;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const setLeadFormSending = (isSending) => {
  const button = leadForm.querySelector('button[type="submit"]');
  if (!button) return;

  button.disabled = isSending;
  button.textContent = isSending ? "Sending..." : "Send Me The Starter Kit";
};

const extractMailerLiteError = (data) => {
  try {
    const fields = data?.errors?.fields;
    const firstKey = fields && Object.keys(fields)[0];
    if (firstKey && fields[firstKey]?.[0]) return fields[firstKey][0];
  } catch {
    return null;
  }

  return null;
};

const submitLeadToMailerLite = async ({ email }) => {
  const body = new URLSearchParams({
    "fields[email]": email,
    "ml-submit": "1",
    anticsrf: "true",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(MAILERLITE_ENDPOINT, {
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      signal: controller.signal,
    });

    const data = await response.json();
    if (data?.success) return data;

    throw new Error(extractMailerLiteError(data) || "Something went wrong. Please check your email address and try again.");
  } finally {
    clearTimeout(timeout);
  }
};

scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  trackScorecardStart();

  if (!validateInputs()) return;

  const result = calculateFlightScore(getInputValues());
  if (!hasTrackedScorecardComplete) {
    hasTrackedScorecardComplete = true;
    trackEvent("scorecard_complete");
  }
  renderResults(result, true);
  renderPersonalizedFlightPlan(result);
  if (!hasTrackedBriefingView) {
    hasTrackedBriefingView = true;
    trackEvent("briefing_view");
  }
});

scoreForm.addEventListener("input", (event) => {
  if (event.target.matches("input")) trackScorecardStart();

  if (event.target.matches("input") && Number(event.target.value) < 0) {
    event.target.value = 0;
  }
});

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = leadForm.elements.leadEmail.value.trim();

  if (!isValidEmail(email)) {
    leadStatus.textContent = "Enter a valid email address.";
    return;
  }

  trackEvent("briefing_submit_start");
  leadStatus.textContent = "Preparing your Starter Kit access...";
  setLeadFormSending(true);

  submitLeadToMailerLite({ email })
    .then(() => {
      trackEvent("sign_up", { transport_type: "beacon" });
      trackEvent("briefing_submit_success", { transport_type: "beacon" });
      leadStatus.textContent = "Success. Opening your Starter Kit download page.";
      leadForm.reset();
      window.setTimeout(() => {
        window.location.href = THANK_YOU_URL;
      }, 250);
    })
    .catch((error) => {
      trackEvent("briefing_submit_error", {
        error_type: error.name === "AbortError" ? "timeout" : "provider_error",
      });
      leadStatus.textContent =
        error.name === "AbortError"
          ? "This is taking longer than expected. Please try again."
          : "We couldn't complete your request right now. Please try again.";
    })
    .finally(() => {
      setLeadFormSending(false);
    });
});

renderResults(calculateFlightScore(getInputValues()));
