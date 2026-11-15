const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
(async()=>{
 const server=spawn(process.execPath,['tools/serve.mjs'],{env:{...process.env,ELDRITCH_WEB_ROOT:'dist',PORT:'0'}});
 let browser;
 try {
 const [address]=await once(server.stdout,'data');
 const url=address.toString().trim();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/qa-pilot.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/pilot.mjs','utf8').replaceAll('../src/','./src/')}));
 await page.goto(url+'/?qa=1');
 const button=(name)=>page.getByRole('button',{name,exact:true});
 await button('Opciones').click();
 await page.locator('#difficulty').selectOption('story');
 await button('Volver').click();
 await button('Comenzar expedición').click();
 for(let stage=0;stage<10;stage++){
   await button(stage?'Entrar en expedición':'Entrar en el muelle').click();
   await page.locator('#hud').waitFor();
   const state=await page.evaluate(async()=>{
     const {plan,choose}=await import('./qa-pilot.mjs');
     for(let i=0;i<4900;i++){
       const s=qa.snapshot();
       if(s.screen==='result') return s;
       if(s.screen==='level') document.querySelector('[data-value="'+choose(s.choices,s.hp)+'"]').click();
       else qa.tick(7,plan(qa.observe()));
     }
     return qa.snapshot();
   });
   assert.equal(state.mode,'won','stage '+stage+' / '+state.time);
   await page.reload();
   await button('Resolver decisión de campaña').click();
   if(stage===9) {
      await button('Cerrar el paso').click();
      await page.getByRole('heading',{name:'La costa del amanecer'}).waitFor();
      break;
   }
   await button('Poner a salvo al duplicado').click();
   await button('Volver').click();
   await button('Archivo').click();
   const upgrades=['power','vitality','guard','reach','speed'];
   const upgrade=page.locator('[data-do="buy"][data-value="'+upgrades[stage%5]+'"]');
   if(await upgrade.isEnabled()) await upgrade.click();
   await button('Volver').click();
   await button('Continuar historia').click();
   console.log('Capítulo '+(stage+1)+' completado con victoria, recarga y decisión.');
 }
 await button('Volver al título').click();
 await button('Campaña').click();
 await button('Finales descubiertos · 1/6').click();
 await page.getByText(/La costa del amanecer · La lengua de tierra emerge/).waitFor();
 assert.deepEqual(errors,[]);
 console.log('OK · 10 capítulos, epílogo y registro persistente');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
