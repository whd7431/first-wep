const CACHE = 'iwon-tax-v17';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/kacta-mark.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 지도·글꼴 등 외부 요청은 그대로 통과

  // 페이지는 최신 우선, 오프라인이면 캐시
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // 나머지 정적 파일은 캐시 우선
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
