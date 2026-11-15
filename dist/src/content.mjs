export const arena = { width: 1728, height: 1152 };
export const duration = 300;
export const step = 1 / 60;
export const defaultKeys = {up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',dash:'Space',interact:'KeyE',pause:'Escape'};
export const defaultPad = {dash:0,interact:2,pause:9,confirm:0,back:1};
export const weapons = {
  salt: { name: ['Escopeta de sal', 'Salt Shotgun'], desc: ['Abre un abanico de perdigones hacia la amenaza más cercana.', 'Fans pellets toward the nearest threat.'], color: '#f8c289', glyph: 'salt', cooldown: 1.02 },
  bell: { name: ['Campana funeraria', 'Funeral Bell'], desc: ['Pulso defensivo que golpea y empuja alrededor de ti.', 'A defensive pulse strikes and repels nearby enemies.'], color: '#8cead8', glyph: 'bell', cooldown: 2.1 },
  blade: { name: ['Cuchilla votiva', 'Votive Blade'], desc: ['Una cuchilla orbita a tu alrededor y corta al contacto.', 'An orbiting blade cuts enemies on contact.'], color: '#f8a5b5', glyph: 'blade', cooldown: 0 },
  lantern: { name: ['Farol de pabilo azul', 'Blue Wick Lantern'], desc: ['Prende fuego frío en la posición de enemigos cercanos.', 'Lights cold fire under nearby enemies.'], color: '#a3a7ff', glyph: 'lantern', cooldown: 3.45 },
  harpoon: { name: ['Arpón de bajamar', 'Ebb-Tide Harpoon'], desc: ['Atraviesa filas enteras. Úsalo para abrir un corredor.', 'Pierces entire rows. Use it to carve an escape route.'], color: '#d6eaa6', glyph: 'harpoon', cooldown: 1.68 },
  mine: { name: ['Nudo de pólvora', 'Powder Knot'], desc: ['Deja una carga detrás que detona al paso de una criatura.', 'Drops a charge that detonates when a creature approaches.'], color: '#eaa992', glyph: 'mine', cooldown: 2.48 },
  tempest: { name: ['Temporal de sal', 'Salt Tempest'], desc: ['Evolución. Dos ráfagas contrapuestas con perforación.', 'Evolution. Two opposing barrages of piercing shot.'], color: '#ffd8a4', glyph: 'salt', cooldown: .76, evolves: 'salt' },
  choir: { name: ['Coro de los ahogados', 'Choir of the Drowned'], desc: ['Evolución. Pulso expansivo y una segunda onda retardada.', 'Evolution. An expanding pulse and a delayed second wave.'], color: '#79ffe9', glyph: 'bell', cooldown: 1.6, evolves: 'bell' }
};
export const upgrades = {
  resin: { name: ['Resina negra', 'Black Resin'], desc: ['+12 % de daño por rango. Permite evolucionar la escopeta.', '+12% damage per rank. Enables the shotgun evolution.'], color: '#e2ac8c', glyph: 'resin', max: 3 },
  prayer: { name: ['Salmo de lastre', 'Ballast Psalm'], desc: ['+14 de radio de recogida por rango. Permite evolucionar la campana.', '+14 pickup radius per rank. Enables the bell evolution.'], color: '#82e2d0', glyph: 'prayer', max: 3 },
  boots: { name: ['Botas del estibador', 'Dockhand Boots'], desc: ['+13 de velocidad por rango.', '+13 movement speed per rank.'], color: '#dec796', glyph: 'boots', max: 3 },
  coat: { name: ['Abrigo de lastre', 'Ballast Coat'], desc: ['+14 de salud máxima y cura 24.', '+14 maximum health and heals 24.'], color: '#9dd1cf', glyph: 'coat', max: 3 },
  patch: { name: ['Venda de campaña', 'Field Dressing'], desc: ['Recupera 32 de salud al instante.', 'Restore 32 health immediately.'], color: '#efb6ab', glyph: 'patch', max: Infinity }
};
export const enemies = {
  drowned: { hp: 21, speed: 48, radius: 8, contact: 12, xp: 2, color: '#63b4a6', name: ['Ahogado', 'Drowned'] },
  skitter: { hp: 14, speed: 88, radius: 8, contact: 10, xp: 2, color: '#ef9c72', name: ['Larva de marea', 'Tide Larva'] },
  brute: { hp: 88, speed: 36, radius: 13, contact: 22, xp: 6, color: '#a5c0a0', name: ['Estibador cosido', 'Stitched Dockhand'] },
  seer: { hp: 35, speed: 61, radius: 9, contact: 10, xp: 4, color: '#bc9dea', name: ['Oficiante', 'Officiant'] },
  charger: { hp: 53, speed: 55, radius: 10, contact: 20, xp: 5, color: '#f6787d', name: ['Perro de osario', 'Ossuary Hound'] },
  shade: { hp: 46, speed: 76, radius: 10, contact: 16, xp: 5, color: '#a0adec', name: ['Sombra del faro', 'Lighthouse Shade'] },
  boss: { hp: 3500, speed: 40, radius: 29, contact: 26, xp: 0, color: '#f18693', name: ['La Sacristana de la Marea', 'The Tide Sacristan'] }
};
export const sites = [
  { x: 864, y: 576, art: 'well', label: ['Plaza del aljibe', 'Cistern Square'] },
  { x: 459, y: 346, art: 'chapel', ritual: 'heal', label: ['Capilla sin nombre', 'Nameless Chapel'] },
  { x: 1269, y: 373, art: 'shrine', ritual: 'blood', label: ['Altar de bajamar', 'Ebb-Tide Altar'] },
  { x: 454, y: 801, art: 'beacon', ritual: 'gather', label: ['Baliza del estuario', 'Estuary Beacon'] },
  { x: 1282, y: 804, art: 'boat', label: ['Varadero roto', 'Broken Slipway'] }
];
export const waves = [
  { at: 0, gap: 1.45, types: ['drowned'] },
  { at: 24, gap: 1.15, types: ['drowned', 'drowned', 'skitter'] },
  { at: 57, gap: .95, types: ['drowned', 'skitter', 'brute'] },
  { at: 94, gap: .86, types: ['drowned', 'seer', 'drowned', 'skitter', 'brute'] },
  { at: 135, gap: .76, types: ['charger', 'seer', 'skitter', 'drowned', 'brute'] },
  { at: 183, gap: .68, types: ['shade', 'charger', 'drowned', 'skitter', 'brute', 'seer'] },
  { at: 238, gap: .64, types: ['shade', 'charger', 'seer', 'brute', 'skitter'] },
  { at: duration, gap: 2.3, types: ['drowned', 'skitter'] }
];

export const playModes = {
  story: { name: ['Historia', 'Story'], desc: ['Diez capítulos y decisiones persistentes.', 'Ten chapters and persistent decisions.'], length: 1 },
  classic: { name: ['Supervivencia', 'Survival'], desc: ['Duelo al final de una oleada larga.', 'A long siege followed by a duel.'], length: 1.4 },
  quick: { name: ['Partida rápida', 'Quick run'], desc: ['Oleadas comprimidas y experiencia acelerada.', 'Compressed waves and accelerated experience.'], length: .54 },
  endless: { name: ['Infinito', 'Endless'], desc: ['Jefes recurrentes y récord de supervivencia.', 'Recurring bosses and a survival record.'], length: 1 },
  nightmare: { name: ['Pesadilla', 'Nightmare'], desc: ['Corrupción inicial, más enemigos y ataques más rápidos.', 'Starting corruption, denser waves and faster attacks.'], length: 1.12 },
  challenge: { name: ['Desafío', 'Challenge'], desc: ['Semilla fija. Una sola arma, mejoras pasivas y sin bonificaciones del Archivo.', 'Fixed seed. One weapon, passive upgrades and no Archive bonuses.'], length: .64 },
  free: { name: ['Modo libre', 'Free play'], desc: ['Todos los mapas e investigadores. Elige jefe y duración. Sin desbloqueos de campaña.', 'All maps and investigators. Choose boss and duration. No story unlocks.'], length: .75 }
};

const chapters = [
  [['Innsmouth Olvidada','Forgotten Innsmouth'],['La llave de plomo lleva una fecha futura. El nicho que abre ya ha sido saqueado.','The lead key bears a future date. The niche it opens has already been plundered.'],['Puerto','Harbour'],'#285961',[-1,0],['Recaudador del Muelle','Quay Collector']],
  [['Cementerio de los Sin Nombre','Cemetery of the Nameless'],['La lista del nicho enumera expediciones que todavía no han salido. La última tiene tu firma.','The list in the niche names expeditions yet to depart. The last bears your signature.'],['Túmulos','Barrows'],'#547058',[0,1],['Procesión Hueca','Hollow Procession'],['Fosero de las Dos Palas','Gravedigger of the Two Spades']],
  [['Catedral de la Carne','Cathedral of Flesh'],['El órgano reproduce la señal de socorro que tu radio emitirá mañana.','The organ reproduces the distress call your radio will send tomorrow.'],['Órgano','Organ'],'#923f55',[1,0],['Predicador de las Tres Bocas','Three-Mouthed Preacher'],['Organista de Médula','Marrow Organist']],
  [['Ciudad Sumergida','Drowned City'],['Los buzos se quitan los cascos. Todos tienen tu rostro. Uno lleva años esperándote.','The divers remove their helmets. They all have your face. One has waited years for you.'],['Corriente','Current'],'#286998',[1,-1],['Cardumen de los Justos','Shoal of the Just'],['Viuda de las Boyas','Widow of the Buoys']],
  [['Reino de las Geometrías Imposibles','Realm of Impossible Geometry'],['Otro cuaderno contiene todas las rutas que decidiste no seguir. La tinta aún está húmeda.','Another journal contains every route you chose against. The ink is still wet.'],['Pliegue','Fold'],'#7550a0',[-1,-1],['Poliedro de Hambre','Polyhedron of Hunger'],['Arquitecta del Vértice','Vertex Architect']],
  [['Bosque de los Susurros','Whispering Woods'],['Cada árbol conserva un nombre borrado del registro. Algunos responden cuando los llamas.','Each tree preserves a name erased from the record. Some answer when called.'],['Raíces','Roots'],'#65854c',[0,1],['Madera Madre','Motherwood'],['Ciervo de Cal','Lime Stag']],
  [['Manicomio Astral','Astral Asylum'],['El primer duplicado recuerda haber abierto la puerta para mantenerte con vida.','The first duplicate recalls opening the door to keep you alive.'],['Relojes','Clocks'],'#606bb0',[1,0],['Paciente Cero','Patient Zero'],['Celador del Meridiano','Meridian Warden']],
  [['Biblioteca Infinita','Infinite Library'],['Tres fichas describen el cierre. Cada una tiene un espacio reservado para los desaparecidos.','Three cards describe the sealing. Each has a space reserved for the missing.'],['Estantes','Shelves'],'#946049',[0,-1],['Índice Carnívoro','Carnivorous Index'],['Archivera del Lodo','Silt Archivist']],
  [['Trono de los Dioses Muertos','Throne of Dead Gods'],['Las copias saben lo que les ocurrirá si cierras el paso. Han escrito sus propios nombres.','The copies know what happens if you seal the passage. They have written their own names.'],['Coronas','Crowns'],'#997543',[-1,1],['Rey de la Inercia','King of Inertia'],['Custodio de la Corona','Crown Custodian']],
  [['Corazón del Caos','Heart of Chaos'],['El paso sólo permanecerá abierto mientras alguien recuerde sus dos orillas. Escoge quién conservará esa memoria.','The passage stays open only while someone remembers both shores. Choose who keeps that memory.'],['Vínculo','Link'],'#944a81',[1,1],['Corazón sin Dueño','Masterless Heart'],['Testigo Anterior','First Witness']]
];
export const bossPatterns = ['tide','fan','cross','pursuit','shell','roots','clock','gates','sweep','spiral'];
export const stages = chapters.map(([name, story, feature, color, drift, optional, principal], index) => ({
  id: index, name, story, feature, color, drift, duration: duration + index * 8,
  main: index === 0 ? 'boss' : 'warden'+index, optional: 'champion'+index,
  pattern: bossPatterns[index], rivalPattern: bossPatterns[(index+4)%10],
  sites: index === 0 ? sites : sites.map((site,i) => ({
    ...site, x: site.x + ((index*97+i*83)%171)-85, y: site.y + ((index*53+i*71)%141)-70,
    label: i === 0 ? feature : site.label
  }))
}));
for (const stage of stages) {
  const i = stage.id;
  for (const [id, name, pattern] of [[stage.main, chapters[i][6], stage.pattern], [stage.optional, chapters[i][5], stage.rivalPattern]]) {
    if (id === 'boss') continue;
    enemies[id] = { ...enemies.boss, name, boss: true, pattern, stage: i, color: stage.color,
      hp: 2100+i*145+(id===stage.optional?240:0), speed: 43+i*2 };
  }
}
enemies.boss.boss = true;
enemies.boss.pattern = 'tide';

const enemyFamilies = [
  ['drowned','tether', ['Marinero con garfio','Hooked Sailor'], ['Caparazón de cal','Lime Shell'], ['Amasijo','Heap']],
  ['skitter','flank', ['Parásito lateral','Flank Parasite'], ['Polilla del umbral','Threshold Moth'], ['Cangrejo inverso','Reverse Crab']],
  ['charger','lunge', ['Ciego del foso','Pit Blind'], ['Buzo de impulso','Burst Diver'], ['Lancero del barro','Mud Lancer'], ['Ciervo de cal viva','Quicklime Stag']],
  ['seer','artillery', ['Vigía del haz','Beam Watcher'], ['Ballestero coralino','Coral Arbalest'], ['Caracol de minas','Mine Snail'], ['Corista mudo','Silent Chorister']],
  ['brute','support', ['Camillero','Orderly'], ['Portaescudos','Shield Bearer'], ['Monaguillo','Acolyte'], ['Guardián del umbral','Threshold Guard'], ['Notario','Notary']],
  ['drowned','brood', ['Alevín de fosa','Pit Fry'], ['Saco ocre','Ochre Sac'], ['Madre del limo','Silt Mother'], ['Gusano de marea','Tide Worm'], ['Raíz ambulante','Walking Root']],
  ['shade','ambush', ['Cepo andante','Walking Trap'], ['Estatua del aire','Air Statue'], ['Espectro de cal','Lime Wraith'], ['Pescador de poza','Pool Fisher'], ['Eco de paso','Footstep Echo']],
  ['brute','territory', ['Farero de sebo','Tallow Keeper'], ['Rotonda de costillas','Rib Rotunda'], ['Perro de cerco','Ring Hound'], ['Estante errante','Wandering Shelf'], ['Yunque flotante','Floating Anvil']],
  ['shade','astral', ['Tiempo muerto','Dead Time'], ['Imán del reverso','Reverse Magnet'], ['Pliegue hambriento','Hungry Fold'], ['Órbita ciega','Blind Orbit'], ['Doble reflejado','Mirrored Double']]
];
export const bestiary = Object.keys(enemies).filter(id=>!enemies[id].boss);
enemyFamilies.forEach(([sprite, behavior, ...names], family) => {
  names.forEach((name, style) => {
    const id = 'creature'+family+'_'+style;
    const base = enemies[sprite];
    enemies[id] = { ...base, name, sprite, behavior, style, color: stages[family+1].color,
      hp: Math.round(base.hp*(1.12+style*.12)), speed: base.speed*(.91+style*.07), xp: base.xp+1 };
    bestiary.push(id);
  });
});
export function stageWaves(stage) {
  if (!stage.id) return waves;
  const faction = bestiary.filter(id=>id.startsWith('creature'+(stage.id-1)+'_'));
  const previous = bestiary.filter(id=>id.startsWith('creature'+(stage.id%9)+'_'));
  return waves.map((wave,index)=>({ ...wave, types: index===0 ? [wave.types[0]] :
    [...wave.types.slice(0,2),...faction.slice(0,Math.min(faction.length,index)),...(index>=4?previous.slice(0,2):[])] }));
}

const arsenalFamilies = [
  ['fan','salt',['Sal de esquirla','Shard Salt'],['Boca de cal','Lime Mouth'],['Sal mnemónica','Mnemonic Salt'],['Aguja de espuma','Foam Needle'],['Ráfaga inversa','Reverse Salvo']],
  ['pierce','harpoon',['Lanza de la marea negra','Black Tide Lance'],['Espina de quilla','Keel Spine'],['Abrecauces','Channel Opener'],['Virote de sodio','Sodium Bolt'],['Sonda fosforescente','Phosphor Probe']],
  ['pulse','bell',['Gong del estuario','Estuary Gong'],['Coro de mortaja','Shroud Choir'],['Resonador de costilla','Rib Resonator'],['Toque de queda','Curfew Bell'],['Pulso de hierro','Iron Pulse']],
  ['orbit','blade',['Corona partida','Split Crown'],['Agujas del meridiano','Meridian Needles'],['Filo de vidrio','Glass Edge'],['Anillo de bronce','Bronze Ring'],['Astrolabio de vidrio','Glass Astrolabe']],
  ['burn','lantern',['Lumbre en préstamo','Borrowed Ember'],['Instrumento de cauterio','Cautery Tool'],['Candela de médula','Marrow Candle'],['Lámpara del ausente','Absent Lamp'],['Faro inverso','Reverse Beacon']],
  ['trap','mine',['Red de estopa','Tow Net'],['Trampa de coral','Coral Trap'],['Sepultura a presión','Pressure Grave'],['Peine de muelle','Quay Comb'],['Cordón del fosero','Gravedigger Cord']],
  ['summon','lantern',['Larvas del otro lado','Beyond Larvae'],['Boya viviente','Living Buoy'],['Lector de ecos','Echo Reader'],['Cangrejo notarial','Notary Crab'],['Custodio de latón','Brass Custodian']],
  ['curse','resin',['Juramento del reverso','Reverse Oath'],['Nombre prestado','Borrowed Name'],['Libro de ceniza','Ash Book'],['Firma ahogada','Drowned Signature'],['Deuda de mármol','Marble Debt']],
  ['gravity','prayer',['Espejo dimensional','Dimensional Mirror'],['Singularidad prohibida','Forbidden Singularity'],['Mesa de ángulos','Angle Table'],['Ancla sin fondo','Bottomless Anchor'],['Corte de horizonte','Horizon Cut'],['Dos puertas','Two Gates']],
  ['tendril','blade',['Tentáculos del abismo','Abyssal Tendrils'],['Pulmón de repuesto','Spare Lung'],['Mano de esponja','Sponge Hand'],['Vértebra hambrienta','Hungry Vertebra'],['Ojos del vacío','Eyes of the Void'],['Marea bajo la piel','Tide Beneath Skin']]
];
const familyNotes = {
  fan:['Ráfaga dirigida','Aimed fan'], pierce:['Proyectiles perforantes','Piercing shots'], pulse:['Ondas que empujan','Repelling pulses'],
  orbit:['Filos orbitales','Orbiting blades'], burn:['Brasas persistentes','Lingering embers'], trap:['Cargas de proximidad','Proximity traps'],
  summon:['Invocación que dispara sola','Summon that shoots independently'], curse:['Marca y descarga en cadena','Mark and chain discharge'],
  gravity:['Arrastra criaturas hacia un foco','Pulls enemies toward a focus'], tendril:['Barrido de corto alcance','Short-range sweep']
};
arsenalFamilies.forEach(([family,glyph,...names], index) => names.forEach((name, style) => {
  const evolution = style === 4 || style === 5;
  const id = 'arm'+index+'_'+style;
  weapons[id] = { name, glyph, family, style, stage: Math.min(9,1+index), cooldown: 1.38 + (style%3)*.37,
    color: ['#e6b180','#a0d4aa','#98e6d6','#ef9ea5','#c395f3'][index%5],
    desc: familyNotes[family].map((note,i)=>note+(evolution?(i?' · Evolution':' · Evolución'):'')),
    ...(evolution ? { evolves: 'arm'+index+'_'+(style===4?0:2), recipe: ['resin','prayer','boots','coat'][index%4] } : {})
  };
}));
weapons.tempest.recipe = 'resin';
weapons.choir.recipe = 'prayer';
for (const id of ['salt','bell','blade','lantern','harpoon','mine','tempest','choir']) weapons[id].stage = 0;

export const investigators = [
  [['El Investigador','The Investigator'],'salt',100,1,1,0,0],
  [['Bruja del Vacío','Void Witch'],'lantern',78,1.04,1.16,20,1],
  [['Médico de la Peste','Plague Doctor'],'arm4_1',121,.93,1,0,2],
  [['El Ahogado','The Drowned'],'arm1_0',110,.95,1,0,3],
  [['El Exorcista','The Exorcist'],'bell',104,1,1.08,0,4],
  [['Astrónoma Ciega','Blind Astronomer'],'arm3_1',84,1.07,1.19,10,5],
  [['Heredero de Innsmouth','Innsmouth Heir'],'arm9_0',108,1,1.1,15,6],
  [['Monja del Eclipse','Eclipse Nun'],'arm2_1',95,1.02,1,0,7],
  [['Sepulturero','Gravedigger'],'mine',126,.9,1.09,0,8],
  [['El Soñador','The Dreamer'],'arm8_0',86,1.13,1,10,9],
  [['Autómata de Latón','Brass Automaton'],'harpoon',135,.91,1.12,0,5],
  [['Profeta Sin Rostro','Faceless Prophet'],'arm7_0',88,1.02,1.23,30,9]
].map(([name,weapon,hp,speed,power,sanityCost,unlock],index)=>({id:index,name,weapon,hp,speed,power,sanityCost,unlock}));

export const relics = [];
const relicFamilies = [
  ['vitality',['Vertebra','Vertebra'],['Salmuera','Brine'],['Broche','Brooch'],['Vellón','Fleece'],['Lastre','Ballast'],['Branquias','Gills']],
  ['speed',['Pluma','Feather'],['Estribo','Stirrup'],['Hebilla','Buckle'],['Espuela','Spur'],['Cuerda','Rope'],['Quilla','Keel']],
  ['power',['Marfil','Ivory'],['Ópalo','Opal'],['Tiza','Chalk'],['Prisma','Prism'],['Dentina','Dentine'],['Ceniza','Ash']],
  ['reach',['Boya','Buoy'],['Red','Net'],['Sonda','Probe'],['Brújula','Compass'],['Anzuelo','Hook'],['Imán','Magnet']],
  ['guard',['Vela','Candle'],['Copal','Copal'],['Dije','Charm'],['Velo','Veil'],['Ancla','Anchor'],['Sello','Seal']]
];
relicFamilies.forEach(([stat,...names],family)=>names.forEach((name,tier)=>relics.push({
  id: 'relic'+family+'_'+tier, stat, name, tier,
  value: [4,.025,.035,7,.027][family]*(tier+1)
})));

export const fieldUpgrades = [];
const modifiers = [['damage','Daño','Damage',.08],['cadence','Cadencia','Cadence',.08],['area','Área','Area',.12],
  ['push','Empuje','Knockback',.13],['pickup','Atracción','Pickup',5],['armor','Armadura','Armor',.025],
  ['fleet','Velocidad','Speed',.035],['renewal','Regeneración','Regeneration',.14],['fortune','Experiencia','Experience',.09],
  ['focus','Crítico','Critical',.028],['charge','Recarga de esquiva','Dodge recovery',.12],['shell','Salud máxima','Maximum health',7]];
arsenalFamilies.forEach(([family],index)=>modifiers.forEach(([stat,es,en,value],n)=>{
  const id = 'study'+index+'_'+n;
  const local = familyNotes[family];
  upgrades[id] = { name: [es+' · '+local[0],en+' · '+local[1]], desc: [n===2 || n===3 || n===0 || n===1 ? 'Modifica esta familia de armas.' : 'Bonificación global durante la expedición.',
    n===2 || n===3 || n===0 || n===1 ? 'Modifies this weapon family.' : 'Global bonus for the expedition.'],
    color: '#b4cdd8', glyph: 'prayer', max: 1, family, stat, value: value*(index%3===0?1.1:1) };
  fieldUpgrades.push(id);
}));
