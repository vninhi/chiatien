/* Giúp app mở nhanh và mở được cả khi mạng yếu: lưu sẵn giao diện trên máy.
   Dữ liệu chi tiêu không lưu ở đây (lấy từ Google Sheet). */
var CACHE = 'chiatien-v1';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // gọi Google: không đụng tới
  // Ưu tiên bản mới trên mạng (để cập nhật app), mạng chậm quá 2,5 giây thì dùng bản đã lưu.
  e.respondWith(new Promise(function (resolve) {
    var xong = false;
    function tra(r) { if (!xong && r) { xong = true; resolve(r); } }
    var hen = setTimeout(function () { caches.match(e.request).then(tra); }, 2500);
    fetch(e.request).then(function (r) {
      if (r && r.ok) { var c = r.clone(); caches.open(CACHE).then(function (x) { x.put(e.request, c); }); }
      clearTimeout(hen); tra(r);
    }).catch(function () {
      clearTimeout(hen);
      caches.match(e.request).then(function (r) { if (r) tra(r); else caches.match('./index.html').then(function (x) { tra(x || Response.error()); }); });
    });
  }));
});
