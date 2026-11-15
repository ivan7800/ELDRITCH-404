import test from 'node:test';
import assert from 'node:assert/strict';
import { stages, bestiary, enemies, weapons, fieldUpgrades, relics, playModes, investigators, stageWaves, step } from '../src/content.mjs';
import { achievements, bonuses, buy, newProgress, resolveStory, stageUnlocked } from '../src/campaign.mjs';
import { Expedition } from '../src/simulation.mjs';
import { fresh, record, restore, suspend, validate } from '../src/storage.mjs';
import { choose, plan } from './pilot.mjs';

function play(game, limit) {
  let direction;
  for (let tick=0;tick<limit*60;) {
    if (game.mode==='level') game.choose(choose(game.choices,game.player.hp));
    if (game.mode!=='play') break;
    if (tick++%7===0) direction=plan(game);
    game.update(step,direction);
    game.events.length=0;
  }
}
test('production catalog links are valid and reachable',()=>{
  assert.equal(investigators.length,12);
  assert.equal(stages.length,10);
  assert.equal(relics.length,30);
  assert.equal(fieldUpgrades.length,120);
  assert.equal(Object.keys(weapons).length,60);
  assert.equal(bestiary.length,45);
  assert.equal(achievements.length,40);
  assert.equal(Object.keys(playModes).length,7);
  const bosses=stages.flatMap(stage=>[stage.main,stage.optional]);
  assert.equal(new Set(bosses).size,20);
  assert.ok(bosses.every(id=>enemies[id].boss));
  assert.ok(investigators.every(item=>weapons[item.weapon]&&!weapons[item.weapon].evolves));
  const waves=new Set(stages.flatMap(stage=>stageWaves(stage).flatMap(wave=>wave.types)));
  assert.ok(bestiary.every(id=>waves.has(id)));
});
test('full campaign from a clean profile, with purchased progression and a persistent ending',()=>{
  let profile=fresh();
  for (const stage of stages) {
    assert.ok(stageUnlocked(profile.progress,stage.id));
    const game=new Expedition({mode:'story',stage:stage.id,seed:404+stage.id,difficulty:'story',
      perks:bonuses(profile.progress),veteran:profile.stats.veteran});
    play(game,650);
    assert.equal(game.mode,'won','stage '+stage.id+' at '+game.time);
    assert.equal(game.boss.kind,stage.main);
    record(profile,game);
    profile=validate(JSON.parse(JSON.stringify(profile)));
    assert.equal(profile.progress.pending.stage,stage.id);
    resolveStory(profile.progress,stage.id<9?'save':'seal');
    buy(profile.progress,['power','vitality','guard','reach','speed'][stage.id%5]);
  }
  assert.deepEqual(profile.progress.endings,['dawn']);
  assert.equal(profile.progress.relics.length,10);
  assert.equal(profile.stats.wins,10);
});
for (const [choice,prior,corruption,expected] of [
  ['seal','save',0,'dawn'],['seal','anchor',0,'empty'],['rule','anchor',2,'lead'],
  ['rule','anchor',3,'customs'],['merge','mark',0,'both'],['merge','save',0,'voice']
]) test('ending '+expected,()=>{
  const p=newProgress();
  p.pending={stage:9,corruption}; p.choices={0:prior,1:prior,2:prior};
  assert.equal(resolveStory(p,choice).ending,expected);
  assert.equal(p.pending,null);
  assert.equal(resolveStory(p,choice),null);
});
test('all 20 bosses telegraph an attack and transition at half health',()=>{
  for (const stage of stages) for (const rival of [false,true]) {
    const game=new Expedition({stage:stage.id,mode:'free',rival,seed:93});
    game.time=game.duration;
    game.update(step);
    game.boss.timer=0;
    game.update(step);
    assert.equal(game.boss.action,'tell');
    game.boss.timer=0;
    game.update(step);
    assert.ok(game.hazards.live.length>0);
    game.boss.hp=game.boss.maxHp*.47;
    game.update(step);
    assert.equal(game.boss.second,true);
  }
});
test('expanded arsenal attacks on all families and supports every evolution recipe',()=>{
  for (const [id,weapon] of Object.entries(weapons)) {
    if (!weapon.family) continue;
    const game=new Expedition({mode:'free',seed:22,openArsenal:9});
    game.arsenal={[id]:weapon.evolves?1:3};
    game.nextWave=Infinity;
    const enemy=game.spawn('boss',game.player.x+(weapon.family==='trap'?-35:48),game.player.y);
    for (let tick=0;tick<150;tick++) game.update(step);
    assert.ok(enemy.hp<enemy.maxHp,id);
    if (weapon.evolves) {
      game.arsenal={[weapon.evolves]:3}; game.passives={[weapon.recipe]:1}; game.level=3; game.xp=game.goal;
      game.offerUpgrades();
      assert.ok(game.choices.includes(id));
      assert.ok(game.choose(id));
      assert.equal(game.arsenal[weapon.evolves],undefined);
    }
  }
});
test('survival, quick, nightmare, challenge and free runs can finish, endless queues bosses again',()=>{
  for (const mode of Object.keys(playModes).filter(id=>id!=='story')) {
    const game=new Expedition({mode,seed:404,difficulty:mode==='challenge'?'standard':'story'});
    play(game,mode==='endless'?440:530);
    if (mode==='endless') {
      assert.ok(game.clearCount>=2);
      assert.equal(game.mode,'play');
      game.finish('retired');
      const profile=fresh(); record(profile,game);
      assert.ok(profile.progress.records.endless.time>=439);
    } else {
      assert.equal(game.mode,'won',mode);
      if (mode==='challenge') assert.equal(Object.keys(game.arsenal).length,1);
      if (mode==='free') {
        const profile=fresh(); record(profile,game);
        assert.equal(profile.progress.credits,0);
        assert.deepEqual(profile.progress.clears,[]);
      }
    }
  }
});
test('snapshot resumes RNG and dynamic state, profile v1 migrates without losing statistics',()=>{
  const game=new Expedition({mode:'story',seed:404});
  for (let i=0;i<240;i++) game.update(step,{x:i%3===0?1:0});
  const copy=restore(JSON.parse(JSON.stringify(suspend(game))),Expedition);
  for (let i=0;i<100;i++) { game.update(step,{x:1}); copy.update(step,{x:1}); }
  assert.deepEqual(JSON.parse(JSON.stringify(suspend(copy))),JSON.parse(JSON.stringify(suspend(game))));
  const profile=validate({version:1,settings:{language:'en'},stats:{runs:3,wins:1,veteran:true},journal:['boss','win']});
  assert.equal(profile.version,2);
  assert.equal(profile.settings.language,'en');
  assert.equal(profile.stats.veteran,true);
  assert.deepEqual(profile.journal,['boss','win']);
  assert.deepEqual(profile.progress.clears,[]);
});
