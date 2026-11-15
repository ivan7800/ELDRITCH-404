import { mkdir, cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = 'dist';
await mkdir(dir,{recursive:true});
const sources = ['content','math','campaign','simulation','storage','input','audio','render','app'];
const assets = (await readdir('assets')).filter(name => /\.(png|webp)$/.test(name)).sort();
const paths = ['index.html','style.css','manifest.webmanifest', ...sources.map(s=>'src/'+s+'.mjs'), ...assets.map(s=>'assets/'+s)];
const hash = createHash('sha256');
for (const path of paths) hash.update(await readFile(path));
const cache = 'eldritch-' + hash.digest('hex').slice(0,16);
const worker = `const scopePrefix = 'eldritch-' + self.registration.scope + ':';
const assets = ${JSON.stringify(['./', ...paths.map(p=>'./'+p)])};
const cacheName = scopePrefix + ${JSON.stringify(cache)};
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
});`;
await writeFile('sw.js',worker);
for (const path of ['index.html','style.css','manifest.webmanifest','sw.js','src','assets']) {
  await cp(path,dir+'/'+path,{recursive:true});
}

const uris = Object.fromEntries(await Promise.all(assets.map(async name =>
  [name, 'data:image/'+(name.endsWith('.webp')?'webp':'png')+';base64,'+(await readFile('assets/'+name)).toString('base64')]
)));
const moduleCode = [];
for (const name of sources) {
  let code = await readFile('src/'+name+'.mjs','utf8');
  const exports = [...code.matchAll(/^export (?:class|const|function) (\w+)/gm)].map(m=>m[1]);
  code = code.replace(/^import \{([^}]+)\} from '\.\/(\w+)\.mjs';$/gm,'const {$1} = modules.$2;');
  code = code.replace(/^export /gm,'');
  if (name === 'render') code = code.replace("'assets/' + name + '.png'","art[name + '.png']");
  if (name === 'app') {
    code = code.replaceAll('assets/icon.png',uris['icon.png']);
    code = code.replace("'assets/arena'+stage+'.png' : 'assets/quay.png'", "art['arena'+stage+'.png'] : art['quay.png']");
  }
  moduleCode.push('modules.'+name+' = (() => {\n'+code+'\nreturn {'+exports.join(',')+'};\n})();');
}
const css = (await readFile('style.css','utf8')).replaceAll('assets/title-cinematic.webp',uris['title-cinematic.webp']);
const html = (await readFile('index.html','utf8'))
  .replace(/^<link rel="manifest".*\n/m,'')
  .replace('./assets/icon.png',uris['icon.png'])
  .replace('<link rel="stylesheet" href="./style.css">','<style>'+css+'</style>')
  .replace('<script type="module" src="./src/app.mjs"></script>','<script>\n"use strict";\nconst modules = {};\nconst art = '+JSON.stringify(Object.fromEntries(Object.entries(uris).filter(([name])=>name.endsWith('.png') && name!=='title.png')))+';\n'+moduleCode.join('\n')+'\n</script>');
await writeFile('ELDRITCH-404.html',html);
console.log('Web build: dist/ · Portable: ELDRITCH-404.html');
