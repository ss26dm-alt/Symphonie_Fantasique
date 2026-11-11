// 幻想交響曲 事前学習アプリ — オフライン用 Service Worker
// つながっているときは常に最新版を取りに行き、つながらないとき（または応答が遅いとき）だけ保存済みの版を出す。
const CACHE = "fantastique-b5857c4166";
const PAGE = "./index.html";
const TIMEOUT_MS = 4000;  // ロビーなどで回線が混んでいるときは、4秒待って保存済みの版に切り替える

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.add(new Request(PAGE, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fantastique-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // GitHub Pages のブラウザ側キャッシュ（約10分）を飛ばして、必ずサーバーに確かめる
    const net = fetch(PAGE, { cache: "no-cache" }).then((res) => {
      if (res.ok) cache.put(PAGE, res.clone());
      return res;
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
    try {
      const res = await Promise.race([net, timeout]);
      if (res && res.ok) return res;
    } catch (err) { /* 通信なし */ }
    const hit = await cache.match(PAGE);
    if (hit) return hit;
    return net;  // 保存済みの版もなければ、通信の結果をそのまま待つ
  })());
});
