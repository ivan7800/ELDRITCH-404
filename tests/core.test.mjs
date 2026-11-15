import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition } from '../src/simulation.mjs';
import { arena, duration, step, weapons, stages, investigators } from '../src/content.mjs';
import { Pool, SpatialGrid } from '../src/math.mjs';
import { fresh, save, load, key, record, validate, suspend, restore } from '../src/storage.mjs';
import { choose, plan } from './pilot.mjs';

test('normalized diagonal movement, analog input and boundaries', () => {
  const g = new Expedition({seed:404});
  const from = {...g.player};
  g.update(step,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(g.player.x-from.x,g.player.y-from.y)-118*step)<1e-8);
  const prior = g.player.x;
  g.update(step,{x:.5});
  assert.ok(Math.abs(g.player.x-prior-59*step)<1e-8);
  g.player.x = arena.width-24;
  g.update(step,{x:1});
  assert.equal(g.player.x,arena.width-24);
});
test('all investigators expose a bilingual signature trait and traits affect play', () => {
  assert.equal(investigators.length,12);
  assert.ok(investigators.every(person=>person.trait?.name?.length===2&&person.trait?.desc?.length===2));
  const guarded = new Expedition({mode:'free',character:4,seed:18});
  guarded.hurt(100);
  assert.equal(guarded.player.hp,guarded.player.maxHp-92);
  const dreamer = new Expedition({mode:'free',character:9,seed:18});
  dreamer.update(step,{x:1,dash:true});
  assert.equal(dreamer.player.dashCooldown,2.7);
  const amphibia = new Expedition({mode:'free',character:6,seed:18});
  amphibia.changeSanity(-20);
  assert.equal(amphibia.sanity,68);
  const prophet = new Expedition({mode:'free',character:11,seed:18});
  prophet.changeSanity(-20);
  assert.ok(Math.abs(prophet.sanity-46.4)<1e-9);
});
test('weapon fire triggers a resumable investigator attack pose', () => {
  const game=new Expedition({mode:'free',seed:77});
  game.arsenal={salt:1};
  game.spawn('brute',game.player.x+48,game.player.y);
  game.update(step);
  assert.equal(game.player.attackKind,'salt');
  assert.ok(game.player.attack>0);
  const resumed=restore(JSON.parse(JSON.stringify(suspend(game))),Expedition);
  assert.equal(resumed.player.attackKind,'salt');
  assert.equal(resumed.player.attack,game.player.attack);
});
test('contact, dodge, iframes and loss', () => {
  const g = new Expedition({seed:404});
  const p = g.player;
  g.spawn('brute',p.x,p.y);
  g.update(step,{dash:true});
  assert.equal(p.hp,100);
  p.dash = 0;
  g.update(step);
  assert.equal(p.hp,78);
  g.update(step);
  assert.equal(p.hp,78);
  p.hurt = 0; p.hp = 1;
  g.update(step);
  assert.equal(g.mode,'lost');
  const at = g.time;
  g.update(step);
  assert.equal(g.time,at);
});
test('kill grants experience exactly once and upgrade suspends simulation', () => {
  const g = new Expedition({seed:404});
  const e = g.spawn('drowned',g.player.x,g.player.y);
  g.strike(e,100); g.strike(e,100);
  assert.equal(g.kills, 1);
  g.update(step);
  assert.equal(g.mode,'level');
  assert.deepEqual(g.choices,['bell','harpoon','salt']);
  const time = g.time;
  g.update(step);
  assert.equal(g.time,time);
  assert.equal(g.choose('bad'),false);
  assert.equal(g.choose('bell'),true);
  assert.equal(g.arsenal.bell,1);
  assert.equal(g.xp,0);
});
test('six weapons each damage a target in their intended range', () => {
  for (const [id, weapon] of Object.entries(weapons)) {
    if (weapon.evolves || weapon.family) continue;
    const g = new Expedition({seed:404});
    g.arsenal = {[id]:1};
    g.nextWave = Infinity;
    const p = g.player;
    const enemy = g.spawn('brute',p.x+(id==='mine'?-32:48),p.y);
    for (let i=0;i<60;i++) g.update(step);
    assert.ok(enemy.hp<enemy.maxHp,id);
  }
});
test('both evolution recipes are surfaced and permanently replace their predecessor', () => {
  const g = new Expedition({seed:404});
  g.level = 6; g.arsenal={salt:3,bell:3};
  g.xp=g.goal;
  g.offerUpgrades();
  assert.ok(!g.choices.includes('tempest') && !g.choices.includes('choir'));
  g.passives={resin:1,prayer:1};
  g.offerUpgrades();
  assert.deepEqual(g.choices.slice(0,2),['tempest','choir']);
  assert.ok(g.choose('tempest'));
  assert.equal(g.arsenal.salt,undefined);
  g.xp=g.goal; g.offerUpgrades();
  assert.ok(!g.choices.includes('salt'));
  assert.ok(g.choose('choir'));
  assert.deepEqual(g.arsenal,{tempest:1,choir:1});
});
test('ritual cancel, one-time cost, curse strength, mutation and restoration', () => {
  const g = new Expedition({seed:404});
  g.player.x=1269; g.player.y=373;
  g.update(step,{interact:true});
  assert.equal(g.mode,'ritual');
  g.resolveRitual(false);
  assert.equal(g.sanity,100);
  g.update(step,{interact:true}); g.resolveRitual(true);
  assert.equal(g.sanity,52);
  assert.equal(g.corruption,2);
  assert.equal(g.mutation,true);
  assert.equal(g.nearestSite(),undefined);
  const enemy=g.spawn('brute',0,0);
  assert.ok(enemy.hp>88);
  g.player.x=459; g.player.y=346; g.player.hp=35;
  g.openRitual(); g.resolveRitual(true);
  assert.equal(g.sanity,74);
  assert.equal(g.player.hp,77);
});
test('boss spawns on cue, emits aimed seals and transitions at half health', () => {
  const g = new Expedition({seed:404});
  g.time=duration-step/2;
  g.update(step);
  assert.ok(g.boss);
  assert.equal(g.phase(),'boss');
  g.boss.sequence=1; g.boss.timer=0;
  g.update(step);
  assert.equal(g.boss.action,'tell');
  assert.equal(g.hazards.live.filter(h=>h.kind==='seal').length,2);
  g.boss.hp=Math.floor(g.boss.maxHp*.48);
  g.update(step);
  assert.ok(g.boss.second);
  assert.ok(g.events.some(e=>e.type==='boss-phase'));
  assert.equal(g.boss.action,'tell');
  assert.equal(g.boss.attack,'seals');
  assert.equal(g.boss.tellSecond,false);
  assert.equal(g.hazards.live.filter(h=>h.kind==='seal').length,2);
});
test('spatial index resets and pools reuse resources at configured bounds', () => {
  const pool = new Pool(1);
  const enemy = pool.add({x:10,y:20,hp:1});
  assert.equal(pool.add({}),undefined);
  const grid = new SpatialGrid();
  grid.reset(pool.live);
  assert.deepEqual([...grid.near(12,12,30)],[enemy]);
  pool.remove(0);
  grid.reset(pool.live);
  assert.deepEqual([...grid.near(12,12,30)],[]);
  assert.equal(pool.add({x:8,y:1,hp:3}),enemy);
});
test('guardado versionado, recuperación y desbloqueo de veterano', () => {
  const contents = new Map();
  const storage = { getItem: k=>contents.get(k), setItem:(k,v)=>contents.set(k,v) };
  const profile=fresh();
  assert.ok(save(storage,profile));
  const game=new Expedition();
  game.usedSites.add('blood'); game.finish('won'); game.kills=15;
  record(profile,game);
  assert.ok(save(storage,profile));
  assert.equal(load(storage).stats.veteran,true);
  assert.deepEqual(load(storage).journal,['blood','win']);
  contents.set(key,'broken json');
  assert.deepEqual(load(storage),fresh());
  assert.throws(()=>validate({...profile,version:999}));
});
for (const seed of [404,12,1997,1138]) {
  test('completed unmodified expedition, seed '+seed, () => {
    const game = new Expedition({seed});
    const encountered = new Set();
    let input;
    for (let i=0;i<60*420;i++) {
      if (game.mode==='level') game.choose(choose(game.choices,game.player.hp));
      if (game.mode!=='play') break;
      if (i%7===0) input=plan(game);
      game.update(step,input);
      for (const e of game.enemies) encountered.add(e.kind);
      game.events.length=0;
    }
    assert.equal(game.mode,'won');
    assert.equal(encountered.size,7);
    assert.ok(game.time>duration);
    assert.ok(game.boss.second);
    assert.ok(game.boss.sequence>=3);
    assert.ok(game.level>12);
  });
}

