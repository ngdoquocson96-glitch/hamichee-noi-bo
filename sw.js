// HAMICHEE nội bộ: luôn lấy bản mới trên mạng; mất mạng (hoặc mạng treo quá 6 giây) thì dùng bản đã lưu.
var CACHE = 'hami-noibo-v2';
var CORE = ['./', 'index.html', 'quan-ly.html', 'manifest.webmanifest', 'assets/vo-che-sprite.png?v=2', 'assets/icon-192.png'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  // lưu sẵn ngay lần đầu mở, để lần sau mất mạng vẫn vào được game
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); // 1 file lỗi không làm hỏng cả bộ
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function fromCache(r) {
  return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('./') : undefined); });
}
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return; // Google Sheet calls go straight through
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var t = setTimeout(function () { // Wi-Fi quán có sóng mà không có internet: đừng để treo
      fromCache(r).then(function (m) { if (m && !done) { done = true; resolve(m); } });
    }, 6000);
    fetch(r).then(function (res) {
      if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
      clearTimeout(t); if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(t);
      fromCache(r).then(function (m) { if (!done) { done = true; resolve(m || Response.error()); } });
    });
  }));
});
