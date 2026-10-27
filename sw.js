// 幻想交響曲 事前学習アプリ — オフライン用 Service Worker
// 一度開いた端末では、通信がなくてもアプリを開き直せるようにする。
const CACHE = "fantastique-6cd4ac36bc";
const FILES = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fantastique-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 本体はキャッシュを先に返し、つながっていれば裏で新しい版に入れ替える
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === "navigate" ? "./index.html" : req;
      const hit = await cache.match(key);
      const fresh = fetch(req).then((res) => {
        if (res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
