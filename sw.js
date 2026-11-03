// 앱 설치(바로가기)용 최소 서비스워커. 데이터는 항상 서버에서 새로 받도록 캐시하지 않는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request));
});
