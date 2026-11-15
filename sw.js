const scopePrefix = 'eldritch-' + self.registration.scope + ':';
const assets = ["./","./index.html","./style.css","./manifest.webmanifest","./src/content.mjs","./src/math.mjs","./src/campaign.mjs","./src/simulation.mjs","./src/storage.mjs","./src/input.mjs","./src/audio.mjs","./src/render.mjs","./src/app.mjs","./assets/arena1.png","./assets/arena2.png","./assets/arena3.png","./assets/arena4.png","./assets/arena5.png","./assets/arena6.png","./assets/arena7.png","./assets/arena8.png","./assets/arena9.png","./assets/beacon.png","./assets/boat.png","./assets/cast.png","./assets/chapel.png","./assets/icon-512.png","./assets/icon.png","./assets/quay.png","./assets/shrine.png","./assets/sprites.png","./assets/title-cinematic.webp","./assets/title.png","./assets/well.png"];
const cacheName = scopePrefix + "eldritch-2b1669248315d2af";
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets.map(path => new Request(new URL(path,self.registration.scope),{cache:'reload'}))))));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(names => Promise.all(names.filter(name => name.startsWith(scopePrefix) && name !== cacheName).map(name => caches.delete(name))))
  .then(() => self.clients.claim())
));
self.addEventListener('fetch',event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(cacheName).then(async cache => {
    if (event.request.mode === 'navigate') {
      const url = new URL(event.request.url);
      if (url.pathname === new URL('./',self.registration.scope).pathname ||
          url.pathname === new URL('./index.html',self.registration.scope).pathname) {
        return (await cache.match('./')) || fetch(event.request);
      }
      return fetch(event.request);
    }
    return (await cache.match(event.request)) || fetch(event.request);
  }));
});