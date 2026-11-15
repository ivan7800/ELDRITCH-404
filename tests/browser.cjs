const assert = require('node:assert/strict');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

async function run() {
  const server = spawn(process.execPath, ['tools/serve.mjs'], {env:{...process.env,PORT:'0',ELDRITCH_WEB_ROOT:'dist'}});
  let browser;
  try {
    const url = await new Promise((resolve,reject)=>{
      server.stdout.once('data',data=>resolve(data.toString().trim()));
      server.once('error',reject);
      server.once('exit',c=>reject(Error('Server exited '+c)));
    });
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args:['--no-sandbox'],
    });
    const ctx = await browser.newContext({viewport:{width:1280,height:800}});
    const page = await ctx.newPage();
    const errors = [];
    const watch = p => p.on('pageerror',e=>errors.push(e.message));
    watch(page);
    await page.addInitScript(()=>{
      window.pad = {connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
      Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});
    });
    const press = async id=>{
      await page.evaluate(i=>window.pad.buttons[i].pressed=true,id);
      await page.waitForTimeout(85);
      await page.evaluate(i=>window.pad.buttons[i].pressed=false,id);
      await page.waitForTimeout(85);
    };
    const current = () => page.evaluate(()=>window.qa.snapshot());
    await page.goto(url+'/?qa=1');
    if (process.env.QA_SCREENSHOTS) await page.screenshot({path:join(process.env.QA_SCREENSHOTS,'title.png')});
    await press(0);
    await page.getByRole('heading',{name:'Innsmouth Olvidada'}).waitFor();
    await page.getByRole('button',{name:'Cambiar preparación'}).click();
    await page.getByText('Pulso firme',{exact:true}).waitFor();
    await page.getByText('Escopeta de sal',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Entrar en el muelle'}).click();
    await page.locator('#hud').waitFor();
    await page.keyboard.down('d');
    await page.waitForTimeout(85);
    await page.evaluate(()=>window.qa.tick(20));
    await page.keyboard.up('d');
    assert.ok((await current()).x>900);
    const before = (await current()).x;
    await page.evaluate(()=>window.pad.axes[0]=-.72);
    await page.waitForTimeout(85);
    await page.evaluate(()=>window.qa.tick(20));
    await page.evaluate(()=>window.pad.axes[0]=0);
    assert.ok((await current()).x<before);
    await press(9);
    await page.getByRole('heading',{name:'Pausa',exact:true}).waitFor();
    await press(13); // Navigate down to settings using D-pad.
    await press(0);
    await page.getByRole('heading',{name:'Opciones'}).waitFor();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'language');
    await press(15); // Switch from Spanish to English on the focused select.
    await page.getByRole('heading',{name:'Settings'}).waitFor();
    await press(1);
    await page.getByRole('heading',{name:'Paused'}).waitFor();
    await press(0);
    await page.evaluate(()=>window.pad.connected=false);
    await page.getByText('Gamepad disconnected',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Save and quit'}).click();
    await page.reload();
    await page.getByRole('button',{name:'Resume suspended run'}).click();
    await page.waitForFunction(()=>window.qa.snapshot()?.mode==='play');
    const { plan, choose } = await import('./pilot.mjs');
    // Run the real game rules to the credits without mutating game state.
    let finished = false;
    let combatShot = false;
    for(let i=0;i<2450;i++) {
      const [snapshot,obs] = await page.evaluate(()=>[window.qa.snapshot(),window.qa.observe()]);
      if(snapshot.screen==='result') { assert.equal(snapshot.mode,'won'); finished=true; break; }
      if(snapshot.screen==='level') {
        const choice=choose(snapshot.choices,snapshot.hp);
        await page.locator('[data-value="'+choice+'"]').click();
      } else {
        const controls=plan(obs);
        await page.evaluate(c=>window.qa.tick(8,c),controls);
        if (!combatShot && snapshot.time>77 && snapshot.screen==='play' && process.env.QA_SCREENSHOTS) {
          await page.screenshot({path:join(process.env.QA_SCREENSHOTS,'combat.png')});
          combatShot=true;
        }
      }
    }
    assert.ok(finished,'Victory screen reached');
    await page.getByRole('heading',{name:'The Lead Seal'}).waitFor();
    assert.equal((await current()).stats.wins,1);
    await page.reload();
    await page.getByRole('button',{name:'Resolve story decision'}).click();
    await page.getByRole('button',{name:'Shelter the duplicate'}).click();
    await page.getByRole('heading',{name:'Cemetery of the Nameless'}).waitFor();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByRole('button',{name:'Archive',exact:true}).click();
    await page.getByRole('button',{name:'Field journal'}).click();
    await page.getByText('The Tide Sacristan',{exact:false}).waitFor();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByRole('button',{name:'Continue story'}).click();
    await page.getByRole('button',{name:'Change loadout'}).click();
    await page.getByRole('button',{name:'1 · Forgotten Innsmouth'}).click();
    await page.getByText('Veteran credential active',{exact:false}).waitFor();
    await page.getByRole('button',{name:'Enter the quay'}).click();
    for(let i=0;i<120;i++) {
      const snapshot=await current();
      if(snapshot.mode==='lost') break;
      if(snapshot.mode==='level') await page.keyboard.press('Digit1');
      else await page.evaluate(()=>window.qa.tick(180,{}));
    }
    await page.getByRole('heading',{name:'The tide claims you'}).waitFor();
    await page.getByRole('button',{name:'Another expedition'}).click();
    await page.waitForFunction(()=>window.qa.snapshot()?.mode==='play' && window.qa.snapshot()?.time===0);
    console.log('OK · browser: gamepad simulation, language, full win, reload, loss and restart');

    const offline=await browser.newContext();
    const pwa=await offline.newPage(); watch(pwa);
    await pwa.goto(url+'/');
    await pwa.waitForFunction(()=>navigator.serviceWorker.controller !== null);
    await offline.setOffline(true);
    await pwa.reload();
    await pwa.getByRole('button',{name:'Comenzar expedición'}).click();
    await pwa.getByRole('button',{name:'Entrar en el muelle'}).click();
    await pwa.locator('#hud').waitFor();
    await pwa.waitForFunction(()=>document.querySelector('#clock').textContent === '04:59');
    console.log('OK · PWA: installed, reloaded and played with network disabled');

    const file=await ctx.newPage(); watch(file);
    await file.goto(pathToFileURL(join(process.cwd(),'ELDRITCH-404.html')).href);
    await file.getByRole('button',{name:'Comenzar expedición'}).click();
    await file.getByRole('button',{name:'Entrar en el muelle'}).click();
    await file.keyboard.down('w');
    await file.waitForFunction(()=>document.querySelector('#clock')?.textContent !== '00:00' && !document.querySelector('#hud').hidden);
    await file.keyboard.up('w');
    await file.keyboard.press('Escape');
    await file.getByRole('heading',{name:'Pausa',exact:true}).waitFor();
    console.log('OK · portable HTML: started and paused directly from file://');
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const touch=await mobile.newPage(); watch(touch);
    await touch.goto(url+'/?qa=1');
    await touch.getByRole('button',{name:'Comenzar expedición'}).tap();
    await touch.getByRole('button',{name:'Entrar en el muelle'}).tap();
    const stick=touch.locator('#touch-stick');
    await stick.waitFor();
    await touch.locator('#touch-dash').tap();
    await touch.getByRole('button',{name:'Pausa',exact:true}).tap();
    await touch.getByRole('heading',{name:'Pausa',exact:true}).waitFor();
    await touch.getByRole('button',{name:'Guardar y salir'}).tap();
    await touch.getByRole('button',{name:'Reanudar expedición guardada'}).waitFor();
    console.log('OK · mobile: touch controls, pause and save at 390 × 844');
    assert.deepEqual(errors,[]);
  } finally {
    await browser?.close();
    server.kill();
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
