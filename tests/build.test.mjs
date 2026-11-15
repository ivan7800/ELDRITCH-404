import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { once } from 'node:events';

test('HTML portátil con código válido y arte incorporado', async () => {
  const html = await readFile('ELDRITCH-404.html','utf8');
  const script = html.match(/<script>([\s\S]+)<\/script>/)[1];
  assert.ok(new Script(script));
  assert.ok(!/<(?:script|link) [^>]*(?:src|href)="\.\//.test(html));
  assert.ok(html.includes('data:image/png;base64,'));
  assert.ok(script.includes("art[name + '.png']"));
});
test('el HTML autónomo inicia, muestra mapas, guarda y restaura desde su interfaz',async()=>{
  const html=await readFile('ELDRITCH-404.html','utf8');
  const script=new Script(html.match(/<script>([\s\S]+)<\/script>/)[1]);
  const store=new Map(), elements=new Map();
  const ctx=new Proxy({}, {get:(_,key)=>['createRadialGradient','createLinearGradient'].includes(key)?()=>({addColorStop(){}}):()=>{}});
  const element=id=>{
    if (!elements.has(id)) elements.set(id,{
      events:{}, clientWidth:1280,clientHeight:800,classList:{toggle(){}},
      getContext(){return ctx;},querySelector(selector){return selector==='.panel'?{scrollTop:0}:null;},
      addEventListener(name,handler){this.events[name]=handler;}
    });
    return elements.get(id);
  };
  const browser={
    document:{getElementById:element,documentElement:{},addEventListener(){}},
    navigator:{},location:{search:'?qa=1',hostname:'localhost',protocol:'http:'},
    localStorage:{getItem:id=>store.get(id)??null,setItem:(id,value)=>store.set(id,value),removeItem:id=>store.delete(id)},
    requestAnimationFrame(){}, addEventListener(){}, matchMedia:()=>({matches:false}), console, structuredClone, URLSearchParams,
    setTimeout(){},clearTimeout(){},
    Image:class { decode(){ assert.ok(this.src.startsWith('data:image/png;base64,')); return Promise.resolve(); } }
  };
  browser.window=browser;
  script.runInNewContext(browser);
  const click=async(id,value)=>{
    element('app').events.click({target:{closest:()=>({dataset:{do:id,value}})}});
    await new Promise(resolve=>setImmediate(resolve));
  };
  assert.match(element('overlay').innerHTML,/Comenzar expedición/);
  const menu=()=>element('overlay').innerHTML;
  assert.equal((menu().match(/class="primary"/g)??[]).length,1);
  await click('story-brief');
  assert.match(menu(),/Resiste hasta que llegue el jefe/);
  assert.match(menu(),/05:00/);
  assert.match(menu(),/<img src="data:image\/png;base64,/);
  assert.doesNotMatch(menu(),/Cementerio de los Sin Nombre/);
  await click('toggle-loadout');
  assert.match(menu(),/Cementerio de los Sin Nombre/);
  await click('campaign');
  assert.match(menu(),/2 · Cementerio de los Sin Nombre<\/strong><small>Bloqueado/);
  await click('campaign-endings');
  assert.match(menu(),/La costa del amanecer/);
  await click('modes');
  assert.match(menu(),/Supervivencia/);
  await click('open-mode','free');
  await click('pick-stage','9');
  assert.match(element('overlay').innerHTML,/<h2>Corazón del Caos/);
  await click('start');
  assert.equal(browser.qa.snapshot().screen,'play');
  browser.qa.tick(25,{x:1,y:0});
  const savedTime=browser.qa.snapshot().time;
  await click('pause');
  await click('suspend');
  assert.match(element('overlay').innerHTML,/Reanudar expedición guardada/);
  assert.match(menu(),/data-do="restore" class="primary"/);
  await click('story-brief');
  assert.match(menu(),/<h2>Innsmouth Olvidada/);
  await click('start');
  assert.match(menu(),/Conservar partida/);
  await click('home');
  await click('restore');
  assert.equal(browser.qa.snapshot().time,savedTime);
  assert.equal(browser.qa.snapshot().screen,'play');
});
test('todos los recursos de precaché están disponibles en el servidor', async () => {
  process.env.ELDRITCH_WEB_ROOT = 'dist';
  const { server } = await import('../tools/serve.mjs');
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  try {
    const origin = 'http://127.0.0.1:'+server.address().port+'/';
    const worker = await (await fetch(origin+'sw.js')).text();
    assert.ok(new Script(worker));
    const urls = JSON.parse(worker.split('\n')[1].slice('const assets = '.length,-1));
    for (const resource of urls) {
      const response = await fetch(new URL(resource,origin));
      assert.equal(response.status,200,resource);
      assert.ok((await response.arrayBuffer()).byteLength>0,resource);
      if (resource.endsWith('.mjs')) assert.match(response.headers.get('content-type'),/javascript/);
    }
    assert.equal((await fetch(origin+'missing.mjs')).status,404);
  } finally {
    server.close();
  }
});
