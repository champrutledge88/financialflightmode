// Offline support for Cockpit only. Registered with scope "/cockpit" so the rest of the
// Financial Flight Mode site is never served from this cache. No financial data is cached:
// transactions live in the page's own storage, not in network responses.

const CACHE = "ffm-cockpit-v3";
const SHELL = [
  "/cockpit.html",
  "/manifest.webmanifest",
  "/src/cockpit/cockpit.css?v=3",
  "/src/cockpit/app.js?v=3",
  "/src/cockpit/bankFormats.js",
  "/src/cockpit/banks.js",
  "/src/cockpit/categorize.js",
  "/src/cockpit/charts.js",
  "/src/cockpit/csv.js",
  "/src/cockpit/dates.js",
  "/src/cockpit/deepInsights.js",
  "/src/cockpit/effects.js",
  "/src/cockpit/format.js",
  "/src/cockpit/icons.js",
  "/src/cockpit/insights.js",
  "/src/cockpit/medals.js",
  "/src/cockpit/planning.js",
  "/src/cockpit/sampleData.js",
  "/src/cockpit/store.js",
  "/assets/app/apple-touch-icon.png",
  "/assets/app/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("ffm-cockpit-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network first so updates arrive right away; the cache keeps Cockpit working offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return request.mode === "navigate" ? caches.match("/cockpit.html") : Response.error();
        }),
      ),
  );
});
