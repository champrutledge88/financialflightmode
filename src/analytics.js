const GA_MEASUREMENT_ID = "G-JXVRBKSSMH";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const initializeGoogleAnalytics = () => {
  if (!isBrowser || window.__ffmGa4Initialized) return;

  window.__ffmGa4Initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    send_page_view: true,
  });

  if (!document.querySelector(`script[data-ffm-ga4="${GA_MEASUREMENT_ID}"]`)) {
    const tag = document.createElement("script");
    tag.async = true;
    tag.dataset.ffmGa4 = GA_MEASUREMENT_ID;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(tag);
  }
};

export const trackEvent = (eventName, parameters = {}) => {
  initializeGoogleAnalytics();
  if (!isBrowser || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    ...parameters,
    send_to: GA_MEASUREMENT_ID,
  });
};

export const getScoreBand = (score) => {
  if (score < 40) return "0-39";
  if (score < 60) return "40-59";
  if (score < 80) return "60-79";
  return "80-100";
};

initializeGoogleAnalytics();
