import { enemies, investigators, relics, stages, weapons } from './content.mjs';

export const archive = {
  vitality: {name:['Enfermería','Infirmary'],desc:['+8 de salud inicial por grado.','+8 starting health per rank.']},
  speed: {name:['Cartografía','Cartography'],desc:['+4 % de velocidad por grado.','+4% movement speed per rank.']},
  power: {name:['Armería','Armoury'],desc:['+6 % de daño por grado.','+6% damage per rank.']},
  reach: {name:['Recuperación','Salvage'],desc:['+8 de alcance de recogida por grado.','+8 pickup reach per rank.']},
  guard: {name:['Amparos','Wards'],desc:['+4 % de reducción de daño por grado.','+4% damage reduction per rank.']}
};
export const endings = {
  dawn: [['La costa del amanecer','The Dawn Shore'],['La lengua de tierra emerge. A ambos lados, las familias pronuncian los nombres que alcanzaste a salvar.','The spit of land emerges. Families on both shores speak the names you managed to save.']],
  empty: [['La dársena vacía','The Empty Dock'],['El cierre devuelve el puerto. Nadie reconoce los nombres de los que dejaste en la otra orilla.','The seal restores the harbour. No one recognises the names you left on the far shore.']],
  lead: [['El faro de plomo','The Lead Lighthouse'],['Las anclas sostienen el paso. Cada madrugada, dos barcos idénticos encienden el mismo farol.','The anchors hold the passage. At dawn, two identical ships light the same lantern.']],
  customs: [['La aduana del otro lado','Customs Beyond'],['Las copias te entregan el libro de guardia. Dejan la puerta abierta desde su lado.','The copies hand you the watch book. They leave the door open on their side.']],
  both: [['El habitante de las dos aguas','Dweller of Both Waters'],['Despiertas con dos memorias y un solo nombre. Reconoces los pasos de quienes te esperan en ambas orillas.','You wake with two memories and one name. You recognise the footsteps of those waiting on both shores.']],
  voice: [['La voz bajo el muelle','The Voice Beneath the Quay'],['La expedición vuelve a zarpar. Desde debajo de las tablas oyes que alguien te imita al despedirse.','The expedition sails again. Under the planks, you hear someone imitate your farewell.']]
};
export const finalChoices = {
  seal: ['Cerrar el paso','Seal the passage'],
  rule: ['Controlar la grieta','Control the rift'],
  merge: ['Fundir las memorias','Merge the memories']
};
export const decisions = {
  save: ['Poner a salvo al duplicado','Shelter the duplicate'],
  anchor: ['Clavar un ancla entre orillas','Drive an anchor between shores'],
  mark: ['Conservar la mutación en el cuaderno','Record the mutation in the journal']
};
export const dispatches = [
  ['La operadora pide saber si hay heridos. Detrás de ti, alguien responde con tu voz.','The wireless operator asks whether anyone is hurt. Behind you, someone answers in your voice.'],
  ['El hombre a quien pertenece la última firma no quiere que la borres. Es el único lugar donde figura su nombre.','The man who signed last asks you not to erase it. It is the only place his name appears.'],
  ['La organista conserva una silla vacía. En la partitura, la nota que falta tiene el mismo nombre que tú.','The organist keeps a chair empty. In the score, the missing note bears your name.'],
  ['La primera buza te ofrece la mitad de su aire. Durante el ascenso se niega a decirte de qué lado aprendió a nadar.','The first diver offers you half her air. On the way up she refuses to say on which side she learned to swim.'],
  ['La arquitecta te pide que marques una ruta habitable. Por encima de su hombro, una familia espera junto a una puerta dibujada con tiza.','The architect asks you to mark a habitable route. Over her shoulder, a family waits beside a door drawn in chalk.'],
  ['Al pie del último árbol hay dos platos de estaño. La guardabosques ha dejado comida para alguien que no recuerda.','Two tin plates sit beneath the last tree. The ranger has left food for someone she cannot remember.'],
  ['Paciente Cero te da la llave de su habitación. Dentro hay dos camas, una de ellas hecha para ti.','Patient Zero gives you his room key. Inside are two beds, one made up for you.'],
  ['La archivera estampa el sello en el margen. Te advierte que las personas que anotes seguirán existiendo cuando cierres el libro.','The archivist stamps the margin. She warns that the people you write down will still exist when you close the book.'],
  ['El custodio no te suplica. Te entrega una lista firmada y espera a que leas todos los nombres.','The custodian does not plead. He hands you a signed list and waits for you to read every name.'],
  ['En la radio oyen el mar desde ambos lados. La operadora deja la línea abierta cuando comprende que vas a elegir.','The radio carries the sea from both shores. The operator leaves the line open when she realises you are about to choose.']
];
export function newProgress() {
  return { clears: [], choices: {}, endings: [], pending: null, credits: 0, tree: {}, relics: [], equipped: '',
    bosses: [], bestiary: [], evolutionLog: [], records: {}, achievements: [], hunter: [] };
}
export function stageUnlocked(progress, stage) {
  return stage === 0 || progress.clears.includes(stage-1);
}
export function investigatorUnlocked(progress, id) {
  const character = investigators[id];
  return character && (!character.unlock || progress.clears.includes(character.unlock-1));
}
export function archiveCost(rank) { return 16 + rank * 14; }
export function buy(progress, id) {
  const rank = progress.tree[id] ?? 0;
  const cost = archiveCost(rank);
  if (!Object.hasOwn(archive,id) || rank >= 3 || progress.credits < cost) return false;
  progress.credits -= cost;
  progress.tree[id] = rank + 1;
  return true;
}
export function bonuses(progress) {
  const values = {vitality:0,speed:0,power:0,reach:0,guard:0};
  const scale = {vitality:8,speed:.04,power:.06,reach:8,guard:.04};
  for (const id of Object.keys(values)) values[id] = (progress.tree[id] ?? 0)*scale[id];
  const relic = relics.find(item=>item.id===progress.equipped && progress.relics.includes(item.id));
  if (relic) values[relic.stat] += relic.value;
  return values;
}
export const achievements = [];
for (const stage of stages) {
  achievements.push({id:'stage'+stage.id,name:stage.name, test:p=>p.clears.includes(stage.id)});
  achievements.push({id:'hunter'+stage.id,name:enemies[stage.optional].name,test:p=>p.hunter.includes(stage.id)});
}
for (const [id,[name]] of Object.entries(endings)) {
  achievements.push({id:'ending-'+id,name:[name,endings[id][0][1]],test:p=>p.endings.includes(id)});
}
for (const count of [1, 3, 6, 10]) {
  achievements.push({id:'ritual'+count,name:['Recetas descubiertas · '+count,'Recipes discovered · '+count],test:p=>p.evolutionLog.length>=count});
  achievements.push({id:'relics'+count,name:['Reliquias recuperadas · '+count,'Relics recovered · '+count],test:p=>p.relics.length>=count});
}
for (const count of [6, 15, 30, 45]) {
  achievements.push({id:'beasts'+count,name:['Criaturas registradas · '+count,'Creatures recorded · '+count],test:p=>p.bestiary.length>=count});
}
for (const minutes of [5, 15]) {
  achievements.push({id:'endure'+minutes,name:['Resistir '+minutes+' min en Infinito','Survive '+minutes+' min in Endless'],test:p=>(p.records.endless?.time??0)>=minutes*60});
}
export function refreshAchievements(progress) {
  progress.achievements = achievements.filter(item=>item.test(progress)).map(item=>item.id);
}
export function settle(progress, game) {
  const won = game.mode === 'won';
  const old = progress.records[game.playMode] ?? {time:0,kills:0,wins:0};
  progress.records[game.playMode] = {time:Math.max(old.time,Math.floor(game.time)),kills:Math.max(old.kills,game.kills),wins:old.wins+Number(won)};
  if (game.playMode === 'free') return;
  progress.credits += Math.min(25,Math.floor(game.kills/36))+(won ? 12+game.stage.id*2 : 0);
  progress.bestiary = [...new Set([...progress.bestiary,...game.defeatedKinds])].filter(id=>enemies[id] && !enemies[id].boss);
  progress.bosses = [...new Set([...progress.bosses,...game.defeatedKinds])].filter(id=>enemies[id]?.boss);
  progress.evolutionLog = [...new Set([...progress.evolutionLog,...Object.keys(game.arsenal).filter(id=>weapons[id].evolves)])];
  if (won || game.defeatedKinds.has(game.stage.optional)) {
    const stage = game.stage.id;
    if (game.defeatedKinds.has(game.stage.optional)) progress.hunter = [...new Set([...progress.hunter,stage])];
    const pool = [relics[stage*3],relics[stage*3+1],relics[stage*3+2]];
    const relic = pool.find(item=>!progress.relics.includes(item.id));
    if (relic) progress.relics.push(relic.id);
  }
  if (won && game.playMode === 'story' && game.bossId === game.stage.main) {
    progress.clears = [...new Set([...progress.clears,game.stage.id])];
    progress.pending = {stage:game.stage.id,corruption:game.corruption};
  }
  refreshAchievements(progress);
}
export function resolveStory(progress, choice) {
  if (!progress.pending) return null;
  const {stage,corruption} = progress.pending;
  let result = null;
  if (stage === 9) {
    if (!Object.hasOwn(finalChoices,choice)) return null;
    const votes = Object.values(progress.choices);
    const count = value=>votes.filter(item=>item===value).length;
    result = {seal:count('save')>=3?'dawn':'empty',rule:count('anchor')>=3&&corruption<=2?'lead':'customs',
      merge:count('mark')>=3?'both':'voice'}[choice];
    progress.endings = [...new Set([...progress.endings,result])];
  } else {
    if (!Object.hasOwn(decisions,choice)) return null;
    progress.choices[stage] = choice;
  }
  progress.pending = null;
  refreshAchievements(progress);
  return {ending:result,stage};
}
