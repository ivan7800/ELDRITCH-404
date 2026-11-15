import { Expedition } from './simulation.mjs';
import { Renderer } from './render.mjs';
import { Input } from './input.mjs';
import { Sound } from './audio.mjs';
import { load, save, fresh, validate, record, key, suspendedKey, suspend, restore } from './storage.mjs';
import { actorAtlases, creaturePortrait, imageAsset, portraitNotes, sceneFile, defaultKeys, defaultPad, weapons, upgrades, enemies, step, investigators, stages, playModes, relics, bestiary, bossTells, environmentWarnings, expeditionOaths, expeditionTime, harbourWeaponHints, signatures } from './content.mjs';
import { archive, archiveCost, achievements, bonuses, buy, consequences, decisions, dispatches, endings, finalChoices, investigatorUnlocked, resolveStory, stageUnlocked } from './campaign.mjs';
import { clamp } from './math.mjs';

const $ = id => document.getElementById(id);
const app = $('app'), world = $('world'), overlay = $('overlay'), hud = $('hud');
const storage = { getItem: k => localStorage.getItem(k), setItem: (k,v) => localStorage.setItem(k,v),
  removeItem: k => localStorage.removeItem(k) };
let profile = load(storage);
let game, camera, previous, screen = 'home', optionsFrom = 'home', accumulator = 0, noteTimer, padConnected = false;
let selected = {stage:stages.find(item=>!profile.progress.clears.includes(item.id)&&stageUnlocked(profile.progress,item.id))?.id??0,
  character:0,mode:'story',rival:false,length:.75,oath:''};
let ending = null;
let codexTab = 'beasts';
let codexFrom = 'journal';
let starting = false;
let loadoutOpen = false;
const padLabels = ['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS'];
const keyLabel = code => ({Space:tr('Espacio','Space'),Escape:'Esc',ShiftLeft:tr('Mayús','Shift'),ControlLeft:'Ctrl'}[code] ?? code.replace(/^(Key|Digit)/,''));
const promptFor = action => padConnected ? padLabels[profile.settings.pad[action]] : keyLabel(profile.settings.keys[action]);
const nextChapter = () => stages.find(item => !profile.progress.clears.includes(item.id) && stageUnlocked(profile.progress,item.id)) ?? stages.at(-1);
const storyLabel = () => !profile.progress.clears.length ? tr('Comenzar expedición','Begin expedition') :
  profile.progress.endings.length ? tr('Repetir capítulo final','Replay final chapter') : tr('Continuar historia','Continue story');
const arenaArt = stage => imageAsset(sceneFile(stage));
const input = new Input();
const sound = new Sound();
const renderer = new Renderer(world);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const testClock = new URLSearchParams(location.search).get('qa') === '1' && ['localhost','127.0.0.1'].includes(location.hostname);
const samples = [];
const tr = (es,en) => profile.settings.language === 'es' ? es : en;
const loc = pair => pair[profile.settings.language === 'es' ? 0 : 1];
const timeLabel = n => Math.floor(n/60).toString().padStart(2,'0')+':'+(Math.floor(n)%60).toString().padStart(2,'0');
const titles = { heal: ['Capilla sin nombre','Nameless Chapel'], blood: ['Altar de bajamar','Ebb-Tide Altar'], gather: ['Baliza del estuario','Estuary Beacon'],
  boss: enemies.boss.name, win: ['El sello de plomo','The Lead Seal'], tempest: weapons.tempest.name, choir: weapons.choir.name };
