import { Expedition } from './simulation.mjs';
import { Renderer } from './render.mjs';
import { Input } from './input.mjs';
import { Sound } from './audio.mjs';
import { load, save, fresh, validate, record, key, suspendedKey, suspend, restore } from './storage.mjs';
import { defaultKeys, defaultPad, weapons, upgrades, enemies, step, investigators, stages, playModes, relics, bestiary } from './content.mjs';
import { archive, archiveCost, achievements, bonuses, buy, decisions, dispatches, endings, finalChoices, investigatorUnlocked, resolveStory, stageUnlocked } from './campaign.mjs';
import { clamp } from './math.mjs';

const $ = id => document.getElementById(id);
const app = $('app'), world = $('world'), overlay = $('overlay'), hud = $('hud');
const storage = { getItem: k => localStorage.getItem(k), setItem: (k,v) => localStorage.setItem(k,v),
  removeItem: k => localStorage.removeItem(k) };
let profile = load(storage);
let game, camera, previous, screen = 'home', optionsFrom = 'home', accumulator = 0, noteTimer, padConnected = false;
let selected = {stage:stages.find(item=>!profile.progress.clears.includes(item.id)&&stageUnlocked(profile.progress,item.id))?.id??0,
  character:0,mode:'story',rival:false,length:.75};
