import { calculateFlightScore, getRelativeCategoryScores } from "./flightScoreCalculator.js?v=stage-order-1";
import { trackEvent } from "./analytics.js?v=ga4-1";
import { generatePersonalizedFlightPlan, createAnalyticsPayload } from "./personalizedFlightPlan.js?v=launch-funnel-2";
import { createPlanEmailRequest } from "./planEmailRequest.js?v=launch-funnel-2";

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
let hasCalculatedPersonalResult = false;
let currentPlanSummary = null;
let currentPlanAnalytics = null;
let pendingPlanRequest = null;
let planEmailAvailable = false;
let isPlanSending = false;
const planEmailForm = document.querySelector("#planEmailForm");
const planEmailButton = document.querySelector("#openPlanEmail");
const planEmailStatus = document.querySelector("#planEmailStatus");
const exampleValues = getExampleValues();

function getExampleValues() {
  return Object.fromEntries(fields.map((field) => [field, scoreForm.elements[field].defaultValue]));
}

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
  currentPlanSummary = {
    score: result.score, stage: result.stage.key, strongSignalCategory: plan.strongSignal.category,
    warningLight1Category: hasFallback ? "Ownership Mindset" : plan.warningLights[0].category,
    warningLight2Category: hasFallback ? "" : plan.warningLights[1].category,
    actionId: hasFallback ? plan.fallback.actionId : plan.warningLights[0].actionId,
    workbookTab: plan.workbookConnection.tab, workbookAction: plan.workbookConnection.action,
    doNow: plan.doNow, thisPayday: plan.thisPayday, thisMonth: plan.thisMonth, thirtyDayMission: plan.thirtyDayMission,
  };
  currentPlanAnalytics = {
    stage: result.stage.key, strongSignalCategory: plan.strongSignal.category,
    warningLight1Category: currentPlanSummary.warningLight1Category, decisionPath: plan.decisionPath,
  };
  pendingPlanRequest = null;
  planEmailForm.reset();
  planEmailForm.hidden = true;
  planEmailButton.setAttribute("aria-expanded", "false");
  planEmailForm.querySelector('button[type="submit"]').disabled = !planEmailAvailable;
  planEmailStatus.textContent = planEmailAvailable
    ? "Send this plan and Starter Kit access with your consent."
    : "Email delivery is being prepared. Your Flight Plan remains visible here.";

  document.querySelector("#planScore").textContent = result.score;
  document.querySelector("#planStage").textContent = result.stage.name;
  document.querySelector("#planStrongSignal").textContent = plan.strongSignal.category;
  document.querySelector("#planWarningLightOne").textContent = hasFallback
    ? "Ownership Mindset"
    : plan.warningLights[0].category;
  document.querySelector("#planWarningLightOneCard").hidden = hasFallback;
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
  document.querySelector("#planContextNote").textContent = hasFallback ? "" : plan.flagContextNote || "";
  document.querySelector("#planContextNote").hidden = hasFallback || !plan.flagContextNote;

  planNode.hidden = false;
  document.querySelector("#briefing").hidden = true;
  document.querySelector("#resultsLink").href = "#personalized-flight-plan";
  const event = createAnalyticsPayload("personalized_plan_view", {
    stage: result.stage.key,
    strongSignalCategory: plan.strongSignal.category,
    warningLight1Category: hasFallback ? "Ownership Mindset" : plan.warningLights[0].category,
    decisionPath: plan.decisionPath,
  });
  trackEvent(event.eventName, event.parameters);
  planNode.scrollIntoView({ behavior: "smooth", block: "start" });
};