test('lost dispatch rewards once and survives a suspended run and profile validation', () => {
  const game=new Expedition({stage:3,mode:'story',seed:321});
  const site=stages[3].sites.find(item=>item.ritual==='signal');
  game.player.x=site.x; game.player.y=site.y; game.player.hp-=22;
  game.openRitual();
  assert.equal(game.ritual,'signal');
  game.resolveRitual(true);
  assert.equal(game.player.hp,game.player.maxHp-4);
  assert.equal(game.xp,9);
  assert.equal(game.sanity,100-game.character.sanityCost);
  assert.ok(game.usedSites.has('signal3'));
  game.openRitual();
  assert.equal(game.mode,'play');
  const resumed=restore(JSON.parse(JSON.stringify(suspend(game))),Expedition);
  assert.ok(resumed.usedSites.has('signal3'));
  resumed.finish('lost');
  const profile=fresh(); record(profile,resumed);
  profile.progress.supplies = 1;
  const restoredProfile = validate(JSON.parse(JSON.stringify(profile)));
  assert.ok(restoredProfile.journal.includes('signal3'));
  assert.equal(restoredProfile.progress.supplies,1);
  assert.equal(validate({...profile,progress:{}}).progress.supplies,0);
  const challenge = new Expedition({stage:3,mode:'challenge',seed:321});
  Object.assign(challenge.player,{x:site.x,y:site.y});
  assert.equal(challenge.nearestSite(),undefined);
});