let ending = null;
let codexTab = 'beasts';
let starting = false;
const input = new Input();
const sound = new Sound();
const renderer = new Renderer(world);
const testClock = new URLSearchParams(location.search).get('qa') === '1' && ['localhost','127.0.0.1'].includes(location.hostname);
const samples = [];
const tr = (es,en) => profile.settings.language === 'es' ? es : en;
const loc = pair => pair[profile.settings.language === 'es' ? 0 : 1];
const timeLabel = n => Math.floor(n/60).toString().padStart(2,'0')+':'+(Math.floor(n)%60).toString().padStart(2,'0');
const titles = { heal: ['Capilla sin nombre','Nameless Chapel'], blood: ['Altar de bajamar','Ebb-Tide Altar'], gather: ['Baliza del estuario','Estuary Beacon'],
  boss: enemies.boss.name, win: ['El sello de plomo','The Lead Seal'], tempest: weapons.tempest.name, choir: weapons.choir.name };
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
  document.documentElement.lang = profile.settings.language;
  overlay.className = name !== 'home' && name !== 'play' ? 'dim' : '';
  world.hidden = hud.hidden = !game || !['play','pause','options','level','ritual','result','abandon','chronicle','ending'].includes(name);
  switch (name) {
    case 'home':
      overlay.innerHTML = '<section class="hero"><div class="title-copy"><img class="mark" src="assets/icon.png" alt=""><div class="eyebrow">'+tr('Archivo de la expedición','Expedition archive')+'</div><h1>ELDRITCH<span>404</span></h1><p class="lede">'+tr('La bajamar dejó al descubierto una puerta. Algo la está abriendo desde dentro.','Low tide uncovered a door. Something is opening it from within.')+'</p><div class="home-actions">'+
        (profile.progress.pending?btn('chronicle',tr('Resolver decisión de campaña','Resolve story decision'),true):'')+
        (hasSuspend()?btn('restore',tr('Reanudar expedición guardada','Resume suspended run'),true):'')+
        btn('brief',tr('Comenzar expedición','Begin expedition')+' <b>↗</b>',true)+btn('archive',tr('Archivo y reliquias','Archive and relics'))+
        btn('journal',tr('Cuaderno de campo','Field journal'))+btn('options',tr('Opciones','Settings'))+'</div><p class="hero-footer">'+tr('Teclado, mando y táctil · v0.2.0','Keyboard, gamepad and touch · v0.2.0')+'</p></div><div class="stage-name">'+tr('INNSMOUTH OLVIDADA','FORGOTTEN INNSMOUTH')+'</div></section>';
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
        '<p>'+tr('<kbd>WASD</kbd> Mover · <kbd>Espacio</kbd> Esquivar · <kbd>E</kbd> Ritual · <kbd>Esc</kbd> Pausa','<kbd>WASD</kbd> Move · <kbd>Space</kbd> Dodge · <kbd>E</kbd> Ritual · <kbd>Esc</kbd> Pause')+'</p><p>'+tr('Mando · stick o cruceta para moverte, A para esquivar, X para ritual y Menú para pausar.','Controller · stick or D-pad to move, A to dodge, X for rituals, Menu to pause.')+'</p>'+
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
          const value = item.stat ? ' · +'+Number(item.value.toFixed(3)) : '';
          return '<button class="loot" data-do="choose" data-value="'+id+'" style="color:'+item.color+'">'+icon(item.glyph)+'<strong>'+loc(item.name)+value+'</strong><small>'+loc(item.desc)+'</small><span class="tag">'+(index+1)+' · '+hint+'</span></button>';
        }).join('')+'</div>',true);
      break;
    case 'ritual': {
      const flavor = {
        heal: tr('Quema el último cirio. Recuperas 42 de salud y 22 de cordura.','Burn the last candle. Restore 42 health and 22 sanity.'),
        blood: tr('Toca el filo. La mutación mejora daño, defensa o recogida según el investigador. Cuesta 48 de cordura y 2 de corrupción.','Touch the blade. Mutation improves damage, defence or pickup according to the investigator. Costs 48 sanity and 2 corruption.'),
        gather: tr('Enciende la baliza. Obtén experiencia a cambio de 23 de cordura y 1 de corrupción.','Light the beacon. Gain experience at the cost of 23 sanity and 1 corruption.')
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
        group((profile.progress.pending?btn('chronicle',tr('Tomar la decisión','Make your decision'),true):btn('start',tr('Otra expedición','Another expedition'),true))+btn('home',tr('Volver al título','Return to title'))));
      break;
    }
    case 'journal': {
      const stats = profile.stats;
      overlay.innerHTML = panel(tr('Expediciones registradas','Recorded expeditions'),tr('Cuaderno de campo','Field journal'),
        statCards([[tr('Partidas','Runs'),stats.runs],[tr('Victorias','Victories'),stats.wins],[tr('Bajas','Kills'),stats.kills],[tr('Récord','Best'),timeLabel(stats.best)]])+
        '<h3>'+tr('Hallazgos','Discoveries')+'</h3><p>'+(profile.journal.map(id=>loc(titles[id])).join(' · ') || tr('El cuaderno está en blanco.','The journal is blank.'))+'</p><p>'+tr('Evoluciones conocidas: Escopeta III + Resina negra → Temporal de sal. Campana III + Salmo de lastre → Coro de los ahogados.','Known evolutions: Shotgun III + Black Resin → Salt Tempest. Bell III + Ballast Psalm → Choir of the Drowned.')+'</p>'+
        group(btn('codex',tr('Bestiario, recetas y logros','Bestiary, recipes and achievements'),true)+btn('home',tr('Volver','Back'))+btn('credits',tr('Créditos','Credits'))));
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
  overlay.querySelector('button,select,input')?.focus({preventScroll:true});
  $('touch-controls').hidden = name!=='play';
  if (name!=='play') input.releaseTouch();
}
const statCards = entries => '<div class="stats">'+entries.map(([label,value])=>'<div><span class="tag">'+label+'</span><b>'+value+'</b></div>').join('')+'</div>';
function hasSuspend() {
  try { return !!storage.getItem(suspendedKey); } catch { return false; }
}
function displayBrief() {
  const progress = profile.progress;
  const stage = stages[selected.stage];
  const char = investigators[selected.character];
  const free = selected.mode==='free';
  const boss = enemies[selected.rival?stage.optional:stage.main];
  const modes = Object.entries(playModes).map(([id,mode])=>pick('pick-mode',id,loc(mode.name),id===selected.mode));
  const maps = stages.map(item=>pick('pick-stage',item.id,(item.id+1)+' · '+loc(item.name),item.id===stage.id,!free&&!stageUnlocked(progress,item.id)));
  const roster = investigators.map(item=>pick('pick-character',item.id,loc(item.name),item.id===char.id,!free&&!investigatorUnlocked(progress,item.id)));
  const first = stage.id===0 && !selected.rival && selected.mode==='story';
  overlay.innerHTML = panel(tr('Preparación','Briefing'),loc(stage.name),
    group(btn('start',first?tr('Entrar en el muelle','Enter the quay'):tr('Entrar en expedición','Start expedition'),true)+
      btn('controls',tr('Controles','Controls'))+btn('home',tr('Volver','Back')))+
    '<h3>'+tr('Modo','Mode')+'</h3><div class="selection">'+modes.join('')+'</div><p>'+loc(playModes[selected.mode].desc)+'</p>'+
    '<h3>'+tr('Escenario','Stage')+'</h3><div class="selection">'+maps.join('')+'</div>'+
    '<h3>'+tr('Investigador','Investigator')+'</h3><div class="selection">'+roster.join('')+'</div>'+
    (profile.stats.veteran?'<p class="tag">'+tr('Credencial de veterano activa · Botas I','Veteran credential active · Boots I')+'</p>':'')+
    '<p>'+loc(weapons[char.weapon].name)+' · '+char.hp+' HP · '+Math.round(char.speed*100)+'% '+tr('velocidad','speed')+
    ' · '+Math.round(char.power*100)+'% '+tr('potencia','power')+' · '+(100-char.sanityCost)+'% '+tr('cordura','sanity')+'</p>'+
    '<h3>'+tr('Encuentro','Encounter')+'</h3><p>'+loc(boss.name)+'</p>'+
    group(pick('pick-rival',0,loc(enemies[stage.main].name),!selected.rival)+pick('pick-rival',1,loc(enemies[stage.optional].name),selected.rival,selected.mode==='story'))+
    (free?group(pick('pick-length',.5,tr('Corta','Short'),selected.length===.5)+pick('pick-length',.75,tr('Media','Medium'),selected.length===.75)+pick('pick-length',1.35,tr('Larga','Long'),selected.length===1.35)):''),
    true);
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
    group(btn('home',tr('Volver','Back'),true))+'<p>'+tr('Sellos disponibles','Available seals')+' · '+p.credits+'</p>'+
    '<div class="archive-grid">'+grid+'</div><h3>'+tr('Reliquias','Relics')+' · '+p.relics.length+'/30</h3><p>'+
    tr('Recupera reliquias derrotando jefes. Puedes equipar una.','Recover relics by defeating bosses. You can equip one.')+'</p>'+
    '<div class="selection">'+[pick('equip','',tr('Sin reliquia','No relic'),!p.equipped),...loot].join('')+'</div>',true);
}
function displayCodex() {
  const p=profile.progress;
  const tabs={beasts:tr('Bestiario','Bestiary'),armory:tr('Armas','Weapons'),recipes:tr('Recetas','Recipes'),awards:tr('Logros','Achievements'),
    finales:tr('Finales','Endings'),records:tr('Récords','Records')};
  let body='';
  if (codexTab==='beasts') body=[...bestiary,...stages.flatMap(item=>[item.main,item.optional])].map(id=>
    '<li>'+loc(enemies[id].name)+' · '+(p.bestiary.includes(id)||p.bosses.includes(id)?tr('Registrado','Recorded'):tr('Por descubrir','Undiscovered'))+'</li>').join('');
  if (codexTab==='recipes') body=Object.entries(weapons).filter(([,item])=>item.evolves).map(([id,item])=>'<li>'+
    loc(weapons[item.evolves].name)+' III + '+loc(upgrades[item.recipe].name)+' → '+loc(item.name)+
    (p.evolutionLog.includes(id)?' ✓':'')+'</li>').join('');
  if (codexTab==='armory') body=Object.values(weapons).map(item=>'<li><strong>'+loc(item.name)+'</strong><p>'+loc(item.desc)+'</p></li>').join('');
  if (codexTab==='awards') body=achievements.map(item=>'<li>'+(p.achievements.includes(item.id)?'✓ ':'○ ')+loc(item.name)+'</li>').join('');
  if (codexTab==='finales') body=Object.entries(endings).map(([id,[title,line]])=>'<li>'+loc(title)+' · '+
    (p.endings.includes(id)?loc(line):tr('Pendiente','Locked'))+'</li>').join('');
  if (codexTab==='records') body=Object.entries(playModes).map(([id,mode])=>'<li>'+loc(mode.name)+' · '+timeLabel(p.records[id]?.time??0)+
    ' · '+(p.records[id]?.kills??0)+' '+tr('bajas','kills')+'</li>').join('');
  overlay.innerHTML=panel(tr('Cuaderno de campo','Field journal'),tabs[codexTab],group(btn('journal',tr('Volver','Back'),true))+
    '<div class="selection">'+Object.entries(tabs).map(([id,name])=>pick('codex-tab',id,name,codexTab===id)).join('')+'</div><ul class="codex-list">'+body+'</ul>',true);
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
    group(Object.entries(choices).map(([id,name])=>pick('story-choice',id,loc(name))).join('')),true);
}
function displayOptions() {
  const s = profile.settings;
  const setting = (label,field,markup) => '<label class="setting" for="'+field+'">'+label+markup+'</label>';
  const select = (id,choices) => '<select id="'+id+'" data-setting="'+id+'">'+choices.map(([value,label])=>'<option value="'+value+'"'+(s[id]===value?' selected':'')+'>'+label+'</option>').join('')+'</select>';
  const check = id => '<input id="'+id+'" data-setting="'+id+'" type="checkbox"'+(s[id]?' checked':'')+'>';
  const range = (id,min,max) => '<input id="'+id+'" data-setting="'+id+'" type="range" min="'+min+'" max="'+max+'" step=".01" value="'+s[id]+'">';
  const labels = {up:['Arriba','Up'],down:['Abajo','Down'],left:['Izquierda','Left'],right:['Derecha','Right'],
    dash:['Esquiva','Dodge'],interact:['Ritual','Ritual'],pause:['Pausa','Pause'],confirm:['Confirmar','Confirm'],back:['Atrás','Back']};
  const buttons = ['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS'];
  const remaps = (groupId, values, options) => Object.entries(values).map(([id,value])=>{
    const field=groupId+'-'+id;
    return setting(loc(labels[id]),field,'<select id="'+field+'" data-setting="'+field+'">'+options.map(([option,label])=>
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
    '<h3>'+tr('Botones del mando','Gamepad buttons')+'</h3>'+remaps('pad',s.pad,buttons.map((name,i)=>[i,name]))+
    group(btn('reset-controls',tr('Restaurar controles','Reset controls')))+
    '<input type="file" id="profile-file" accept=".json,application/json" hidden>');
}
function makeHud() {
  hud.innerHTML = '<div class="hud-top"><div class="hp-box"><div class="hud-row"><span>'+tr('SALUD','HEALTH')+'</span><output id="hp-text"></output></div><meter id="hp" min="0" max="100" value="100" aria-label="'+tr('Salud','Health')+'"></meter><div class="hud-row"><span>'+tr('CORDURA','SANITY')+'</span><output id="sanity-text"></output></div><meter id="sanity" min="0" max="100" value="100" aria-label="'+tr('Cordura','Sanity')+'"></meter></div>'+
    '<div class="run-box"><span class="status" id="tide"></span><time id="clock">00:00</time><div class="hud-row"><span id="level-text"></span><span id="kills"></span></div><meter id="xp" min="0" max="5" value="0" aria-label="'+tr('Experiencia','Experience')+'"></meter></div>'+
    '<div class="tool-box"><div class="hud-row"><span>'+tr('ESQUIVA','DODGE')+'</span><span id="dash"></span></div><div class="hud-row"><span>'+tr('CORRUPCIÓN','CORRUPTION')+'</span><span id="corrupt"></span></div></div></div>'+
    '<div class="arsenal" id="arsenal"></div><div class="interaction" id="interaction" hidden><button data-do="interact" id="interact-button"></button></div>'+
    '<div class="boss-bar" id="boss-bar" hidden><span id="boss-name"></span><meter id="boss-meter" min="0" max="100" value="100"></meter></div>';
  lastArsenal = '';
}
let lastArsenal = '';
function updateHud() {
  const p = game.player;
  const near = game.nearestSite();
  const boss = game.boss;
  $('hp').max = p.maxHp; $('hp').value = p.hp; $('hp-text').value = Math.ceil(p.hp)+'/'+Math.round(p.maxHp);
  $('sanity').value = game.sanity; $('sanity-text').value = game.sanity+'%';
  $('xp').max = game.goal; $('xp').value = game.xp;
  $('level-text').textContent = (tr('NV ','LV '))+game.level;
  $('kills').textContent = game.kills+' '+tr('BAJAS','KILLS');
  $('clock').textContent = timeLabel(game.time);
  const phase = { low: tr('Bajamar','Low tide'), tide: tr('Marea ascendente','Rising tide'), deep: tr('Cerco abisal','Abyssal siege'), boss:tr('La Sacristana','The Sacristan') };
  $('tide').textContent = boss ? loc(enemies[boss.kind].name) : phase[game.phase()];
  $('dash').textContent = p.dashCooldown ? p.dashCooldown.toFixed(1)+'s' : tr('LISTA','READY');
  $('corrupt').textContent = game.corruption.toString();
  $('interaction').hidden = !near || screen !== 'play';
  if (near) $('interact-button').textContent = (padConnected ? 'X' : 'E')+' · '+loc(near.label);
  $('boss-bar').hidden = !boss;
  if (boss) { $('boss-name').textContent=loc(enemies[boss.kind].name); $('boss-meter').max = boss.maxHp; $('boss-meter').value = Math.max(0,boss.hp); }
  const fingerprint = JSON.stringify(game.arsenal);
  if (fingerprint !== lastArsenal) {
    lastArsenal = fingerprint;
    $('arsenal').innerHTML = Object.entries(game.arsenal).map(([id,rank]) =>
      '<span class="arm" title="'+loc(weapons[id].name)+'" style="color:'+weapons[id].color+'">'+icon(weapons[id].glyph)+(weapons[id].evolves?'★':'I'.repeat(rank))+'</span>').join('');
  }
}
function notice(value) {
  $('notice').textContent = value;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { $('notice').textContent = ''; },2900);
}
function persist() {
  if (!save(storage,profile)) notice(tr('No se pudo guardar el perfil.','The profile could not be saved.'));
}
async function start() {
  if (starting) return;
  if (selected.mode==='story' && profile.progress.pending) { show('chronicle'); return; }
  if (hasSuspend()) { show('replace-save'); return; }
  starting = true;
  try { await ready; } finally { starting = false; }
  const fair = selected.mode==='challenge' || selected.mode==='free';
  const stage = selected.mode==='free' || stageUnlocked(profile.progress,selected.stage) ? selected.stage : 0;
  const character = selected.mode==='free' || investigatorUnlocked(profile.progress,selected.character) ? selected.character : 0;
  enter(new Expedition({...selected,stage,character, difficulty:selected.mode==='challenge'?'standard':profile.settings.difficulty, veteran:!fair&&profile.stats.veteran,
    perks:fair?{}:bonuses(profile.progress), openArsenal: selected.mode==='free'?9:stage,
    ...(testClock || selected.mode==='challenge'?{seed:404+stage*17}:{})}));
}
function enter(expedition) {
  samples.length = 0;
  game = expedition;
  world.hidden = false;
  makeHud();
  show(game.mode);
  accumulator = 0;
  pending = {};
  camera = renderer.draw(game,profile.settings.reduced,profile.settings.contrast);
  updateHud();
}
async function action(id,value) {
  sound.volume(profile.settings);
  sound.event('click');
  switch(id) {
    case 'home': game = null; show('home'); break;
    case 'start': await start(); break;
    case 'replace-yes':
      storage.removeItem(suspendedKey); await start(); break;
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
    case 'pick-mode':
      if (!Object.hasOwn(playModes,value)) break;
      selected.mode=value;
      if (value==='story') selected.rival=false;
      if (value!=='free') {
        if (!stageUnlocked(profile.progress,selected.stage)) selected.stage=0;
        if (!investigatorUnlocked(profile.progress,selected.character)) selected.character=0;
      }
      showSelection(id,value); break;
    case 'pick-stage': selected.stage=Number(value); showSelection(id,value); break;
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
      else { selected.stage=result.stage+1; selected.rival=false; selected.mode='story'; show('brief'); }
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
    case 'ritual-no': game.resolveRitual(id === 'ritual-yes'); pending={}; show('play'); break;
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
    case 'codex': show('journal'); break;
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
    if (['left','right'].includes(controller.nav) && focused.dataset.setting) {
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
for (const [id,es,en] of [['touch-dash','Esquiva','Dodge'],['touch-interact','Ritual','Ritual'],['touch-pause','Pausa','Pause']]) {
  $(id).textContent=tr(es,en);
}
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
      camera = renderer.draw(game,profile.settings.reduced,profile.settings.contrast);
      updateHud();
    }
  }
  drawnScreen = screen;
  sound.score(screen === 'play' ? game.phase() : screen === 'result' && game.mode === 'won' ? 'victory' : 'low',game?.stage.id ?? 0);
  requestAnimationFrame(frame);
}
function syncScreen() {
  for (const event of game.events.splice(0)) {
    sound.event(event.type,event.value);
    if (event.type === 'boss') notice(loc(enemies[game.bossId].name));
    if (event.type === 'boss-phase') notice(tr('Segunda fase','Second phase'));
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
      if (game) { camera=renderer.draw(game,profile.settings.reduced,profile.settings.contrast); updateHud(); }
    },
    measurements: () => [...samples]
  };
}
