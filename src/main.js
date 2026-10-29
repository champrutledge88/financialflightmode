import { enhanceScorecard } from "./guidedScorecard.js?v=categories-1";
import { renderFlightReport, revealFlightReport } from "./flightReportUI.js?v=categories-1";
import { moneyError } from "./scorecardFlow.js?v=final-review-1";
import { calculateFlightScore } from "./flightScoreCalculator.js?v=stage-order-1";
import { trackEvent } from "./analytics.js?v=ga4-1";

const MAILERLITE_ACCOUNT_ID = "2411474";
const MAILERLITE_FORM_ID = "189897889621738735";
const MAILERLITE_ENDPOINT = `https://assets.mailerlite.com/jsonp/${MAILERLITE_ACCOUNT_ID}/forms/${MAILERLITE_FORM_ID}/subscribe`;
const THANK_YOU_URL = "/thank-you.html";

// Financial inputs have no form owner in static HTML. Create a form only after JS loads.
const inputTemplate = document.querySelector("#score-inputs");
const scoreForm = document.createElement("form");
scoreForm.id = "score-form"; scoreForm.className = inputTemplate.className;
scoreForm.append(...inputTemplate.childNodes); inputTemplate.replaceWith(scoreForm);
scoreForm.addEventListener("submit", event => event.preventDefault());
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

let guidedFlow;
const getInputValues = () => guidedFlow ? guidedFlow.getValues() :
  fields.reduce((values, field) => {
    values[field] = scoreForm.elements[field].value;
    return values;
  }, {});

const animateScore = (start, end, scoreValue, scoreRing, duration = 520) => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    scoreValue.textContent = end; scoreRing.style.setProperty("--score", end); return () => {};
  }
  const started = performance.now();
  let frame;

  const tick = (now) => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    scoreValue.textContent = current;
    scoreRing.style.setProperty("--score", current);

    if (progress < 1) frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
};

const validateInputs = () => {
  const values = getInputValues();
  const invalid = fields.find(field => moneyError(Number(values[field]), field));
  if (invalid) {
    errorNode.textContent = moneyError(Number(values[invalid]), invalid);
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
  guidedFlow?.complete();
  revealFlightReport(result, {
    animateScore,
    inputBreakdown: guidedFlow.getBreakdown(),
    onComplete: () => {

      if (!hasTrackedBriefingView) {
        hasTrackedBriefingView = true;
        trackEvent("briefing_view");
      }
    },
  });
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

const exampleResult = calculateFlightScore(getInputValues());
renderFlightReport(exampleResult, { example: true });
guidedFlow = enhanceScorecard(scoreForm, { onStart: trackScorecardStart });
document.addEventListener("flight-report-edit", () => {
  document.querySelector("#flight-report").hidden = true;
  guidedFlow.edit();
});

// Closing the optional walkthrough also stops its sound.
const cockpitWalkthrough = document.querySelector("#cockpit-walkthrough");
cockpitWalkthrough?.addEventListener("toggle", () => {
  if (!cockpitWalkthrough.open) cockpitWalkthrough.querySelector("video")?.pause();
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
