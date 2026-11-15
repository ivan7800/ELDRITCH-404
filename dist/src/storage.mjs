import { defaultKeys, defaultPad, enemies, playModes, relics, stages, upgrades, weapons } from './content.mjs';
import { archive, decisions, endings, newProgress, refreshAchievements, settle } from './campaign.mjs';
export const key = 'eldritch404.profile';
export const suspendedKey = 'eldritch404.expedition';
export function fresh() {
  return { version: 2, settings: { language: 'es', reduced: false, difficulty: 'standard', music: .45, fx: .55, deadzone: .19, large: false, contrast:false,
      keys:{...defaultKeys},pad:{...defaultPad} },
    stats: { runs: 0, wins: 0, kills: 0, best: 0, veteran: false }, journal: [], last: null, progress: newProgress() };
}
const number = (v, fallback, max = 1, min = 0) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min,v)) : fallback;
export function validate(data) {
  if (!data || ![1,2].includes(data.version) || typeof data.settings !== 'object' || !data.settings || !data.stats) throw Error('Unsupported profile');
  const d = fresh();
  const s = data.settings;
  d.settings.language = s.language === 'en' ? 'en' : 'es';
  d.settings.difficulty = s.difficulty === 'story' ? 'story' : 'standard';
  d.settings.reduced = s.reduced === true;
  d.settings.large = s.large === true;
  d.settings.contrast = s.contrast === true;
  for (const id of Object.keys(defaultKeys)) if (/^(Key[A-Z]|Space|Escape|Enter|Digit[0-9]|ShiftLeft|ControlLeft)$/.test(s.keys?.[id]??'')) d.settings.keys[id]=s.keys[id];
  for (const id of Object.keys(defaultPad)) {
    const button=Number(s.pad?.[id]);
    if (Number.isInteger(button)&&button>=0&&button<=11) d.settings.pad[id]=button;
  }
  d.settings.music = number(s.music,.45);
  d.settings.fx = number(s.fx,.55);
  d.settings.deadzone = number(s.deadzone,.19,.5,.05);
  for (const field of ['runs','wins','kills','best']) d.stats[field] = Math.floor(number(data.stats[field],0,Number.MAX_SAFE_INTEGER));
  d.stats.wins = Math.min(d.stats.wins,d.stats.runs);
  d.stats.veteran = data.stats.veteran === true && d.stats.wins > 0;
  if (Array.isArray(data.journal)) d.journal = [...new Set(data.journal.filter(id => ['heal','gather','blood','boss','win','tempest','choir'].includes(id)))];
  if (data.last && ['won','lost','retired'].includes(data.last.mode)) {
    const { mode, time, kills, level } = data.last;
    d.last = { mode, time: number(time,0,86400), kills: number(kills,0,1000000), level: number(level,1,10000,1) };
  }
  const progress = d.progress;
  const p = data.progress ?? {};
  const ids = (value,accept) => Array.isArray(value) ? [...new Set(value.filter(accept))] : [];
  const stageId = id => Number.isInteger(id) && id>=0 && id<stages.length;
  progress.clears = ids(p.clears,stageId);
  progress.hunter = ids(p.hunter,stageId);
  progress.bestiary = ids(p.bestiary,id=>Object.hasOwn(enemies,id)&&!enemies[id].boss);
  progress.bosses = ids(p.bosses,id=>Object.hasOwn(enemies,id)&&enemies[id].boss);
  progress.evolutionLog = ids(p.evolutionLog,id=>Object.hasOwn(weapons,id)&&weapons[id].evolves);
  progress.relics = ids(p.relics,id=>relics.some(r=>r.id===id));
  progress.endings = ids(p.endings,id=>Object.hasOwn(endings,id));
  progress.equipped = progress.relics.includes(p.equipped) ? p.equipped : '';
  progress.credits = Math.floor(number(p.credits,0,1e7));
  for (const id of Object.keys(archive)) {
    const rank=Math.floor(number(p.tree?.[id],0,3));
    if (rank) progress.tree[id]=rank;
  }
  for (const id of progress.clears) if (Object.hasOwn(decisions,p.choices?.[id]) && id<9) progress.choices[id] = p.choices[id];
  if (p.pending && progress.clears.includes(p.pending.stage)) progress.pending = {stage:p.pending.stage,corruption:number(p.pending.corruption,0,20)};
  for (const id of Object.keys(playModes)) if (p.records?.[id]) {
    const row = p.records[id];
    progress.records[id] = {time:number(row.time,0,1e7),kills:number(row.kills,0,1e8),wins:number(row.wins,0,1e6)};
  }
  refreshAchievements(progress);
  return d;
}
export function load(storage) {
  for (const name of [key,key+'.backup']) {
    try {
      const value = storage.getItem(name);
      if (value) return validate(JSON.parse(value));
    } catch { /* try the backup */ }
  }
  return fresh();
}
export function save(storage,data) {
  try {
    const prior = storage.getItem(key);
    if (prior) {
      try { validate(JSON.parse(prior)); storage.setItem(key+'.backup',prior); } catch { /* preserve the last valid backup */ }
    }
    storage.setItem(key,JSON.stringify(validate(data)));
    return true;
  } catch { return false; }
}
export function record(profile,game) {
  profile.stats.runs++;
  profile.stats.wins += game.mode === 'won' ? 1 : 0;
  profile.stats.kills += game.kills;
  profile.stats.best = Math.max(profile.stats.best,Math.floor(game.time));
  profile.stats.veteran ||= game.mode === 'won' && game.playMode!=='free';
  const discoveries = [...game.usedSites];
  if (game.boss) discoveries.push('boss');
  if (game.mode === 'won') discoveries.push('win');
  for (const id of ['tempest','choir']) if (game.arsenal[id]) discoveries.push(id);
  profile.journal = [...new Set([...profile.journal,...discoveries])];
  profile.last = { mode: game.mode, time: game.time, kills: game.kills, level: game.level };
  if (game.expanded) settle(profile.progress,game);
}