const validateInputs = () => {
  const missing = fields.find((field) => scoreForm.elements[field].value.trim() === "");
  if (missing) {
    errorNode.textContent = "Complete every amount. Enter 0 only when the amount is zero.";
    scoreForm.elements[missing].focus();
    return false;
  }
  const nonFinite = fields.find((field) => !Number.isFinite(Number(scoreForm.elements[field].value)));
  if (nonFinite) {
    errorNode.textContent = "Enter a valid amount in every field.";
    return false;
  }
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

    if (!response.ok) throw new Error("Provider request failed.");

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
  hasCalculatedPersonalResult = true;
  document.querySelector("#results").hidden = false;
  document.querySelector("#resultsTitle").textContent = "Your Results";
  if (!hasTrackedScorecardComplete) {
    hasTrackedScorecardComplete = true;
    trackEvent("scorecard_complete");
  }
  renderResults(result);
  renderPersonalizedFlightPlan(result);
  if (!hasTrackedBriefingView) {
    hasTrackedBriefingView = true;
    trackEvent("briefing_view");
  }
});

scoreForm.addEventListener("input", (event) => {
  if (event.target.matches("input")) trackScorecardStart();
  currentPlanSummary = null;
  currentPlanAnalytics = null;
  pendingPlanRequest = null;
  document.querySelector("#personalized-flight-plan").hidden = true;
  document.querySelector("#resultsLink").href = document.querySelector("#results").hidden
    ? "#scorecard"
    : "#results";
  document.querySelector("#resultsTitle").textContent = hasCalculatedPersonalResult
    ? "Previous Results — Calculate To Update"
    : "Example Results — Calculate To Update";
});

document.querySelector("#startOwnNumbers").addEventListener("click", () => {
  currentPlanSummary = null;
  pendingPlanRequest = null;
  fields.forEach((field) => { scoreForm.elements[field].value = ""; });
  scoreForm.elements.immediatePressure.value = "";
  scoreForm.elements.shortTermObjective.value = "";
  document.querySelector("#results").hidden = true;
  document.querySelector("#personalized-flight-plan").hidden = true;
  document.querySelector("#resultsLink").href = "#scorecard";
  document.querySelector("#inputModeNote").textContent = "Enter your own amounts in every field. Enter 0 only when the amount is zero; cents are accepted. Your numbers stay in this browser.";
  errorNode.textContent = "";
  scoreForm.elements.income.focus();
});

