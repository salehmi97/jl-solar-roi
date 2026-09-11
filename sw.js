/* NuPort Solar ROI - offline shell.
   Network-first for the page AND the encrypted month archives (fresh data when
   online, last good copy when not); cache-first only for static icons. The
   current month's .enc re-encrypts daily, so it must never be cache-first. */
const CACHE = "roi-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const fresh = req.mode === "navigate" || req.destination === "document" ||
                new URL(req.url).pathname.endsWith(".enc") ||
                new URL(req.url).pathname.endsWith(".webmanifest");
  if (fresh) {
    e.respondWith(
      fetch(req, { cache: "no-cache" }).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
