/* WeLink service worker — static assets only. Never cache auth/API/user data. */
const CACHE = "welink-static-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./offline.html",
  "./login.html",
  "./dashboard.html",
  "./admin.html",
  "./css/welink-design-tokens.css",
  "./css/welink-theme.css",
  "./css/welink-responsive.css",
  "./css/welink-cinematic-theme.css",
  "./css/welink-cinematic-readability.css",
  "./css/welink-landing-theme.css",
  "./css/app.css",
  "./css/brand-logo.css",
  "./css/login.css",
  "./css/guest-dashboard.css",
  "./css/pro-dashboard.css",
  "./css/admin-dashboard.css",
  "./css/admin-communication-hub.css",
  "./js/theme-boot.js",
  "./js/welink-app.js",
  "./js/helpers.js",
  "./js/ui.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./img/welink-mark.svg"
];

const SKIP = [
  /\/js\/config\.js(?:\?|$)/,
  /supabase\.(co|in)/i,
  /\/auth\//i,
  /\/rest\/v1\//i,
  /\/realtime\//i,
  /\/storage\/v1\//i,
  /pollinations\.ai/i
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function shouldSkip(url) {
  return SKIP.some((re) => re.test(url));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = req.url;
  if (shouldSkip(url)) return;

  const dest = req.destination;
  const isAsset =
    dest === "style" ||
    dest === "script" ||
    dest === "image" ||
    dest === "font" ||
    dest === "manifest" ||
    url.includes("/css/") ||
    url.includes("/icons/") ||
    url.includes("/img/");

  if (isAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  if (req.mode === "navigate" || dest === "document") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("./offline.html").then((r) => r || caches.match("./index.html")))
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "NOTIFY") return;
  const title = data.title || "WeLink";
  const options = {
    body: data.body || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "welink",
    data: { url: data.url || "./dashboard.html" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || "./dashboard.html";
  const target = new URL(raw, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(target).then(() => client.focus()).catch(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
