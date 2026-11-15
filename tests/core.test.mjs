import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition } from '../src/simulation.mjs';
import { arena, duration, step, weapons } from '../src/content.mjs';
import { Pool, SpatialGrid } from '../src/math.mjs';
import { fresh, save, load, key, record, validate } from '../src/storage.mjs';
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