test('Innsmouth offers an early loadout choice and a costlier beacon at rising tide', () => {
  const opening = new Expedition({mode:'story',seed:404});
  while (opening.mode==='play' && opening.time<8) opening.update(step);
  assert.equal(opening.mode,'level');
  assert.deepEqual(opening.choices,['bell','harpoon','salt']);

  const beacon = stages[0].sites.find(site=>site.ritual==='gather');
  for (const flooded of [false,true]) {
    const game = new Expedition({mode:'story',seed:404});
    Object.assign(game.player,{x:beacon.x,y:beacon.y});
    game.sanity = 80;
    game.time = flooded ? game.duration*.2 : 2;
    game.openRitual();
    game.resolveRitual(true);
    assert.equal(game.xp,flooded?31:17);
    assert.equal(game.sanity,flooded?46:57);
    assert.equal(game.corruption,flooded?2:1);
    assert.equal(game.events.some(e=>e.type==='sanity-low'),flooded);
    game.openRitual();
    assert.equal(game.mode,'play');
  }
});

test('the Sacristan telegraphs the undertow gap and restores it with a suspended expedition', () => {
  const game = new Expedition({mode:'story',seed:404});
  game.boss = game.spawn('boss',game.player.x+150,game.player.y);
  Object.assign(game.boss,{hp:game.boss.maxHp*.49,sequence:0,timer:0});
  game.bossPattern(game.boss,150);
  game.boss.timer = 0;
  game.bossPattern(game.boss,150);
  assert.equal(game.boss.attack,'surge');
  assert.equal(game.hazards.live.length,6);
  const gap = game.player.y-48;
  assert.ok(game.hazards.live.every(h=>h.x===game.player.x && Math.abs(h.y-gap)>=48 && h.delay>=.8));
  const resumed = restore(JSON.parse(JSON.stringify(suspend(game))),Expedition);
  assert.equal(resumed.boss.attack,'surge');
  resumed.player.y = gap;
  const hp = resumed.player.hp;
  for (let i=0;i<84;i++) resumed.updateHazards(step);
  assert.equal(resumed.player.hp,hp);
  assert.equal(resumed.hazards.live.length,0);
});

test('Innsmouth harpoon prefers a line of enemies and the bell makes physical space', () => {
  const game = new Expedition({mode:'story',seed:404});
  const {x,y} = game.player;
  const nearest = game.spawn('brute',x,y+34);
  const line = [65,112,158].map(offset=>game.spawn('brute',x+offset,y));
  game.grid.reset(game.enemies);
  game.arsenal = {harpoon:1};
  game.fireWeapons(step);
  assert.equal(game.shots.live.length,1);
  assert.ok(game.shots.live[0].vx>490);
  for (let i=0;i<24;i++) game.updateShots(step);
  assert.ok(line.every(enemy=>enemy.hp<enemy.maxHp));
  assert.equal(nearest.hp,nearest.maxHp);

  game.arsenal = {bell:1};
  game.fireWeapons(step);
  for (let i=0;i<28;i++) game.updateEffects(step);
  assert.ok(nearest.y>=y+51);
  assert.ok(nearest.stun>0);
});
