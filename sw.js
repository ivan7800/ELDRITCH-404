const scopePrefix = 'eldritch-' + self.registration.scope + ':';
const assets = ["./","./index.html","./style.css","./manifest.webmanifest","./src/content.mjs","./src/math.mjs","./src/campaign.mjs","./src/simulation.mjs","./src/storage.mjs","./src/input.mjs","./src/audio.mjs","./src/render.mjs","./src/app.mjs","./assets/beacon.png","./assets/boat.png","./assets/cast.png","./assets/chapel.png","./assets/fauna.png","./assets/icon-512.png","./assets/icon.png","./assets/landmarks.png","./assets/mooring.png","./assets/portraits.png","./assets/scene-0.webp","./assets/scene-1.webp","./assets/scene-2.webp","./assets/scene-3.webp","./assets/scene-4.webp","./assets/scene-5.webp","./assets/scene-6.webp","./assets/scene-7.webp","./assets/scene-8.webp","./assets/scene-9.webp","./assets/shrine.png","./assets/sprites.png","./assets/title-cinematic.webp","./assets/title.png","./assets/well.png"];
const cacheName = scopePrefix + "eldritch-cc328e0571c47332";
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