for (const stage of stages) titles[stage.dispatch.id]=stage.name;
const glyphs = {
  salt:'M3 13h7l9-7 2 3-10 7H4z M5 16l-1 4', bell:'M7 9a5 5 0 0110 0v5l2 3H5l2-3z M10 20h4 M12 2v2',
  blade:'M4 20l8-9 M9 7l8 8 M11 11l7-8 3 1-1 4-6 6', lantern:'M8 8h8l2 12H6z M10 8V5a2 2 0 014 0v3 M10 14l2-2 2 4-2 2z',
  harpoon:'M3 21L20 4 M13 5l8-2-2 8 M8 13l3 3', mine:'M12 7l6 4 2 8-8 2-8-2 2-8z M12 7l1-4 3-1',
  resin:'M12 2C9 8 5 10 5 15a7 7 0 0014 0c0-4-5-8-7-13z', prayer:'M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5',
  boots:'M7 4h8v10l5 3v3H5l1-8z M7 8h8', coat:'M9 4l3 3 3-3 5 4-1 12H5L4 8z M12 7v12',
  patch:'M9 4h6v5h5v6h-5v5H9v-5H4V9h5z'
};
const icon = id => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="'+glyphs[id]+'"/></svg>';
const btn = (id,label,primary=false) => '<button data-do="'+id+'"'+(primary?' class="primary"':'')+'>'+label+'</button>';
const group = contents => '<div class="actions">'+contents+'</div>';
const pick = (field,value,label,active=false,locked=false) => '<button data-do="'+field+'" data-value="'+value+'"'+(active?' class="primary" aria-pressed="true"':'')+(locked?' disabled':'')+'>'+label+'</button>';
const meters = {vitality:['Salud','Health'],speed:['Velocidad','Speed'],power:['Potencia','Power'],reach:['Alcance','Reach'],guard:['Defensa','Guard']};
function panel(label,title,contents,wide=false) {
  return '<section aria-label="'+title+'" class="panel'+(wide?' wide':'')+'"><div class="eyebrow">'+label+'</div><h2>'+title+'</h2>'+contents+'</section>';
}
function performanceReadout() {
  if (samples.length < 10) return '';
  const sorted = [...samples].sort((a,b)=>a-b);
  const p95 = sorted[Math.ceil(sorted.length*.95)-1];
  const fps = 1000*samples.length/samples.reduce((sum,value)=>sum+value,0);
  return '<p class="tag">'+tr('Últimos fotogramas','Recent frames')+' · '+Math.round(fps)+' FPS · p95 '+p95.toFixed(1)+' ms</p>';
}
function show(name) {
  screen = name;
  app.classList.toggle('large',profile.settings.large);
  app.classList.toggle('contrast',profile.settings.contrast);
  app.classList.toggle('reduced',profile.settings.reduced);
  document.documentElement.lang = profile.settings.language;
  overlay.className = name !== 'home' && name !== 'play' ? 'dim' : '';
  world.hidden = hud.hidden = !game || !['play','pause','options','level','ritual','result','abandon','chronicle','ending'].includes(name);
  switch (name) {
    case 'home': {
      const pending = profile.progress.pending;
      const suspended = hasSuspend();
      const chapter = pending ? stages[pending.stage] : nextChapter();
      const progress = tr('Capítulo ','Chapter ')+(chapter.id+1)+' / '+stages.length+' · '+loc(chapter.name);
      overlay.innerHTML = '<section class="hero"><div class="hero-art" aria-hidden="true"></div><div class="title-copy"><h1 class="visually-hidden">ELDRITCH-404</h1><div class="eyebrow">'+tr('Archivo de la expedición','Expedition archive')+'</div><p class="lede">'+tr('La bajamar dejó al descubierto una puerta. Algo la está abriendo desde dentro.','Low tide uncovered a door. Something is opening it from within.')+'</p><div class="home-actions">'+
        (pending?btn('chronicle',tr('Resolver decisión de campaña','Resolve story decision'),true):'')+
        (suspended?btn('restore',tr('Reanudar expedición guardada','Resume suspended run'),!pending):'')+
        btn('story-brief',storyLabel(),!pending&&!suspended)+
        btn('modes',tr('Modos alternativos','Other modes'))+btn('campaign',tr('Campaña','Campaign'))+
        btn('archive',tr('Archivo','Archive'))+btn('options',tr('Opciones','Settings'))+
        '</div><p class="hero-footer">'+progress+' · v0.8.0</p></div></section>';
      break;
    }
    case 'campaign':
      displayCampaign();
      break;
    case 'modes':
      overlay.innerHTML = panel(tr('Expediciones','Expeditions'),tr('Modos alternativos','Other modes'),
        '<div class="mode-list">'+Object.entries(playModes).filter(([id])=>id!=='story').map(([id,mode])=>
          '<button data-do="open-mode" data-value="'+id+'"><strong>'+loc(mode.name)+'</strong><small>'+loc(mode.desc)+'</small></button>').join('')+'</div>'+
        group(btn('home',tr('Volver','Back'))),true);
      break;
    case 'brief':
      displayBrief();
      break;
    case 'archive':
      displayArchive();
      break;
    case 'codex':
      displayCodex();
      break;
    case 'chronicle':
      displayChronicle();
      break;
    case 'ending':
      overlay.innerHTML = panel(tr('Epílogo','Epilogue'),loc(endings[ending][0]),'<p>'+loc(endings[ending][1])+'</p>'+
        group(btn('home',tr('Volver al título','Return to title'),true)+btn('credits',tr('Créditos','Credits'))),true);
      break;
    case 'controls':
      overlay.innerHTML = panel(tr('Entrenamiento','Training'),tr('Controles','Controls'),
        '<p>'+Object.entries(profile.settings.keys).map(([action,key])=>'<kbd>'+keyLabel(key)+'</kbd> '+loc(actionLabels[action])).join(' · ')+'</p>'+
        '<p>'+tr('Mando: stick o cruceta para moverte.','Controller: move with the stick or D-pad.')+' '+
        ['dash','interact','pause'].map(action=>'<kbd>'+padLabels[profile.settings.pad[action]]+'</kbd> '+loc(actionLabels[action])).join(' · ')+'</p>'+
        '<p>'+tr('Los ataques son automáticos. Recoge fragmentos y elige mejoras. En pantalla táctil usa el stick de la izquierda y los botones de acción.','Attacks are automatic. Pick up shards and choose upgrades. On touch screens use the left stick and the action buttons.')+'</p>'+
        group(btn('brief',tr('Volver','Back'),true)));
      break;
    case 'play':
      overlay.innerHTML = '';
      break;
    case 'pause':
      overlay.innerHTML = panel(tr('Expedición suspendida','Expedition suspended'),tr('Pausa','Paused'),
        '<p>'+tr('La marea se detiene mientras decides.','The tide waits while you decide.')+'</p>'+performanceReadout()+
        group(btn('resume',tr('Continuar','Resume'),true)+btn('options',tr('Opciones','Settings'))+btn('suspend',tr('Guardar y salir','Save and quit'))+
          (game.playMode==='endless'?btn('extract',tr('Registrar marca y volver','Record score and return')):'')+btn('abandon',tr('Abandonar expedición','Abandon expedition'))));
      break;
    case 'abandon':
      overlay.innerHTML = panel(tr('Cerrar expedición','End expedition'),tr('¿Volver al título?','Return to title?'),
        '<p>'+tr('Se perderá la partida en curso.','The current expedition will be lost.')+'</p>'+group(btn('pause',tr('Seguir en pausa','Keep paused'),true)+btn('abandon-yes',tr('Abandonar','Abandon'))));
      break;
    case 'replace-save':
      overlay.innerHTML=panel(tr('Expedición guardada','Suspended run'),tr('¿Empezar otra partida?','Start another run?'),
        '<p>'+tr('La nueva expedición sustituirá a la guardada.','The new expedition will replace the suspended run.')+'</p>'+
        group(btn('brief',tr('Conservar partida','Keep suspended run'),true)+btn('replace-yes',tr('Empezar otra','Start another'))));
      break;
    case 'options':
      displayOptions();
      break;
    case 'level':
      overlay.innerHTML = panel(tr('Nivel ','Level ')+(game.level+1),tr('Elige una mejora','Choose an upgrade'),
        '<p>'+tr('La expedición se detiene hasta que elijas.','The expedition waits for your choice.')+'</p><div class="cards">'+game.choices.map((id,index) => {
          const item = weapons[id] ?? upgrades[id], rank = game.arsenal[id] ?? game.passives[id] ?? 0;
          const hint = item.evolves ? tr('EVOLUCIÓN','EVOLUTION') : id === 'patch' ? tr('CURA','HEAL') : rank ? tr('Rango ','Rank ')+(rank+1) : tr('NUEVO','NEW');
          const description = game.harbourStory ? harbourWeaponHints[id] ?? item.desc : item.desc;
          const value = item.stat ? ' · +'+Number(item.value.toFixed(3)) : '';
          return '<button class="loot" data-do="choose" data-value="'+id+'" style="color:'+item.color+'">'+icon(item.glyph)+'<strong>'+loc(item.name)+value+'</strong><small>'+loc(description)+'</small><span class="tag">'+(index+1)+' · '+hint+'</span></button>';
        }).join('')+'</div>',true);
      break;
    case 'ritual': {
      if (game.ritual === 'signal') {
        const found = profile.journal.includes(game.stage.dispatch.id);
        overlay.innerHTML = panel(tr('Hallazgo','Discovery'),loc(game.stage.dispatch.name),'<p>'+loc(game.stage.dispatch.text)+'</p><p>'+
          tr('Recuperas hasta 18 de salud y ganas 9 de experiencia.','Restore up to 18 health and gain 9 experience.')+
          (found?'':' '+tr('El primer hallazgo da +12 de salud inicial en la próxima expedición de Historia.','Your first discovery grants +12 starting health on the next Story expedition.'))+'</p>'+
          group(btn('ritual-no',tr('Marcharse','Leave'))+btn('ritual-yes',tr('Recuperar registro','Recover dispatch'),true)));
        break;
      }
      const flavor = {
        heal: tr('Quema el último cirio. Recuperas 42 de salud y 22 de cordura.','Burn the last candle. Restore 42 health and 22 sanity.'),
        blood: tr('Toca el filo. La mutación mejora daño, defensa o recogida según el investigador. Cuesta 48 de cordura y 2 de corrupción.','Touch the blade. Mutation improves damage, defence or pickup according to the investigator. Costs 48 sanity and 2 corruption.'),
        gather: game.floodedBeacon ?
          tr('La baliza responde desde el agua. Ganas '+(29+game.level*2)+' de experiencia a cambio de 34 de cordura y 2 de corrupción.',
            'The beacon answers from underwater. Gain '+(29+game.level*2)+' experience at the cost of 34 sanity and 2 corruption.') :
          tr('Enciende la baliza. Ganas '+(15+game.level*2)+' de experiencia a cambio de 23 de cordura y 1 de corrupción.',
            'Light the beacon. Gain '+(15+game.level*2)+' experience at the cost of 23 sanity and 1 corruption.')
      };
      overlay.innerHTML = panel(tr('Ritual','Ritual'),loc(titles[game.ritual]),'<p>'+flavor[game.ritual]+'</p><p>'+tr('La corrupción trae más enemigos y aumenta su salud. Con 55 de cordura o menos, la niebla oculta sombras adicionales.','Corruption brings more enemies and increases their health. At 55 sanity or below, more shades emerge in the mist.')+'</p>'+
        group(btn('ritual-no',tr('Marcharse','Leave'),true)+btn('ritual-yes',tr('Realizar ritual','Perform ritual'))));
      break;
    }
    case 'result': {
      const win = game.mode === 'won';
      const retired = game.mode==='retired';
      overlay.innerHTML = panel(tr('Informe final','End report'),retired?tr('Fin de la travesía','End of the voyage'):
        win ? game.bossId==='boss'?tr('El sello de plomo','The Lead Seal'):loc(enemies[game.bossId].name) : tr('La marea te reclama','The tide claims you'),
        '<p>'+(win ? game.playMode==='story'?loc(game.stage.story):tr('Has completado la expedición.','You completed the expedition.') :
        retired?tr('Tu récord se ha registrado en el cuaderno.','Your record has been logged in the journal.'):
        tr('La última anotación de tu cuaderno se deshace en el agua. Otro investigador ocupará tu lugar cuando baje la marea.','The final line in your journal dissolves in the water. Another investigator will take your place at low tide.'))+'</p>'+
        statCards([[tr('Tiempo','Time'),timeLabel(game.time)],[tr('Bajas','Kills'),game.kills],[tr('Nivel','Level'),game.level]])+
        (game.oath?'<p class="tag">'+loc(expeditionOaths[game.oath].name)+(win?(game.oathReward?
          ' · +'+game.oathReward+' '+tr('sellos','seals'):' · '+tr('Completado','Completed')):'')+'</p>':'')+
        '<p>'+tr('Armas utilizadas','Weapons used')+' · '+Object.entries(game.arsenal).map(([id,rank])=>loc(weapons[id].name)+' '+'I'.repeat(rank)).join(' · ')+'</p>'+
        group((profile.progress.pending?btn('chronicle',tr('Tomar la decisión','Make your decision'),true):btn('start',tr('Otra expedición','Another expedition'),true))+btn('home',tr('Volver al título','Return to title'))));
      break;
    }
    case 'journal': {
      const stats = profile.stats;
      overlay.innerHTML = panel(tr('Expediciones registradas','Recorded expeditions'),tr('Cuaderno de campo','Field journal'),
        statCards([[tr('Partidas','Runs'),stats.runs],[tr('Victorias','Victories'),stats.wins],[tr('Bajas','Kills'),stats.kills],[tr('Récord','Best'),timeLabel(stats.best)]])+
        '<h3>'+tr('Hallazgos','Discoveries')+'</h3><p>'+(profile.journal.filter(id=>!id.startsWith('signal')).map(id=>loc(titles[id])).join(' · ') || tr('El cuaderno está en blanco.','The journal is blank.'))+'</p>'+profile.journal.filter(id=>id.startsWith('signal')).map(id=>'<p class="entry"><strong>'+loc(titles[id])+'</strong> · '+loc(stages[Number(id.slice(6))].dispatch.text)+'</p>').join('')+'<p>'+ tr('Evoluciones conocidas: Escopeta III + Resina negra → Temporal de sal. Campana III + Salmo de lastre → Coro de los ahogados.','Known evolutions: Shotgun III + Black Resin → Salt Tempest. Bell III + Ballast Psalm → Choir of the Drowned.')+'</p>'+
        group(btn('codex',tr('Bestiario, recetas y logros','Bestiary, recipes and achievements'),true)+btn('archive',tr('Volver','Back'))+btn('credits',tr('Créditos','Credits'))));
      break;
    }
    case 'credits':
      overlay.innerHTML = panel('ELDRITCH-404',tr('Créditos','Credits'),'<p>'+tr('Diseño, código, pixel art y síntesis sonora originales de ELDRITCH-404. Código bajo licencia MIT.','Original ELDRITCH-404 design, code, pixel art and sound synthesis. Code under the MIT license.')+'</p>'+group(btn('journal',tr('Volver','Back'),true)));
      break;
    case 'reset':
      overlay.innerHTML = panel(tr('Perfil local','Local profile'),tr('¿Borrar el progreso?','Erase progress?'),
        '<p>'+tr('Se eliminarán ajustes, hallazgos, credencial y estadísticas.','Settings, discoveries, credential and statistics will be erased.')+'</p>'+group(btn('options',tr('Cancelar','Cancel'),true)+btn('reset-yes',tr('Borrar perfil','Erase profile'))));
      break;
  }
  overlay.querySelector('button:not(:disabled),select,input')?.focus({preventScroll:true});
  $('touch-controls').hidden = name!=='play';
  $('touch-dash').textContent = tr('Esquiva','Dodge');
  $('touch-interact').textContent = tr('Ritual','Ritual');
  $('touch-pause').textContent = tr('Pausa','Pause');
  if (name!=='play') input.releaseTouch();
}
const statCards = entries => '<div class="stats">'+entries.map(([label,value])=>'<div><span class="tag">'+label+'</span><b>'+value+'</b></div>').join('')+'</div>';
function hasSuspend() {
  try { return !!storage.getItem(suspendedKey); } catch { return false; }
}
function displayCampaign() {
  const progress = profile.progress;
  const choice = id => progress.choices[id] ? ' · '+loc(decisions[progress.choices[id]]) : '';
  const chapters = stages.map(stage => {
    const cleared = progress.clears.includes(stage.id);
    const unlocked = stageUnlocked(progress,stage.id);
    const status = progress.pending?.stage===stage.id ? tr('Decisión pendiente','Decision pending') :
      cleared ? tr('Completado','Cleared')+choice(stage.id) : unlocked ? tr('Disponible','Available') : tr('Bloqueado','Locked');
    return '<li><button data-do="open-chapter" data-value="'+stage.id+'"'+(!unlocked||progress.pending?' disabled':'')+
      '><strong>'+(stage.id+1)+' · '+loc(stage.name)+'</strong><small>'+status+'</small></button></li>';
  }).join('');
  overlay.innerHTML = panel(tr('Bitácora','Voyage log'),tr('Campaña','Campaign'),
    (progress.pending ? group(btn('chronicle',tr('Resolver decisión de campaña','Resolve story decision'),true)) : '')+
    '<ol class="mode-list chapter-list">'+chapters+'</ol>'+
    group(btn('campaign-endings',tr('Finales descubiertos','Discovered endings')+' · '+progress.endings.length+'/'+Object.keys(endings).length)+btn('home',tr('Volver','Back'))),true);
}
function displayBrief() {
  const progress = profile.progress;
  const stage = stages[selected.stage];
  const char = investigators[selected.character];
  const free = selected.mode==='free';
  const story = selected.mode==='story';
  const boss = enemies[selected.rival?stage.optional:stage.main];
  const first = stage.id===0 && story;
  const showLoadout = loadoutOpen || !story;
  const oath = story && progress.clears.includes(stage.id) ? selected.oath : '';
  const consequence = story && consequences[progress.choices[stage.id-1]];
  const oathOptions = story && progress.clears.includes(stage.id) ?
    '<h3>'+tr('Juramento de expedición','Expedition oath')+'</h3><div class="selection">'+
    pick('pick-oath','',tr('Sin juramento','No oath'),!oath)+Object.entries(expeditionOaths).map(([id,item])=>
      pick('pick-oath',id,loc(item.name)+(progress.oaths[id]?.includes(stage.id)?' ✓':''),oath===id)).join('')+'</div>'+
    (oath?'<p>'+loc(expeditionOaths[oath].desc)+' '+tr('Primera victoria en este capítulo','First win in this chapter')+
      ' · +'+expeditionOaths[oath].reward+' '+tr('sellos.','seals.')+'</p>':
      '<p>'+tr('Cada juramento tiene una recompensa por capítulo. Sus victorias conservan tu decisión de Historia.',
        'Each oath has a reward per chapter. Oath victories preserve your Story decision.')+'</p>') : '';
  const maps = stages.map(item=>pick('pick-stage',item.id,(item.id+1)+' · '+loc(item.name),item.id===stage.id,!free&&!stageUnlocked(progress,item.id)));
  const roster = investigators.map(item=>pick('pick-character',item.id,loc(item.name),item.id===char.id,!free&&!investigatorUnlocked(progress,item.id)));
  const objective = selected.mode==='endless' ?
    tr('Derrota a tantos jefes como puedas. Registra tu marca desde la pausa.','Defeat as many bosses as you can. Record your score from the pause menu.') :
    tr('Resiste hasta que llegue el jefe y derrótalo.','Survive until the boss arrives, then defeat it.');
  const preparations = '<h3>'+tr('Escenario','Stage')+'</h3><div class="selection">'+maps.join('')+'</div>'+
    '<h3>'+tr('Investigador','Investigator')+'</h3><div class="selection">'+roster.join('')+'</div>'+
    '<p>'+char.hp+' HP · '+Math.round(char.speed*100)+'% '+tr('velocidad','speed')+
    ' · '+Math.round(char.power*100)+'% '+tr('potencia','power')+' · '+(100-char.sanityCost)+'% '+tr('cordura','sanity')+'</p>'+
    '<p class="character-trait"><span>'+tr('Rasgo','Signature trait')+' · </span><strong>'+loc(char.trait.name)+'</strong> · '+loc(char.trait.desc)+'</p>'+
    '<p>'+tr('Arma inicial','Starting weapon')+' · <strong>'+loc(weapons[char.weapon].name)+'</strong> · '+loc(weapons[char.weapon].desc)+'</p>'+
    (!story ? '<h3>'+tr('Encuentro','Encounter')+'</h3>'+group(pick('pick-rival',0,loc(enemies[stage.main].name),!selected.rival)+
      pick('pick-rival',1,loc(enemies[stage.optional].name),selected.rival)) : '')+
    (free ? '<h3>'+tr('Duración','Duration')+'</h3>'+group(pick('pick-length',.5,tr('Corta','Short'),selected.length===.5)+pick('pick-length',.75,tr('Media','Medium'),selected.length===.75)+pick('pick-length',1.35,tr('Larga','Long'),selected.length===1.35)) : '')+
    oathOptions;
  overlay.innerHTML = panel(story ? tr('Capítulo ','Chapter ')+(stage.id+1)+' / '+stages.length : loc(playModes[selected.mode].name),loc(stage.name),
    '<div class="brief-overview"><div><p class="brief-objective">'+objective+'</p><p>'+(selected.rival?tr('Encuentro alternativo. Observa el aviso de carga antes de esquivar.','Alternate encounter. Watch for the windup before dodging.'):loc(stage.brief))+'</p>'+
    '<p><strong>'+timeLabel(expeditionTime(stage,selected.mode,selected.length,oath))+'</strong> · '+loc(boss.name)+'</p>'+
    '<p>'+loc(char.name)+' · '+loc(weapons[char.weapon].name)+'</p>'+
    (oath?'<p class="tag">'+loc(expeditionOaths[oath].name)+'</p>':'')+
    (consequence?'<p>'+loc(consequence.text)+'</p>':'')+
    (profile.stats.veteran&&!['free','challenge'].includes(selected.mode)?'<p class="tag">'+tr('Credencial de veterano activa · Botas I','Veteran credential active · Boots I')+'</p>':'')+
    (story&&progress.supplies?'<p class="tag">'+tr('Suministros recuperados · +12 de salud inicial','Recovered supplies · +12 starting health')+'</p>':'')+
    '</div><img src="'+arenaArt(stage.id)+'" alt="" width="240" height="135"></div>'+
    group(btn('start',first?tr('Entrar en el muelle','Enter the quay'):tr('Entrar en expedición','Start expedition'),true)+
      (story?btn('toggle-loadout',showLoadout?tr('Ocultar preparación','Hide loadout'):tr('Cambiar preparación','Change loadout')):'')+
      btn('controls',tr('Controles','Controls'))+btn(story?'home':'modes',tr('Volver','Back')))+
    (showLoadout?preparations:''),true);
}
function displayArchive() {
  const p = profile.progress;
  const grid = Object.entries(archive).map(([id,item])=>{
    const rank=p.tree[id]??0;
    return '<div><h3>'+loc(item.name)+' '+rank+'/3</h3><p>'+loc(item.desc)+'</p>'+
      pick('buy',id,rank===3?tr('Completo','Complete'):tr('Mejorar · ','Upgrade · ')+archiveCost(rank),false,rank===3||p.credits<archiveCost(rank))+'</div>';
  }).join('');
  const loot = relics.filter(item=>p.relics.includes(item.id)).map(item=>pick('equip',item.id,loc(item.name)+' · '+loc(meters[item.stat])+
    ' +'+(item.stat==='vitality'||item.stat==='reach'?item.value:Math.round(item.value*100)+'%'),p.equipped===item.id));
  overlay.innerHTML=panel(tr('Mejoras permanentes','Permanent upgrades'),tr('Archivo','Archive'),
    group(btn('journal',tr('Cuaderno de campo','Field journal'),true)+btn('home',tr('Volver','Back')))+'<p>'+tr('Sellos disponibles','Available seals')+' · '+p.credits+'</p>'+
    '<div class="archive-grid">'+grid+'</div><h3>'+tr('Reliquias','Relics')+' · '+p.relics.length+'/30</h3><p>'+
    tr('Recupera reliquias derrotando jefes. Puedes equipar una.','Recover relics by defeating bosses. You can equip one.')+'</p>'+
    '<div class="selection">'+[pick('equip','',tr('Sin reliquia','No relic'),!p.equipped),...loot].join('')+'</div>',true);
}
function displayCodex() {
  const p=profile.progress;
  const tabs={beasts:tr('Bestiario','Bestiary'),armory:tr('Armas','Weapons'),recipes:tr('Recetas','Recipes'),awards:tr('Logros','Achievements'),
    finales:tr('Finales','Endings'),records:tr('Récords','Records')};
  let body='';
  if (codexTab==='beasts') body=[...bestiary,...stages.flatMap(item=>[item.main,item.optional])].map(id=>{
    const {atlas,cell} = creaturePortrait(id);
    const counted = p.bestiary.includes(id)||p.bosses.includes(id);
    return '<li><span aria-hidden="true" class="beast-portrait '+atlas+(counted?'':' unknown')+'" style="--portrait-x:'+
      (cell%4*100/3)+'%;--portrait-y:'+(Math.floor(cell/4)*50)+'%"></span><div><strong>'+loc(enemies[id].name)+
      '</strong><small>'+(counted ? (atlas==='fauna'?loc(portraitNotes[cell]):tr('Registrado','Recorded')) :
        tr('Por descubrir','Undiscovered'))+'</small></div></li>';
  }).join('');
  if (codexTab==='recipes') body=Object.entries(weapons).filter(([,item])=>item.evolves).map(([id,item])=>'<li>'+
    loc(weapons[item.evolves].name)+' III + '+loc(upgrades[item.recipe].name)+' → '+loc(item.name)+
    (p.evolutionLog.includes(id)?' ✓':'')+'</li>').join('');
  if (codexTab==='armory') body=Object.values(weapons).map(item=>'<li><strong>'+loc(item.name)+'</strong><p>'+loc(item.desc)+'</p></li>').join('');
  if (codexTab==='awards') body=achievements.map(item=>'<li>'+(p.achievements.includes(item.id)?'✓ ':'○ ')+loc(item.name)+'</li>').join('');
  if (codexTab==='finales') body=Object.entries(endings).map(([id,[title,line]])=>'<li>'+loc(title)+' · '+
    (p.endings.includes(id)?loc(line):tr('Pendiente','Locked'))+'</li>').join('');
  if (codexTab==='records') body=Object.entries(playModes).map(([id,mode])=>'<li>'+loc(mode.name)+' · '+timeLabel(p.records[id]?.time??0)+
    ' · '+(p.records[id]?.kills??0)+' '+tr('bajas','kills')+'</li>').join('')+
    Object.entries(expeditionOaths).map(([id,item])=>'<li>'+loc(item.name)+' · '+(p.oaths[id]?.length??0)+'/'+stages.length+
      ' '+tr('capítulos','chapters')+'</li>').join('');
  const portraitAttrs = codexTab==='beasts' ? ' creatures" style="--fauna:url('+imageAsset(actorAtlases.fauna)+');--portraits:url('+
    imageAsset(actorAtlases.portraits)+')' : '';
  overlay.innerHTML=panel(tr('Cuaderno de campo','Field journal'),tabs[codexTab],group(btn(codexFrom,tr('Volver','Back'),true))+
    '<div class="selection">'+Object.entries(tabs).map(([id,name])=>pick('codex-tab',id,name,codexTab===id)).join('')+'</div><ul class="codex-list'+portraitAttrs+'">'+body+'</ul>',true);
}
function displayChronicle() {
  const p = profile.progress;
  if (!p.pending) { show('home'); return; }
  const stage = stages[p.pending.stage];
  const choices = stage.id===9 ? finalChoices : decisions;
  const counts = Object.values(p.choices);
  const hint = stage.id===9 ? '<p>'+tr('Duplicados','Duplicates')+' '+counts.filter(x=>x==='save').length+
    ' · '+tr('Anclas','Anchors')+' '+counts.filter(x=>x==='anchor').length+' · '+tr('Marcas','Marks')+' '+counts.filter(x=>x==='mark').length+
    ' · '+tr('Corrupción','Corruption')+' '+p.pending.corruption+'</p>' : '';
  overlay.innerHTML = panel(tr('Decisión de campaña','Campaign decision'),loc(stage.name),'<p>'+loc(stage.story)+'</p><p>'+loc(dispatches[stage.id])+'</p>'+hint+
    (stage.id===9?'<p>'+tr('Rescatar a tres duplicados cambia el cierre. Tres anclas y corrupción de 2 o menos cambian el control. Tres marcas cambian la fusión.',
      'Three rescued duplicates change the seal. Three anchors and corruption of 2 or less change control. Three marks change the merge.')+'</p>':'')+
    (stage.id===9 ? group(Object.entries(choices).map(([id,name])=>pick('story-choice',id,loc(name))).join('')) :
      '<div class="cards">'+Object.entries(choices).map(([id,name])=>
        '<button class="loot" data-do="story-choice" data-value="'+id+'" aria-label="'+loc(name)+'" aria-describedby="choice-'+id+
        '"><strong>'+loc(name)+'</strong><small id="choice-'+id+'">'+loc(consequences[id].text)+'</small></button>').join('')+'</div>'),true);
}
const actionLabels = {up:['Arriba','Up'],down:['Abajo','Down'],left:['Izquierda','Left'],right:['Derecha','Right'],
  dash:['Esquiva','Dodge'],interact:['Ritual','Ritual'],pause:['Pausa','Pause'],confirm:['Confirmar','Confirm'],back:['Atrás','Back']};
