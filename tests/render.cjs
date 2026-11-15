const assert = require('node:assert/strict');
const {createCanvas,loadImage} = require('@napi-rs/canvas');
async function run() {
  const {Renderer,renderFiles} = await import('../src/render.mjs');
  const {Expedition} = await import('../src/simulation.mjs');
  const {atlasCell,stages,step,duration} = await import('../src/content.mjs');
  const {choose,plan} = await import('./pilot.mjs');
  const canvas=createCanvas(300,187);
  canvas.clientWidth=1280;
  canvas.clientHeight=800;
  const r=new Renderer(canvas);
  for (const [key,file] of Object.entries(renderFiles)) r.assets[key]=await loadImage('assets/'+file);
  for (const stage of stages) {
    const scene = r.assets['arena'+stage.id];
    assert.equal(scene.width,864);
    assert.equal(scene.height,576);
  }
  const verifyAtlas = (image, columns, rows, width, height) => {
    assert.equal(image.width,columns*width);
    assert.equal(image.height,rows*height);
    const sample = createCanvas(width,height).getContext('2d');
    for (let i=0;i<columns*rows;i++) {
      sample.clearRect(0,0,width,height);
      sample.drawImage(image,(i%columns)*width,Math.floor(i/columns)*height,width,height,0,0,width,height);
      const alpha = sample.getImageData(0,0,width,height).data;
      assert.ok(alpha.some((value,j)=>j%4===3 && value>120),'empty cell '+i);
      assert.equal(alpha[3],0,'opaque corner '+i);
    }
  };
  verifyAtlas(r.assets.fauna,4,3,atlasCell,atlasCell);
  verifyAtlas(r.assets.portraits,4,3,atlasCell,atlasCell);
  verifyAtlas(r.assets.landmarks,3,3,112,108);
  const game=new Expedition({seed:404});
  let camera=r.draw(game,false);
  assert.equal(camera.width,598);
  let input;
  const times=[];
  let peak=0;
  for(let i=0;i<60*420;i++) {
    if(game.mode==='level') game.choose(choose(game.choices,game.player.hp));
    if(game.mode!=='play') break;
    if(i%7===0) input=plan(game);
    const before=performance.now();
    game.update(step,input,camera);
    if(i%8===0 && game.time>=238) {
      r.draw(game,false);
      times.push(performance.now()-before);
    }
    peak=Math.max(peak,game.enemies.length);
    game.events.length=0;
  }
  assert.equal(game.mode,'won');
  assert.ok(game.time>duration);
  assert.ok(game.boss.second);
  const pixels=r.ctx.getImageData(0,0,canvas.width,canvas.height).data;
  assert.ok(pixels.some((channel,i)=>i%4!==3 && channel>145));
  times.sort((a,b)=>a-b);
  console.log({result:game.mode, gameSeconds:game.time.toFixed(2), kills:game.kills, peakEnemies:peak,
    framesMeasured:times.length, p95ms:times[Math.ceil(times.length*.95)-1].toFixed(2)});
  const heavy=new Expedition({seed:404});
  heavy.nextWave=Infinity;
  heavy.arsenal=Object.fromEntries(['salt','bell','blade','lantern','harpoon','mine'].map(id=>[id,3]));
  for(let i=0;i<225;i++) {
    const angle=heavy.random()*Math.PI*2;
    const d=55+heavy.random()*160;
    heavy.spawn('brute',heavy.player.x+Math.cos(angle)*d,heavy.player.y+Math.sin(angle)*d);
  }
  assert.equal(heavy.enemies.length,225);
  heavy.update(step);
  r.draw(heavy,true);
  assert.ok(heavy.enemies.length<=225);
  console.log('OK · 225 enemies rendered with reduced effects');
  const signatures = new Set();
  for (const stage of stages) {
    const sample=new Expedition({stage:stage.id,character:stage.id,mode:'free',rival:true,seed:404});
    sample.time=sample.duration;
    sample.update(step);
    sample.boss.x=sample.player.x+70;
    sample.boss.y=sample.player.y+32;
    sample.boss.timer=0;
    sample.update(step);
    r.draw(sample,false,true);
    signatures.add(canvas.toBuffer('image/png').toString('base64'));
  }
  assert.equal(signatures.size,10);
  console.log('OK · all 10 stages render distinct frames with cast, bosses and high-contrast HUD cues');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