document.querySelector("#loadExample").addEventListener("click", () => {
  currentPlanSummary = null;
  pendingPlanRequest = null;
  fields.forEach((field) => { scoreForm.elements[field].value = exampleValues[field]; });
  scoreForm.elements.immediatePressure.value = "";
  scoreForm.elements.shortTermObjective.value = "";
  document.querySelector("#results").hidden = false;
  document.querySelector("#personalized-flight-plan").hidden = true;
  document.querySelector("#resultsLink").href = "#results";
  document.querySelector("#resultsTitle").textContent = "Example Results";
  document.querySelector("#inputModeNote").textContent = "These are example amounts. Replace every amount with your own, or start with blank fields. Enter 0 only when the amount is zero; cents are accepted.";
  hasCalculatedPersonalResult = false;
  errorNode.textContent = "";
  renderResults(calculateFlightScore(exampleValues));
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

const trackPlanEmailEvent = (name, analytics = currentPlanAnalytics) => {
  if (!analytics) return;
  const event = createAnalyticsPayload(name, analytics);
  trackEvent(event.eventName, event.parameters);
};

fetch("/api/email-flight-plan", { signal: AbortSignal.timeout(10000) })
  .then(response => response.ok ? response.json() : { available: false })
  .then(data => {
    planEmailAvailable = data.available === true;
    planEmailButton.disabled = !planEmailAvailable;
    planEmailForm.querySelector('button[type="submit"]').disabled = !planEmailAvailable;
    planEmailStatus.textContent = planEmailAvailable
      ? "Send this plan and Starter Kit access with your consent."
      : "Email delivery is being prepared. Your Flight Plan remains visible here.";
  })
  .catch(() => { planEmailStatus.textContent = "Email delivery is being prepared. Your Flight Plan remains visible here."; });

planEmailButton.addEventListener("click", () => {
  if (!currentPlanSummary || !planEmailAvailable) return;
  planEmailForm.hidden = false;
  planEmailButton.setAttribute("aria-expanded", "true");
  planEmailForm.elements.planEmail.focus();
});

planEmailForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (isPlanSending || !currentPlanSummary || !planEmailAvailable || !planEmailForm.reportValidity()) return;
  const email = planEmailForm.elements.planEmail.value.trim().toLowerCase();
  if (!isValidEmail(email) || !planEmailForm.elements.planEmailConsent.checked) return;
  // Preserve the exact request and consent time for safe retries; changed email or plan is a new request.
  if (!pendingPlanRequest || pendingPlanRequest.email !== email) {
    pendingPlanRequest = createPlanEmailRequest({ email, consentTimestamp: new Date().toISOString(), requestId: crypto.randomUUID(), planSummary: currentPlanSummary });
  }
  const request = pendingPlanRequest;
  const requestAnalytics = currentPlanAnalytics;
  const submitButton = planEmailForm.querySelector('button[type="submit"]');
  isPlanSending = true;
  submitButton.disabled = true;
  planEmailStatus.textContent = "Requesting your plan email...";
  trackPlanEmailEvent("personalized_plan_email_start", requestAnalytics);
  let accepted = false;
  try {
    const response = await fetch("/api/email-flight-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.accepted !== true) {
      const messages = {
        email_preferences: "This address has paused FFM email or needs confirmation. Contact hello@financialflightmode.com for help. Your plan remains here.",
        rate_limited: "Please wait a few minutes before trying again. Your plan remains here.",
        request_conflict: "This request changed while sending. Calculate your current plan again before requesting another email.",
        test_only: "Plan email is still in testing. Your plan remains here; Starter Kit access is available below.",
        invalid_request: "This request has expired or is incomplete. Calculate your plan again and retry.",
      };
      throw new Error(messages[data.error] || (response.status === 429 ? messages.rate_limited : "We couldn't request the email right now. Try again; your plan remains here."));
    }
    accepted = true;
    trackPlanEmailEvent("personalized_plan_email_success", requestAnalytics);
    if (pendingPlanRequest === request) planEmailStatus.textContent = "Your plan was accepted for sending. Check your inbox and Spam or Junk. Your plan stays visible here.";
  } catch (error) {
    trackPlanEmailEvent("personalized_plan_email_error", requestAnalytics);
    if (pendingPlanRequest === request) planEmailStatus.textContent = error.name === "TimeoutError"
      ? "This is taking longer than expected. Retry safely; your plan remains here."
      : error.message === "Failed to fetch" ? "We couldn't reach the email service. Retry safely; your plan remains here." : error.message;
  } finally {
    isPlanSending = false;
    submitButton.disabled = accepted && pendingPlanRequest === request;
  }
});

planEmailForm.elements.planEmail.addEventListener("input", () => {
  if (!isPlanSending && pendingPlanRequest && pendingPlanRequest.email !== planEmailForm.elements.planEmail.value.trim().toLowerCase()) {
    pendingPlanRequest = null;
    planEmailForm.querySelector('button[type="submit"]').disabled = !planEmailAvailable;
  }
});

const aboutSection = document.querySelector("#about");
if (aboutSection && typeof IntersectionObserver === "function") {
  let hasTrackedAboutView = false;
  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || hasTrackedAboutView) return;
        hasTrackedAboutView = true;
        trackEvent("about_section_view");
        aboutObserver.disconnect();
      });
    },
    { threshold: 0.4 },
  );
  aboutObserver.observe(aboutSection);
}

document.querySelector("[data-about-scorecard-cta]")?.addEventListener("click", () => {
  trackEvent("about_scorecard_cta_click", { link_location: "about" });
});

document.querySelectorAll("[data-x-link]").forEach((link) => {
  link.addEventListener("click", () => {
    trackEvent("x_profile_click", { link_location: link.dataset.xLink });
  });
});
