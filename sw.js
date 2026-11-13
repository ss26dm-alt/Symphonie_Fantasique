// 幻想交響曲 事前学習アプリ — オフライン用 Service Worker
// 端末に保存した版をすぐに出す（速く、確実に開く）。新しい版の確認と切り替えは、ページ側で行う。
const CACHE = "fantastique-e37cfc9767";
const PAGE = "./index.html";
const MARK = "fantastique-kyoso3";  // 本物のアプリの中身にだけ含まれる目印（Wi-Fiのログイン画面などを保存しないため）

async function fetchGenuine() {
  const res = await fetch(PAGE, { cache: "reload" });
  if (!res.ok || res.redirected) throw new Error("bad response");
  const text = await res.text();
  if (!text.includes(MARK)) throw new Error("not the app");
  return new Response(text, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    fetchGenuine()
      .then((res) => caches.open(CACHE).then((c) => c.put(PAGE, res)))
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

// 画面を開くとき：保存した版があればそれを出す。なければ通信で取りに行く。
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(PAGE);
    return hit || fetch(req);
  })());
});