function displayOptions() {
  const s = profile.settings;
  const setting = (label,field,markup) => '<label class="setting" for="'+field+'">'+label+markup+'</label>';
  const select = (id,choices) => '<select id="'+id+'" data-setting="'+id+'">'+choices.map(([value,label])=>'<option value="'+value+'"'+(s[id]===value?' selected':'')+'>'+label+'</option>').join('')+'</select>';
  const check = id => '<input id="'+id+'" data-setting="'+id+'" type="checkbox"'+(s[id]?' checked':'')+'>';
  const range = (id,min,max) => '<input id="'+id+'" data-setting="'+id+'" type="range" min="'+min+'" max="'+max+'" step=".01" value="'+s[id]+'">';

  const remaps = (groupId, values, options) => Object.entries(values).map(([id,value])=>{
    const field=groupId+'-'+id;
    return setting(loc(actionLabels[id]),field,'<select id="'+field+'" data-setting="'+field+'">'+options.map(([option,label])=>
      '<option value="'+option+'"'+(option===value?' selected':'')+'>'+label+'</option>').join('')+'</select>');
  }).join('');
  const keyOptions = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter=>['Key'+letter,letter]);
  keyOptions.push(...['Space','Escape','Enter','ShiftLeft','ControlLeft',...Array.from({length:10},(_,i)=>'Digit'+i)].map(id=>[id,id.replace('Digit','')]));
  overlay.innerHTML = panel(tr('Preferencias locales','Local preferences'),tr('Opciones','Settings'),
    setting(tr('Idioma','Language'),'language',select('language',[['es','Español'],['en','English']]))+
    setting(tr('Dificultad (siguiente partida)','Difficulty (next expedition)'),'difficulty',select('difficulty',[['standard',tr('Estándar','Standard')],['story',tr('Historia','Story')]]))+
    setting(tr('Música','Music'),'music',range('music',0,1))+
    setting(tr('Efectos sonoros','Sound effects'),'fx',range('fx',0,1))+
    setting(tr('Zona muerta del mando','Gamepad deadzone'),'deadzone',range('deadzone',.05,.5))+
    setting(tr('Reducir efectos visuales','Reduce visual effects'),'reduced',check('reduced'))+
    setting(tr('Alto contraste','High contrast'),'contrast',check('contrast'))+
    setting(tr('Texto grande','Large text'),'large',check('large'))+
    group(btn('options-back',tr('Volver','Back'),true)+btn('fullscreen',tr('Pantalla completa','Fullscreen'))+
    btn('export',tr('Exportar perfil','Export profile'))+btn('import',tr('Importar perfil','Import profile'))+
    (optionsFrom==='home'?btn('reset',tr('Borrar perfil','Erase profile')):''))+
    '<h3>'+tr('Teclado','Keyboard')+'</h3>'+remaps('keys',s.keys,keyOptions)+
    '<h3>'+tr('Botones del mando','Gamepad buttons')+'</h3>'+remaps('pad',s.pad,padLabels.map((name,i)=>[i,name]))+
    group(btn('reset-controls',tr('Restaurar controles','Reset controls')))+
    '<input type="file" id="profile-file" accept=".json,application/json" hidden>');
}
function makeHud() {
  hud.innerHTML = '<div class="hud-top"><div class="hp-box"><div class="hud-row"><span>'+tr('SALUD','HEALTH')+'</span><output id="hp-text"></output></div><meter id="hp" min="0" max="100" value="100" aria-label="'+tr('Salud','Health')+'"></meter><div class="hud-row"><span>'+tr('CORDURA','SANITY')+'</span><output id="sanity-text"></output></div><meter id="sanity" min="0" max="100" value="100" aria-label="'+tr('Cordura','Sanity')+'"></meter></div>'+
    '<div class="run-box"><span class="status" id="tide"></span><time id="clock">00:00</time><div class="hud-row"><span id="level-text"></span><span id="kills"></span></div><meter id="xp" min="0" max="5" value="0" aria-label="'+tr('Experiencia','Experience')+'"></meter></div>'+
    '<div class="tool-box"><div class="hud-row"><span>'+tr('ESQUIVA','DODGE')+'</span><span id="dash"></span></div><div class="hud-row"><span>'+tr('CORRUPCIÓN','CORRUPTION')+'</span><span id="corrupt"></span></div><div class="hud-row" id="current-row" hidden><span>'+tr('CORRIENTE','CURRENT')+'</span><span id="current-direction"></span></div></div></div>'+
    '<div class="arsenal" id="arsenal"></div><div class="interaction" id="interaction" hidden><button data-do="interact" id="interact-button"></button></div>'+
    '<div class="boss-bar" id="boss-bar" hidden><span id="boss-name"></span><span id="boss-warning" class="boss-warning" aria-live="polite" hidden></span><meter id="boss-meter" min="0" max="100" value="100"></meter></div>';
  lastArsenal = '';
  hudNodes = {};
}
let lastArsenal = '';
let hudNodes;
function updateField(id,value,prop='textContent') {
  const node = hudNodes[id] ??= $(id);
  if (node[prop] !== value) node[prop] = value;
}
function updateHud() {
  const p = game.player;
  const near = game.nearestSite();
  const boss = game.boss;
  updateField('hp',p.maxHp,'max');
  updateField('hp',p.hp,'value');
  updateField('hp-text',Math.ceil(p.hp)+'/'+Math.round(p.maxHp),'value');
  updateField('sanity',game.sanity,'value');
  updateField('sanity-text',Math.round(game.sanity)+'%','value');
  updateField('xp',game.goal,'max');
  updateField('xp',game.xp,'value');
  updateField('level-text',tr('NV ','LV ')+game.level);
  updateField('kills',game.kills+' '+tr('BAJAS','KILLS'));
  updateField('clock',boss ? timeLabel(game.time) : timeLabel(Math.ceil(Math.max(0,game.bossAt-game.time))));
  const phase = {low:tr('Bajamar','Low tide'),tide:tr('Marea ascendente','Rising tide'),deep:tr('Cerco abisal','Abyssal siege')};
  updateField('tide',boss ? (boss.second?tr('Jefe · fase II','Boss · phase II'):tr('Jefe · fase I','Boss · phase I')) :
    tr('Jefe en · ','Boss in · ')+phase[game.phase()]);
  updateField('dash',p.dashCooldown ? p.dashCooldown.toFixed(1)+'s' : tr('LISTA','READY'));
  updateField('corrupt',game.corruption.toString());
  const current = game.current();
  updateField('current-row',!current,'hidden');
  if (current) {
    const arrows = ['→','↘','↓','↙','←','↖','↑','↗'];
    const direction = Math.round(Math.atan2(current.y,current.x)*4/Math.PI);
    updateField('current-direction',arrows[(direction+8)%8]);
  }
  updateField('interaction',!near || screen!=='play','hidden');
  if (near) updateField('interact-button',promptFor('interact')+' · '+loc(near.label));
  updateField('touch-interact',near?.ritual==='signal'?tr('Registro','Dispatch'):tr('Ritual','Ritual'));
  updateField('boss-bar',!boss,'hidden');
  if (boss) {
    updateField('boss-name',loc(enemies[boss.kind].name));
    updateField('boss-meter',boss.maxHp,'max');
    updateField('boss-meter',Math.max(0,boss.hp),'value');
    updateField('boss-warning',boss.action!=='tell','hidden');
    if (boss.action==='tell') {
      const attack = boss.attack ?? game.bossAttack(boss);
      updateField('boss-warning',loc(signatures[attack]?.tell ?? bossTells[attack] ?? ['Ataque en preparación','Attack winding up']));
    }
  }
  const fingerprint = Object.entries(game.arsenal).join('|');
  if (fingerprint !== lastArsenal) {
    lastArsenal = fingerprint;
    $('arsenal').innerHTML = Object.entries(game.arsenal).map(([id,rank]) =>
      '<span class="arm" title="'+loc(weapons[id].name)+'" style="color:'+weapons[id].color+'">'+icon(weapons[id].glyph)+(weapons[id].evolves?'★':'I'.repeat(rank))+'</span>').join('');
  }
}
function notice(value, duration=2900) {
  $('notice').textContent = value;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { $('notice').textContent = ''; },duration);
}
function persist() {
  if (!save(storage,profile)) notice(tr('No se pudo guardar el perfil.','The profile could not be saved.'));
}
async function start(replace = false) {
  if (starting) return;
  if (selected.mode==='story' && profile.progress.pending) { show('chronicle'); return; }
  if (!replace && hasSuspend()) { show('replace-save'); return; }
  starting = true;
  try { await ready; } finally { starting = false; }
  const fair = selected.mode==='challenge' || selected.mode==='free';
  const stage = selected.mode==='free' || stageUnlocked(profile.progress,selected.stage) ? selected.stage : 0;
  const character = selected.mode==='free' || investigatorUnlocked(profile.progress,selected.character) ? selected.character : 0;
  const perks = fair ? {} : bonuses(profile.progress,selected.mode==='story'?stage:undefined);
  const supplied = selected.mode==='story' && profile.progress.supplies>0;
  if (supplied) perks.vitality = (perks.vitality ?? 0)+12;
  const oath = profile.progress.clears.includes(stage) ? selected.oath : '';
  const expedition = new Expedition({...selected,stage,character,oath, difficulty:selected.mode==='challenge'?'standard':profile.settings.difficulty, veteran:!fair&&profile.stats.veteran,
    perks, openArsenal: selected.mode==='free'?9:stage, guide:!profile.progress.clears.includes(0) && stage===0 && selected.mode==='story',
    ...(testClock || selected.mode==='challenge'?{seed:404+stage*17}:{})});
  if (replace) storage.removeItem(suspendedKey);
  enter(expedition);
  if (supplied) { profile.progress.supplies--; persist(); }
}
function enter(expedition) {
  samples.length = 0;
  game = expedition;
  world.hidden = false;
  makeHud();
  show(game.mode);
  accumulator = 0;
  pending = {};
  camera = renderer.draw(game,profile.settings.reduced || reducedMotion.matches,profile.settings.contrast);
  updateHud();
}
async function action(id,value) {
  sound.volume(profile.settings);
  sound.event('click');
  switch(id) {
    case 'home': game = null; show('home'); break;
    case 'start': await start(); break;
    case 'story-brief':
    case 'open-chapter':
      selected.mode='story';
      selected.stage=id==='open-chapter'?Number(value):nextChapter().id;
      selected.rival=false;
      selected.oath='';
      if (!investigatorUnlocked(profile.progress,selected.character)) selected.character=0;
      loadoutOpen=false;
      show('brief');
      break;
    case 'open-mode':
      if (!Object.hasOwn(playModes,value) || value==='story') break;
      selected.mode=value;
      selected.rival=false;
      selected.oath='';
      if (value!=='free') {
        if (!stageUnlocked(profile.progress,selected.stage)) selected.stage=nextChapter().id;
        if (!investigatorUnlocked(profile.progress,selected.character)) selected.character=0;
      }
      show('brief');
      break;
    case 'toggle-loadout':
      loadoutOpen=!loadoutOpen;
      show('brief');
      overlay.querySelector('[data-do="toggle-loadout"]')?.focus();
      break;
    case 'campaign-endings':
      codexFrom='campaign'; codexTab='finales'; show('codex'); break;
    case 'codex':
      codexFrom='journal'; codexTab='beasts'; show('codex'); break;
    case 'replace-yes':
      await start(true); break;
    case 'restore':
      await ready;
      try {
        const resumed=restore(JSON.parse(storage.getItem(suspendedKey)),Expedition);
        selected={...selected,...resumed.config};
        enter(resumed);
      } catch {
        try { storage.removeItem(suspendedKey); } catch {}
        show('home'); notice(tr('No se pudo reanudar la expedición.','The suspended run could not be restored.'));
      }
      break;
    case 'suspend':
      try {
        storage.setItem(suspendedKey,JSON.stringify(suspend(game)));
        game=null; show('home');
      } catch { notice(tr('No se pudo guardar la expedición.','The run could not be saved.')); }
      break;
    case 'extract':
      if (game?.playMode==='endless' && screen==='pause') { game.finish('retired'); syncScreen(); }
      break;
    case 'abandon-yes':
      try { storage.removeItem(suspendedKey); } catch {}
      game=null; show('home'); break;
    case 'pick-stage': selected.stage=Number(value); selected.oath=''; showSelection(id,value); break;
    case 'pick-oath': selected.oath=Object.hasOwn(expeditionOaths,value)?value:''; showSelection(id,value); break;
    case 'pick-character': selected.character=Number(value); showSelection(id,value); break;
    case 'pick-rival': selected.rival=value==='1'; showSelection(id,value); break;
    case 'pick-length': selected.length=Number(value); showSelection(id,value); break;
    case 'buy': if (buy(profile.progress,value)) persist(); show('archive'); break;
    case 'equip':
      if (!value || profile.progress.relics.includes(value)) { profile.progress.equipped=value; persist(); }
      show('archive'); break;
    case 'codex-tab': codexTab=value; show('codex'); break;
    case 'story-choice': {
      const result=resolveStory(profile.progress,value);
      if (!result) break;
      persist();
      if (result.ending) { ending=result.ending; show('ending'); }
      else { selected.stage=nextChapter().id; selected.rival=false; selected.oath=''; selected.mode='story'; loadoutOpen=false; show('brief'); }
      break;
    }
    case 'resume': accumulator=0; pending={}; show('play'); break;
    case 'options':
      if (screen !== 'reset') optionsFrom = screen === 'pause' ? 'pause' : 'home';
      show('options'); break;
    case 'options-back': show(optionsFrom); break;
    case 'reset-controls':
      profile.settings.keys={...defaultKeys}; profile.settings.pad={...defaultPad}; persist(); show('options'); break;
    case 'choose': if (game.choose(value)) { pending={}; show('play'); } break;
    case 'ritual-yes':
    case 'ritual-no': game.resolveRitual(id === 'ritual-yes'); pending={}; show('play'); syncScreen(); break;
    case 'interact':
      if (screen !== 'play') break;
      game.openRitual();
      if (game.mode === 'ritual') show('ritual');
      break;
    case 'fullscreen':
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await app.requestFullscreen(); }
      catch { notice(tr('Pantalla completa no disponible.','Fullscreen unavailable.')); }
      break;
    case 'export': {
      const url = URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)], {type:'application/json'}));
      const a = document.createElement('a'); a.href=url; a.download='ELDRITCH-404-perfil.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),3000); break;
    }
    case 'import': $('profile-file').click(); break;
    case 'reset-yes':
      try { storage.removeItem(key); storage.removeItem(key+'.backup'); storage.removeItem(suspendedKey); } catch { /* session can still be reset */ }
      profile=fresh(); persist(); show('options'); break;
    default: show(id);
  }
}
function showSelection(id,value) {
  const scroll = overlay.querySelector('.panel')?.scrollTop ?? 0;
  show('brief');
  overlay.querySelector('[data-do="'+id+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
  overlay.querySelector('.panel').scrollTop=scroll;
}
function back() {
  switch(screen) {
    case 'play': show('pause'); break;
    case 'pause': action('resume'); break;
    case 'options': show(optionsFrom); break;
    case 'credits': show('journal'); break;
    case 'codex': show(codexFrom); break;
    case 'journal': show('archive'); break;
    case 'brief': show(selected.mode==='story'?'home':'modes'); break;
    case 'controls':
    case 'replace-save': show('brief'); break;
    case 'reset': show('options'); break;
    case 'abandon': show('pause'); break;
    case 'ritual': action('ritual-no'); break;
    case 'home':
    case 'level': break;
    default: action('home');
  }
}
function navigate(controller) {
  if (screen === 'play') return;
  const items = Array.from(overlay.querySelectorAll('button:not(:disabled),select,input[data-setting]'));
  if (!items.length) return;
  const focused = document.activeElement;
  const current = items.indexOf(focused);
  if (controller.nav) {
    if (['left','right'].includes(controller.nav) && focused.dataset.setting && focused.type!=='checkbox') {
      const change = controller.nav === 'left' ? -1 : 1;
      if (focused.tagName === 'SELECT') focused.selectedIndex = clamp(focused.selectedIndex+change,0,focused.options.length-1);
      else if (focused.type === 'range') focused.value = clamp(Number(focused.value)+change*.05,Number(focused.min),Number(focused.max));
      focused.dispatchEvent(new Event('change',{bubbles:true}));
    } else {
      const index = ['left','up'].includes(controller.nav) ? -1 : 1;
      items[current < 0 ? 0 : (current+index+items.length)%items.length].focus();
    }
  }
  if (controller.confirm) {
    if (focused.tagName === 'SELECT') { try { focused.showPicker?.(); } catch { /* left/right changes the selection */ } }
    else (items[current] ?? items[0]).click();
  }
}
app.addEventListener('click', e => {
  const button = e.target.closest('button[data-do]');
  if (button) action(button.dataset.do,button.dataset.value).catch(error => { console.error(error); notice(tr('No se pudo iniciar la expedición.','Could not start the expedition.')); });
});
const padArea = $('touch-stick');
let pointer = null;
function steer(event) {
  if (event.pointerId!==pointer) return;
  const box=padArea.getBoundingClientRect();
  input.touch.x=clamp((event.clientX-box.left-box.width/2)/(box.width*.39),-1,1);
  input.touch.y=clamp((event.clientY-box.top-box.height/2)/(box.height*.39),-1,1);
}
padArea.addEventListener('pointerdown',event=>{
  pointer=event.pointerId; padArea.setPointerCapture(pointer); steer(event);
});
padArea.addEventListener('pointermove',steer);
for (const event of ['pointerup','pointercancel','lostpointercapture']) padArea.addEventListener(event,e=>{
  if (e.pointerId===pointer) { pointer=null; input.releaseTouch(); }
});
for (const id of ['dash','interact']) $('touch-'+id).addEventListener('pointerdown',()=>{input.touch[id]=true;});
for (const event of ['pointerdown','keydown','gamepadconnected','gamepadbuttondown']) {
  window.addEventListener(event,() => sound.unlock().then(()=>sound.volume(profile.settings)).catch(()=>{}));
}
app.addEventListener('change',async e => {
  const field = e.target.dataset.setting;
  if (field) {
    const [groupId,control] = field.split('-');
    if (control && ['keys','pad'].includes(groupId)) profile.settings[groupId][control]=groupId==='pad'?Number(e.target.value):e.target.value;
    else profile.settings[field] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    sound.volume(profile.settings);
    persist();
    if (field === 'language') {
      if (game) makeHud();
      show('options');
      $(field)?.focus();
    }
    app.classList.toggle('large',profile.settings.large);
    app.classList.toggle('contrast',profile.settings.contrast);
    app.classList.toggle('reduced',profile.settings.reduced);
  }
  if (e.target.id === 'profile-file' && e.target.files[0]) {
    try {
      const file = e.target.files[0];
      if (file.size > 64000) throw Error('File too large');
      profile = validate(JSON.parse(await file.text()));
      persist(); sound.volume(profile.settings);
      if (game) makeHud();
      show('options'); notice(tr('Perfil importado.','Profile imported.'));
    } catch { notice(tr('Archivo de perfil no válido.','Invalid profile file.')); }
    e.target.value='';
  }
});
document.addEventListener('visibilitychange',() => {
  if (document.hidden && screen === 'play') { input.releaseTouch(); show('pause'); }
});
window.addEventListener('blur',()=>{ if (screen==='play') show('pause'); });

let pending = {}, qaInput = {};
function frame(now) {
  const dt = previous === undefined ? 0 : Math.min(.09,(now-previous)/1000);
  if (previous !== undefined && screen === 'play') {
    samples.push(now-previous);
    if (samples.length > 360) samples.shift();
  }
  previous = now;
  const controller = input.poll(profile.settings.deadzone,now,profile.settings);
  qaInput = controller;
  if (controller.connected !== padConnected) {
    padConnected = controller.connected;
    if (!padConnected && screen==='play') show('pause');
    notice(padConnected ? tr('Mando conectado','Gamepad connected') : tr('Mando desconectado','Gamepad disconnected'));
  }
  const screenBeforeInput = screen;
  if ((controller.back || controller.start) && screen !== 'level') back();
  else if (screen === 'level' && game.choices[controller.choice]) action('choose',game.choices[controller.choice]);
  else navigate(controller);
  if (screen === 'play' && screenBeforeInput === 'play' && !testClock) {
    accumulator += dt;
    pending.dash ||= controller.dash;
    pending.interact ||= controller.interact;
    while (accumulator >= step && screen === 'play') {
      game.update(step,{x:controller.x,y:controller.y,...pending},camera);
      pending={}; accumulator -= step;
      syncScreen();
    }
  }
  if (game && !world.hidden) {
    if (screen === 'play' || screen !== drawnScreen) {
      camera = renderer.draw(game,profile.settings.reduced || reducedMotion.matches,profile.settings.contrast);
      updateHud();
    }
  }
  drawnScreen = screen;
  const active = ['play','level','ritual','pause'].includes(screen) && game;
  const victory = screen==='result' && game?.mode==='won';
  sound.score(active ? game.phase() : victory ? 'victory' : 'menu',active || victory ? game.stage.id : 0,
    active ? game.sanity : 100,!!(active && game.boss?.second));
  requestAnimationFrame(frame);
}
function syncScreen() {
  for (const event of game.events.splice(0)) {
    sound.event(event.type,event.value);
    if (event.type === 'guide') {
      const touch = matchMedia('(pointer: coarse)').matches;
      const controls = ['up','left','down','right'].map(id=>keyLabel(profile.settings.keys[id])).join('/');
      const move = touch || padConnected ? tr('Usa el stick','Use the stick') : controls;
      const dash = touch ? tr('Esquiva','Dodge') : promptFor('dash');
      const interact = touch ? tr('Ritual','Ritual') : promptFor('interact');
      const guide = {
        move: move+' · '+tr('Muévete. Disparas automáticamente.','Move. Attacks fire automatically.'),
        fragments: tr('Acércate a los fragmentos para elegir mejoras.','Move near shards to earn upgrades.'),
        dash: dash+' · '+tr('Pruébala para esquivar y cruzar un grupo.','Try dodging through a group.'),
        ritual: interact+' · '+tr('Úsalo junto a la capilla o la baliza.','Use it next to the chapel or beacon.')
      };
      notice(guide[event.value],4800);
    }
    if (event.type==='discovery') {
      const id = game.stage.dispatch.id;
      if (!profile.journal.includes(id)) {
        profile.journal.push(id);
        profile.progress.supplies++;
        notice(tr('Registro recuperado · Suministros para la próxima expedición','Dispatch recovered · Supplies for the next expedition'));
        persist();
      } else notice(tr('Registro recuperado','Dispatch recovered'));
    }
    if (event.type === 'boss') notice(loc(enemies[game.bossId].name));
    if (event.type === 'landmark' && !game.boss) {
      notice(loc(environmentWarnings[event.value]));
    }
    if (event.type==='harbour-tide') notice(event.value==='tide' ?
      tr('El agua alcanza la baliza. Iluminarla ahora tiene un precio mayor.','Water reaches the beacon. Lighting it now comes at a higher price.') :
      tr('Pleamar · Hay luces encendidas bajo el agua.','High tide · Lights are burning underwater.'),4600);
    if (event.type==='sanity-low') notice(event.value===28 ?
      tr('Cordura crítica · Más daño y velocidad. Aumentan las sombras.','Critical sanity · More damage and speed. More shades emerge.') :
      tr('La niebla se cierra. Empiezan a aparecer más sombras.','The fog closes in. More shades begin to emerge.'),4200);
    if (event.type === 'boss-phase') notice(event.value==='boss' ?
      tr('Segunda fase · La Sacristana apaga los faroles.','Second phase · The Sacristan extinguishes the lanterns.') :
      game.stage.signature && event.value===game.stage.main ? loc(signatures[game.stage.signature].shift) :
      tr('Segunda fase','Second phase'));
    if (event.type === 'endless-clear') notice(tr('Jefes vencidos · ','Bosses defeated · ')+game.clearCount);
    if (event.type === 'evolution') notice(loc(weapons[event.value].name));
  }
  if (game.mode === 'level' || game.mode === 'ritual') show(game.mode);
  else if (['won','lost','retired'].includes(game.mode)) {
    try { storage.removeItem(suspendedKey); } catch {}
    record(profile,game); persist(); show('result');
  }
}
let drawnScreen = '';
const ready = renderer.load();
ready.catch(error => { console.error(error); notice(tr('Faltan recursos gráficos.','Art assets could not load.')); });
show('home');
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && !testClock && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      reg.installing?.addEventListener('statechange', event => {
        if (event.target.state === 'installed' && navigator.serviceWorker.controller) {
          notice(tr('Actualización lista. Cierra las pestañas del juego para activarla.','Update ready. Close the game tabs to activate it.'));
        }
      });
    });
  }).catch(error => console.warn('PWA:',error));
}
if (testClock) {
  window.qa = {
    snapshot: () => game && ({screen,mode:game.mode,hp:game.player.hp,x:game.player.x,y:game.player.y,
      time:game.time,kills:game.kills,level:game.level,boss:game.boss?.hp,arsenal:{...game.arsenal},choices:[...game.choices],stats:{...profile.stats}}),
    observe: () => game && structuredClone({ player:game.player, enemies:game.enemies, gems:{live:game.gems.live},
      hazards:{live:game.hazards.live}, boss:game.boss }),
    tick(frames, controls = null) {
      for (let i=0;i<frames && screen==='play';i++) {
        game.update(step,controls ?? {x:qaInput.x,y:qaInput.y,dash:qaInput.dash,interact:qaInput.interact},camera);
        syncScreen();
      }
      if (game) { camera=renderer.draw(game,profile.settings.reduced || reducedMotion.matches,profile.settings.contrast); updateHud(); }
    },
    measurements: () => [...samples]
  };
}