const expeditionScalars = ['time','nextWave','bossAt','landmarkTimer','clearCount','sanity','corruption','mutation','level','xp','kills','firstKill','id','mode','ritual'];
export function suspend(game) {
  const state = Object.fromEntries(expeditionScalars.map(id=>[id,game[id]]));
  return {version:1, config:game.config, seed:game.random.state(), state, player:game.player, choices:game.choices, bossId:game.bossId,
    boss:game.boss?.id ?? null, enemies:game.enemies, arsenal:game.arsenal,cooldowns:game.cooldowns,passives:game.passives,
    modifiers:game.modifiers, usedSites:[...game.usedSites],defeated:[...game.defeatedKinds],
    pools:Object.fromEntries(['shots','gems','effects','hazards'].map(id=>[id,game[id].live]))};
}
export function restore(snapshot, Expedition) {
  if (snapshot?.version!==1 || !['play','level','ritual'].includes(snapshot.state?.mode) ||
      !Number.isFinite(snapshot.seed) || !Number.isFinite(snapshot.state.time) ||
      !Number.isFinite(snapshot.player?.hp) || snapshot.player.hp<=0) throw Error('Invalid expedition');
  const config = snapshot.config;
  if (!config || !Object.hasOwn(playModes,config.mode) || !stages[config.stage]) throw Error('Invalid expedition');
  const game = new Expedition({...config,seed:snapshot.seed});
  game.config.seed = config.seed;
  for (const id of expeditionScalars) game[id] = snapshot.state[id];
  const validEntries = (object, table) => Object.fromEntries(Object.entries(object??{}).filter(([id,value])=>Object.hasOwn(table,id)&&Number.isFinite(value)));
  game.arsenal = validEntries(snapshot.arsenal,weapons);
  game.passives = validEntries(snapshot.passives,upgrades);
  game.cooldowns = validEntries(snapshot.cooldowns,weapons);
  game.modifiers = {...snapshot.modifiers};
  game.player = {...snapshot.player};
  game.choices = snapshot.choices.filter(id=>Object.hasOwn(weapons,id)||Object.hasOwn(upgrades,id)).slice(0,3);
  if (!Object.keys(game.arsenal).length || (game.mode==='level' && !game.choices.length)) throw Error('Invalid expedition');
  game.bossId = Object.hasOwn(enemies,snapshot.bossId) && enemies[snapshot.bossId].boss ? snapshot.bossId : game.bossId;
  game.enemies = snapshot.enemies.slice(0,226).filter(e=>Object.hasOwn(enemies,e.kind)&&Number.isFinite(e.hp));
  game.boss = game.enemies.find(e=>e.id===snapshot.boss) ?? null;
  game.usedSites = new Set(snapshot.usedSites.filter(id=>['heal','blood','gather'].includes(id)));
  game.defeatedKinds = new Set(snapshot.defeated.filter(id=>Object.hasOwn(enemies,id)));
  for (const id of ['shots','gems','effects','hazards']) game[id].live = snapshot.pools[id].slice(0,game[id].limit);
  return game;
}
