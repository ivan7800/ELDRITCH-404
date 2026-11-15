import { arena, weapons, upgrades, enemies, stages, stageWaves, investigators, playModes, expeditionTime, expeditionOaths, signatures } from './content.mjs';
import { clamp, distance2, angleTo, seeded, SpatialGrid, Pool } from './math.mjs';

export class Expedition {
  constructor({ seed = Date.now(), difficulty = 'standard', veteran = false, stage = 0, character = 0, mode, rival = false, length, perks = {}, openArsenal = stage, guide = false, oath = '' } = {}) {
    this.oath = mode==='story' && Object.hasOwn(expeditionOaths,oath) ? oath : '';
    this.config = { seed, difficulty, veteran, stage, character, mode, rival, length, perks, openArsenal, guide, oath:this.oath };
    this.expanded = !!mode;
    this.playMode = Object.hasOwn(playModes, mode) ? mode : 'story';
    this.stage = stages[stage] ?? stages[0];
    this.character = investigators[character] ?? investigators[0];
    this.waveTable = stageWaves(this.stage);
    this.bossId = rival ? this.stage.optional : this.stage.main;
    this.duration = expeditionTime(this.stage,this.playMode,length ?? .75,this.oath);
    this.bossAt = this.duration;
    this.clearCount = 0;
    this.perks = this.playMode === 'challenge' ? {} : perks;
    this.defeatedKinds = new Set();
    this.modifiers = {};
    this.landmarkTimer = 27;
    this.random = seeded(seed);
    this.seed = seed;
    this.time = 0;
    this.nextWave = .7;
    const hp = this.character.hp + (this.perks.vitality ?? 0);
    this.player = { x: 864, y: 637, hp, maxHp: hp, dx: 1, dy: 0, hurt: 0, dash: 0, dashCooldown: 0 };
    this.difficulty = difficulty;
    this.sanity = clamp(100-this.character.sanityCost+(this.perks.sanity ?? 0),0,expeditionOaths[this.oath]?.sanity ?? 100);
    this.corruption = this.playMode === 'nightmare' ? 3 : 0;
    this.mutation = false;
    this.arsenal = { [this.character.weapon]: 1 };
    this.cooldowns = {};
    this.passives = veteran && this.playMode !== 'challenge' ? { boots: 1 } : {};
    this.enemies = [];
    this.shots = new Pool(300);
    this.gems = new Pool(360);
    this.effects = new Pool(240);
    this.hazards = new Pool(110);
    this.grid = new SpatialGrid();
    this.usedSites = new Set();
    this.events = [];
    this.level = 1;
    this.xp = 0;
    this.kills = 0;
    this.boss = null;
    this.mode = 'play';
    this.choices = [];
    this.firstKill = true;
    this.id = 0;
  }
  get goal() { return 5 + (this.level - 1) * 7 + Math.floor((this.level - 1) ** 2 * .9); }
  emit(type, value) { this.events.push({ type, value }); }
  tide(time = this.time) { return time >= this.duration*.61 ? 'deep' : time >= this.duration*.19 ? 'tide' : 'low'; }
  phase() { return this.boss ? 'boss' : this.tide(); }
  get harbourStory() { return this.stage.id===0 && this.config.mode==='story'; }
  get floodedBeacon() { return this.harbourStory && this.tide()!=='low'; }
  changeSanity(delta) {
    if (delta < 0) delta *= this.character.trait?.sanityLoss ?? 1;
    const before = this.sanity;
    this.sanity = clamp(before+delta,0,100);
    if (before>28 && this.sanity<=28) this.emit('sanity-low',28);
    else if (before>55 && this.sanity<=55) this.emit('sanity-low',55);
  }
  mod(stat, family = '') { return this.modifiers[stat+family] ?? 0; }

  update(dt, input = {}, view = { width: 560, height: 344 }) {
    if (this.mode !== 'play') return;
    const previousTime = this.time;
    this.time += dt;
    if (this.harbourStory && this.tide()!==this.tide(previousTime)) this.emit('harbour-tide',this.tide());
    if (this.config.guide) {
      for (const [at,cue] of [[.35,'move'],[4,'fragments'],[10,'dash'],[19,'ritual']]) {
        if (previousTime < at && this.time >= at) this.emit('guide',cue);
      }
    }
    if (this.mod('renewal') && this.player.hp>0) this.player.hp = Math.min(this.player.maxHp,this.player.hp+dt*this.mod('renewal'));
    this.move(dt, input);
    if (input.interact) this.openRitual();
    if (this.mode !== 'play') return;
    this.spawnWaves(view);
    this.landmark();
    this.moveEnemies(dt);
    this.grid.reset(this.enemies);
    this.fireWeapons(dt);
    this.updateShots(dt);
    this.updateHazards(dt);
    this.updateEffects(dt);
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
    this.collect(dt);
    if (this.player.hp <= 0) this.finish('lost');
    else if (this.boss && this.boss.hp <= 0) {
      if (this.playMode === 'endless') {
        this.boss = null;
        this.clearCount++;
        this.bossAt = this.time + Math.max(44,94-this.clearCount*6);
        this.bossId = this.bossId===this.stage.main ? this.stage.optional : this.stage.main;
        this.corruption = Math.min(8,this.corruption+1);
        this.emit('endless-clear');
      } else this.finish('won');
    }
    else if (this.xp >= this.goal) this.offerUpgrades();
  }
  current() {
    return this.stage.id===3 ? {x:Math.sin(this.time*.32)*19,y:Math.cos(this.time*.28)*15} : null;
  }
  move(dt, input) {
    const p = this.player;
    const x = input.x ?? 0;
    const y = input.y ?? 0;
    const length = Math.hypot(x, y);
    p.hurt = Math.max(0, p.hurt - dt);
    p.dash = Math.max(0, p.dash - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (length > .01 && p.dash === 0) {
      p.dx = x / length;
      p.dy = y / length;
    }
    if (input.dash && p.dashCooldown === 0) {
      p.dash = .19;
      p.dashCooldown = Math.max(1.25,3-this.mod('charge')-(this.character.trait?.dash ?? 0));
      this.effect('ring', p.x, p.y, 24, '#b7f5e3', .22);
      this.emit('dash');
    }
    const speed = p.dash ? 328 : (length > .01 ? Math.min(length, 1) * (118 + 13 * (this.passives.boots ?? 0)) *
      this.character.speed*(1+(this.perks.speed??0)+this.mod('fleet')+(this.sanity<=28?.08:0)+(this.character.trait?.speed??0)) : 0);
    p.x = clamp(p.x + p.dx * speed * dt, 24, arena.width - 24);
    p.y = clamp(p.y + p.dy * speed * dt, 24, arena.height - 24);
    const current = this.current();
    if (current) {
      p.x = clamp(p.x+current.x*dt,24,arena.width-24);
      p.y = clamp(p.y+current.y*dt,24,arena.height-24);
    }
    p.walk = speed > 0;
  }
  nearestSite() {
    return this.stage.sites.find(site => this.siteAvailable(site) && distance2(site, this.player) <= 51 ** 2);
  }
  siteAvailable(site) {
    return !!site.ritual && (site.ritual !== 'signal' || this.playMode === 'story') &&
      !(site.ritual==='heal' && expeditionOaths[this.oath]?.closeChapel) && !this.usedSites.has(site.id ?? site.ritual);
  }
  openRitual() {
    const site = this.nearestSite();
    if (!site) return;
    this.ritual = site.ritual;
    this.mode = 'ritual';
    this.emit('ritual', site.ritual);
  }
  resolveRitual(accept) {
    if (this.mode !== 'ritual') return;
    const ritual = this.ritual;
    this.mode = 'play';
    if (!accept) return;
    const p = this.player;
    this.usedSites.add(ritual==='signal'?this.stage.dispatch.id:ritual);
    if (ritual==='signal') {
      p.hp=Math.min(p.maxHp,p.hp+18);
      this.xp+=9;
      this.emit('discovery',this.stage.id);
    }
    if (ritual === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + (this.character.id===2?60:42)*(this.character.trait?.healing??1));
      this.changeSanity(22);
    }
    if (ritual === 'gather') {
      this.xp += (this.floodedBeacon ? 29 : 15) + this.level * 2;
      this.changeSanity(this.floodedBeacon ? -34 : -23);
      this.corruption += this.floodedBeacon ? 2 : 1;
    }
    if (ritual === 'blood') {
      this.changeSanity(-48);
      this.corruption += 2;
      this.mutation = this.character.id===6 || this.character.id===9 ? 'flow' : this.character.id===2 || this.character.id===8 ? 'husk' : true;
    }
    this.effect('ring', p.x, p.y, 94, '#bb8ef8', .8);
    this.emit('ritual-accept', ritual);
  }
  spawnWaves(view) {
    if (this.time >= this.bossAt && !this.boss) {
      const p = this.player;
      const dx = p.x < arena.width / 2 ? 1 : -1;
      this.boss = this.spawn(this.bossId, p.x + dx * 215, p.y - 70);
      this.emit('boss',this.bossId);
    }
    if (this.time < this.nextWave || this.enemies.length >= 225) return;
    const waveTime = this.time * 300 / this.duration;
    const wave = this.waveTable.findLast(item => waveTime >= item.at) ?? this.waveTable[0];
    const opening = this.harbourStory && this.nextWave<1;
    const breakInWaves = this.config.mode==='story' && !this.boss && this.stage.breather;
    const easing = breakInWaves && waveTime>=breakInWaves.from && waveTime<breakInWaves.to ? breakInWaves : null;
    this.nextWave = this.time + wave.gap*(this.playMode==='nightmare'?.78:easing?.gap ?? 1);
    let count = this.boss ? 1 : waveTime < 24 ? 2 : waveTime < 94 ? 3 : (easing?.max ?? 4);
    if (this.playMode==='nightmare' || this.clearCount>=2) count++;
    if (this.corruption && this.random() < this.corruption * .19) count++;
    for (let i = 0; i < count && this.enemies.length<225; i++) {
      const bearing = this.random() * Math.PI * 2;
      const dx = Math.cos(bearing);
      const dy = Math.sin(bearing);
      const p = this.player;
      const radius = opening ? 133+i*19 : Math.min(view.width / 2 / Math.max(.01, Math.abs(dx)), view.height / 2 / Math.max(.01, Math.abs(dy))) + 20;
      let x = p.x + dx * radius;
      let y = p.y + dy * radius;
      if (x < 18 || x > arena.width - 18) x = p.x - dx * radius;
      if (y < 18 || y > arena.height - 18) y = p.y - dy * radius;
      let id = wave.types[Math.floor(this.random() * wave.types.length)];
      if (this.sanity <= 55 && this.random() < (this.sanity<=28?.26:.17)) id = 'shade';
      this.spawn(id, x, y);
    }
  }
  spawn(kind, x, y) {
    const def = enemies[kind];
    const scale = (this.difficulty === 'story' ? .79 : 1) * (1 + this.corruption * .08) * (1+Math.min(12,this.clearCount)*.055);
    const hp = Math.round(def.hp * scale);
    const enemy = { id: this.id++, kind, x: clamp(x, 16, arena.width-16), y: clamp(y, 16, arena.height-16),
      hp, maxHp: hp, spawnedAt:this.time, timer: def.boss ? .7 : 1.15 + this.random()*2.8, action: 'move', aim: 0, sequence: 0,
      flash: 0, stun: 0, orbitHit: -1, facing: 1, phase: this.random()*Math.PI*2 };
    if (def.behavior) enemy.skillAt=this.time+enemy.timer+1.15;
    this.enemies.push(enemy);
    return enemy;
  }
  landmark() {
    const i = this.stage.id;
    if (!i || i===3 || this.time<this.landmarkTimer) return;
    this.landmarkTimer = this.time + 19 - i*.7;
    this.emit('landmark',i);
    const p = this.player;
    if (i===6) {
      this.effect('ring',p.x,p.y,110,'#b3a5ff',1.05);
      for (const hazard of this.hazards.live) {
        if (hazard.kind==='bolt' && hazard.delay<=0 && hazard.life>1.05) hazard.reverseAt=this.time+.95;
      }
      return;
    }
    if (i===7) {
      for (let n=-1;n<=1;n++) this.hazard('bolt',p.x+n*36,p.y-133,Math.PI/2,105,.9);
      return;
    }
    const count = i===2 ? 3 : i===5 ? 5 : i===9 ? 6 : 4;
    for (let n=0;n<count;n++) {
      const a = i===4 ? n*Math.PI/2 : i===8 ? 0 : n*6.283/count;
      const r = i===8 ? n*37-55 : 47+n*4;
      this.hazard('seal',p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,0,0,.94+n*.1);
    }
  }
  moveEnemies(dt) {
    const p = this.player;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const def = enemies[enemy.kind];
      const dist = Math.sqrt(distance2(enemy, p));
      const aim = angleTo(enemy, p);
      let bearing = aim;
      let speed = def.speed * (this.difficulty === 'story' ? .9 : 1);
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.timer -= dt;
      switch (def.boss ? 'boss' : def.sprite ?? enemy.kind) {
        case 'skitter':
          bearing += Math.sin(this.time * 6 + enemy.phase) * .62;
          speed *= 1 + Math.sin(this.time * 4 + enemy.phase) * .18;
          break;
        case 'brute':
          if (enemy.hp < enemy.maxHp / 2) speed *= 1.5;
          break;
        case 'seer':
          if (dist < 104) speed *= -.65;
          else if (dist < 156) bearing += Math.PI / 2;
          if (dist < 211 && enemy.timer <= 0) {
            this.hazard('bolt', enemy.x, enemy.y, aim, 118);
            enemy.timer = 3.6;
          }
          break;
        case 'charger':
          if (enemy.action === 'move' && dist < 145 && enemy.timer <= 0) {
            enemy.action = 'tell';
            enemy.aim = aim;
            enemy.timer = .66;
          }
          if (enemy.action === 'tell') {
            speed = 0;
            if (enemy.timer <= 0) { enemy.action = 'charge'; enemy.timer = .53; }
          }
          if (enemy.action === 'charge') {
            speed = 237;
            bearing = enemy.aim;
            if (enemy.timer <= 0) { enemy.action = 'move'; enemy.timer = 2.5; }
          }
          break;
        case 'shade':
          bearing += Math.sin(this.time * 3.7 + enemy.phase) * .94;
          if (enemy.timer <= 0 && dist > 55 && dist < 155) {
            this.effect('ring', enemy.x, enemy.y, 20, '#a0adec', .35);
            enemy.x += Math.cos(aim + .65) * 37;
            enemy.y += Math.sin(aim + .65) * 37;
            enemy.timer = 3.15;
          }
          break;
        case 'boss':
          speed = this.bossPattern(enemy, dist);
          break;
      }
      if (def.behavior) {
        const speedFactor = this.creatureSkill(enemy, def, p, dist, aim);
        speed *= speedFactor;
      }
      if (enemy.stun) speed *= -.37;
      enemy.x = clamp(enemy.x + Math.cos(bearing)*speed*dt, 14, arena.width-14);
      enemy.y = clamp(enemy.y + Math.sin(bearing)*speed*dt, 14, arena.height-14);
      if (speed !== 0) enemy.facing = Math.cos(bearing) >= 0 ? 1 : -1;
      if (distance2(p, enemy) < (def.radius + 8) ** 2) this.hurt(def.contact);
    }
  }
  creatureSkill(enemy, def, player, distance, aim) {
    if (this.time < (enemy.skillAt ?? 0) || distance>220) return 1;
    enemy.skillAt = this.time + 3.2 + def.style*.66;
    const style = def.style;
    switch (def.behavior) {
      case 'tether':
        if (style===1) enemy.shield = this.time+1.7;
        else if (style===2 && this.enemies.length<220) this.spawn('skitter',enemy.x+15,enemy.y);
        else this.hazard('bolt',enemy.x,enemy.y,aim,154,.3);
        break;
      case 'flank':
      case 'ambush':
        enemy.x += Math.cos(aim+(style%2?1:-1)*1.25)*(34+style*7);
        enemy.y += Math.sin(aim+(style%2?1:-1)*1.25)*(34+style*7);
        this.effect('ring',enemy.x,enemy.y,25,def.color,.4);
        break;
      case 'lunge':
        if (enemy.action==='move') enemy.timer = Math.min(enemy.timer,.15);
        this.hazard('seal',player.x,player.y,0,0,.78+style*.14);
        break;
      case 'artillery':
      case 'astral':
        if (distance<188 && this.hazards.live.length<48) {
          const occupied = this.config.mode==='story' ? this.hazards.live.filter(hazard=>hazard.kind==='bolt' &&
            distance2(hazard,player)<200**2).length : 0;
          const volley = Math.min(3,style+1,Math.max(0,10-occupied));
          for (let n=0;n<volley;n++) {
            this.hazard('bolt',enemy.x,enemy.y,aim+(n-(volley-1)/2)*.34,112+style*9,.58+n*.09);
          }
        }
        break;
      case 'support': {
        const ally = this.enemies.find(e=>e!==enemy && e.hp>0 && e.hp<e.maxHp && !enemies[e.kind].boss && distance2(e,enemy)<95**2);
        if (ally) {
          if (style%2) ally.shield=this.time+1.8;
          else ally.hp=Math.min(ally.maxHp,ally.hp+12+style*5);
          this.effect('ring',ally.x,ally.y,24,'#9bd7bc',.55);
        }
        break;
      }
      case 'brood':
        if (this.enemies.length<215) this.spawn(style%2?'skitter':'drowned',enemy.x-11,enemy.y+13);
        break;
      case 'territory':
        for (let n=0;n<1+style%3;n++) this.hazard('seal',player.x+Math.cos(aim+n*2)*33,player.y+Math.sin(aim+n*2)*33,0,0,1+n*.18);
        break;
    }
    return 1+style*.032;
  }
  bossPattern(boss, distance) {
    const pattern = enemies[boss.kind].pattern;
    const phaseTwo = boss.hp <= boss.maxHp * .5;
    const signatureReady = this.config.mode==='story' && boss.kind===this.stage.main &&
      this.stage.signature && !boss.didSignature;
    if (phaseTwo && !boss.second) {
      boss.second = true;
      boss.phaseAt = this.time;
      if (boss.action === 'move') boss.timer = signatureReady ? .55 : Math.max(boss.timer,.55);
      this.emit('boss-phase',boss.kind);
    }
    if (boss.action === 'move' && boss.timer <= 0) {
      boss.action = 'tell';
      boss.timer = (phaseTwo ? (this.harbourStory && boss.kind==='boss' ? .87 : .81) : 1.15)*(this.playMode==='nightmare'?.81:1);
      boss.sequence++;
      boss.tellSecond = phaseTwo;
      boss.attack = this.bossAttack(boss);
      this.emit('boss-tell',boss.attack);
      boss.aim = angleTo(boss, this.player);
      if (Object.hasOwn(signatures,boss.attack)) {
        boss.didSignature = true;
        this.castSignature(boss,signatures[boss.attack]);
      }
      else if (pattern!=='tide') {
        this.castBoss(boss,boss.attack,phaseTwo);
      }
      else if (boss.attack === 'surge') {
        boss.didSurge = true;
        // Leave a traversable gap on a line crossing the player's starting position.
        const p = this.player;
        const dx = Math.abs(p.dx)>.65 ? 0 : 1;
        const dy = 1-dx;
        const gap = boss.sequence%2 ? -1 : 1;
        const axis = dx ? p.x : p.y;
        const span = dx ? arena.width : arena.height;
        const center = clamp(axis,185,span-185);
        for (let n=-3;n<=3;n++) {
          if (n===gap) continue;
          this.hazard('seal',dx?center+n*48:p.x,dy?center+n*48:p.y,0,0,boss.timer+Math.abs(n)*.055);
        }
      }
      else if (boss.attack === 'seals') {
        const p = this.player;
        const count = phaseTwo ? 4 : 2;
        for (let n = 0; n < count; n++) {
          const angle = boss.aim + n * Math.PI / 2;
          const radius = n ? 47 : 0;
          this.hazard('seal', p.x + Math.cos(angle)*radius, p.y + Math.sin(angle)*radius, 0, 0, boss.timer);
        }
      }
    }
    if (boss.action === 'tell' && boss.timer <= 0) {
      if (pattern==='tide' && (boss.attack ?? (boss.sequence%2 ? 'ring' : 'seals'))==='ring') {
        const second = boss.tellSecond ?? phaseTwo;
        const count = second ? 18 : 11;
        for (let i = 0; i < count; i++) this.hazard('bolt', boss.x, boss.y, boss.aim + (i+.5) * Math.PI*2/count, second ? 151 : 117);
      }
      boss.action = 'move';
      boss.timer = phaseTwo ? (signatureReady && !boss.didSignature ? .55 : 1.65) : 2.35;
    }
    return boss.action === 'tell' || distance < 66 ? 0 : (phaseTwo ? 65 : 42);
  }
  bossAttack(boss) {
    const pattern = enemies[boss.kind].pattern;
    if (pattern === 'tide') {
      if (this.harbourStory && boss.kind==='boss' && boss.second && boss.tellSecond && (!boss.didSurge || boss.sequence%3===0)) return 'surge';
      return boss.sequence % 2 === 0 ? 'seals' : 'ring';
    }
    if (this.config.mode==='story' && boss.kind===this.stage.main && this.stage.signature && boss.tellSecond && !boss.didSignature)
      return this.stage.signature;
    const alternate = this.stage.id === 0 ? 'cross' : this.stage.pattern;
    return boss.kind === this.stage.optional && boss.sequence % 3 === 0 && alternate !== 'tide' ? alternate : pattern;
  }
  castSignature(boss, signature) {
    const p = this.player, delay = boss.timer+.25;
    for (const [x,y,offset] of signature.seals ?? []) {
      this.hazard('seal',p.x+x,p.y+y,0,0,delay+offset);
    }
    for (const [x,y,angle,offset] of signature.lanes ?? []) {
      this.hazard('bolt',p.x+x,p.y+y,angle,121,delay+offset);
    }
    for (const [angle,offset] of signature.volley ?? []) {
      this.hazard('bolt',boss.x,boss.y,boss.aim+angle,126,delay+offset);
    }
  }
  castBoss(boss, pattern, second) {
    const p = this.player, a = boss.aim, delay = boss.timer;
    const seal = (x,y,d=delay)=>this.hazard('seal',x,y,0,0,d);
    const shot = (x,y,bearing,speed=153,d=delay)=>this.hazard('bolt',x,y,bearing,speed,d);
    const count = second ? 7 : 4;
    for (let i=0;i<count;i++) {
      const circle = a+i*6.283/count;
      if (pattern==='fan') shot(boss.x,boss.y,a+(i-count/2)*.24,168);
      if (pattern==='cross') seal(p.x+Math.cos(i*Math.PI/2)*(27+i*9),p.y+Math.sin(i*Math.PI/2)*(27+i*9));
      if (pattern==='pursuit') seal(p.x+p.dx*i*18,p.y+p.dy*i*18,delay+i*.11);
      if (pattern==='shell') shot(boss.x+Math.cos(circle)*43,boss.y+Math.sin(circle)*43,circle,108);
      if (pattern==='roots') seal(p.x+Math.cos(circle)*45,p.y+Math.sin(circle)*45,delay+(i%3)*.17);
      if (pattern==='clock') shot(boss.x,boss.y,circle+boss.sequence*.53,125,delay+i*.12);
      if (pattern==='gates') shot(p.x+(i%2?120:-120),p.y+(i-count/2)*18,i%2?Math.PI:0,139);
      if (pattern==='sweep') seal(p.x+(i-count/2)*31,p.y+Math.sin(boss.sequence)*28,delay+i*.1);
      if (pattern==='spiral') shot(boss.x,boss.y,circle+boss.sequence,110+i*14,delay+i*.07);
    }
  }
  hazard(kind, x, y, angle, speed, delay = 0) {
    this.hazards.add({ kind, x, y, reverseAt:0, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, delay,
      life: kind === 'seal' ? delay+.25 : 4, radius: kind === 'seal' ? 28 : 6 });
  }
  updateHazards(dt) {
    for (let i = this.hazards.live.length - 1; i >= 0; i--) {
      const h = this.hazards.live[i];
      if (h.reverseAt && this.time>=h.reverseAt) {
        h.reverseAt=0; h.vx *= -.8; h.vy *= -.8;
      }
      h.life -= dt;
      h.delay -= dt;
      if (h.delay<=0) { h.x += h.vx * dt; h.y += h.vy * dt; }
      if (h.delay <= 0 && distance2(h, this.player) < (h.radius+5)**2) {
        if (this.hurt(h.kind === 'seal' ? 27 : 14) && h.kind === 'bolt') h.life = 0;
      }
      if (h.life <= 0) this.hazards.remove(i);
    }
  }
  hurt(amount) {
    const p = this.player;
    if (p.hurt || p.dash) return false;
    const resistance = Math.min(.62,(this.perks.guard??0)+this.mod('armor')+(this.character.trait?.armor??0)+(this.mutation==='husk'?.16:0));
    p.hp = Math.max(0, p.hp - Math.round(amount * (this.difficulty === 'story' ? .66 : 1)*(1-resistance)));
    if (this.expanded && this.character.id===11 && this.sanity>16) this.changeSanity(-Math.min(2,this.sanity-16));
    p.hurt = .57;
    this.emit('hurt');
    return true;
  }
  nearest(range, from = this.player) {
    let closest = null;
    let best = range * range;
    for (const e of this.grid.near(from.x, from.y, range)) {
      if (e.hp <= 0) continue;
      const d = distance2(from, e);
      if (d < best) { closest = e; best = d; }
    }
    return closest;
  }
  strike(enemy, amount, push = 0) {
    if (enemy.hp <= 0) return;
    const critical = this.random() < .085+this.mod('focus');
    const multiplier = (1 + (this.passives.resin ?? 0)*.12+(this.perks.power??0)) *
      (this.mutation===true ? 1.28 : 1) * this.character.power * (1+(this.character.trait?.damage??0)+
      (this.sanity<56?(this.character.trait?.lowSanityDamage??0):0)) * (enemy.shield>this.time?.53:1) *
      (this.sanity<=28?1.16:1);
    enemy.hp -= Math.round(amount * multiplier * (critical ? 1.65 : 1));
    enemy.flash = .115;
    if (push && !enemies[enemy.kind].boss) enemy.stun = Math.max(enemy.stun, push);
    if (critical) this.effect('spark', enemy.x, enemy.y-9, 9, '#f9d098', .27);
    if (enemy.hp > 0) return;
    this.kills++;
    this.defeatedKinds.add(enemy.kind);
    this.effect('burst', enemy.x, enemy.y, 18, enemies[enemy.kind].color, .36);
    const xp = enemies[enemy.kind].xp;
    if (xp) {
      const value = xp*(1+this.mod('fortune')+(this.playMode==='quick'?.52:0)) + (this.firstKill ? 3 : 0);
      const gem = this.gems.add({ x: enemy.x, y: enemy.y, value, magnet: this.firstKill });
      if (!gem) this.xp += value;
      this.firstKill = false;
      if (this.kills % 27 === 0) this.gems.add({ x: enemy.x+11, y: enemy.y-5, value: -13, magnet: false });
    }
    this.emit('kill', enemy.kind);
  }
  fireWeapons(dt) {
    const p = this.player;
    for (const [key, rank] of Object.entries(this.arsenal)) {
      const weapon = weapons[key];
      if (weapon.family) {
        this.fireExpanded(key,weapon,rank,dt);
        continue;
      }
      if (key === 'blade') {
        for (const point of this.blades()) {
          for (const e of this.grid.near(point.x, point.y, 45)) {
            if (e.orbitHit <= this.time && distance2(point, e) < (enemies[e.kind].radius + 9) ** 2) {
              this.strike(e, 13 + rank * 6, .17);
              e.orbitHit = this.time + .36;
            }
          }
        }
        continue;
      }
      this.cooldowns[key] = Math.max(0, (this.cooldowns[key] ?? 0) - dt);
      if (this.cooldowns[key]) continue;
      const target = this.nearest(key === 'bell' ? 67 + rank*11 : key === 'choir' ? 143 : 315);
      if (!target && key !== 'mine') continue;
      const angle = key==='harpoon' && this.harbourStory ? this.harpoonAim(target) : target ? angleTo(p, target) : Math.atan2(p.dy, p.dx);
      this.cooldowns[key] = weapon.cooldown * (1 - .07 * (rank - 1));
      this.emit('fire', key);
      switch (key) {
        case 'salt':
        case 'tempest': {
          const evolved = key === 'tempest';
          const count = evolved ? 9 : 2 + rank;
          for (let i = 0; i < count; i++) {
            const back = evolved && i > 4;
            const fan = evolved ? (back ? i - 6.5 : i - 2) : i - (count-1)/2;
            this.shot(p, angle + fan*.135 + (back ? Math.PI : 0), 460, .51, evolved ? 25 : 14+rank*5, evolved ? 3 : 1, 3, weapon.color);
          }
          break;
        }
        case 'harpoon':
          this.shot(p, angle, 500, .7, 30+rank*14, 3+rank*2, 4, weapon.color, this.harbourStory ? key : undefined);
          break;
        case 'bell':
        case 'choir':
          this.effect('pulse', p.x, p.y, key === 'choir' ? 132 : 62+rank*11, weapon.color, .38, 17+rank*14, key==='bell' && this.harbourStory ? .55 : .34);
          if (key === 'choir') this.effect('pulse', p.x, p.y, 172, '#aefff0', .43, 27, .24, .29);
          break;
        case 'lantern': {
          const offsets = [-1, 1, 0];
          for (let i = 0; i < rank; i++) this.effect('flame', target.x+offsets[i]*17, target.y+(i%2)*18, 26+rank*5, weapon.color, 2.24, 7+rank*4);
          break;
        }
        case 'mine':
          this.effect('mine', p.x - p.dx * 22, p.y - p.dy * 22, 36+rank*5, weapon.color, 9, 32+rank*17, .52, .48);
          break;
      }
    }
  }
  fireExpanded(id, weapon, rank, dt) {
    const {family,style,color,evolves} = weapon;
    const p = this.player;
    this.cooldowns[id] = Math.max(0,(this.cooldowns[id]??0)-dt);
    if (this.cooldowns[id]) return;
    const range = (['pulse','orbit','tendril'].includes(family) ? 100 : 300)*(1+this.mod('area',family));
    const target = this.nearest(range);
    if (!target && family!=='trap') return;
    const aim = target ? angleTo(p,target) : Math.atan2(p.dy,p.dx);
    const power = (17+rank*7+style*3+(evolves?21:0))*(1+this.mod('damage',family));
    const radius = (45+style*6+rank*6)*(1+this.mod('area',family));
    const push = .19+this.mod('push',family);
    const count = 1 + style%3 + Number(!!evolves);
    this.cooldowns[id] = weapon.cooldown * Math.max(.47,1-.09*rank-this.mod('cadence',family));
    this.emit('fire',id);
    switch (family) {
      case 'fan':
      case 'pierce':
        for (let i=0;i<count+1;i++) this.shot(p,aim+(i-count/2)*(family==='fan'?.18:.095),430+style*20,.64,power,family==='fan'?1+Number(!!evolves):4+style,3,color);
        break;
      case 'pulse':
        this.effect('pulse',p.x,p.y,radius+28,color,.4,power*1.5,push);
        if (evolves) this.effect('pulse',p.x,p.y,radius+49,color,.6,power,push,.35);
        break;
      case 'orbit':
      case 'burn':
      case 'summon':
        for (let i=0;i<count;i++) {
          const a = aim+i*6.283/count;
          const origin = family==='burn' ? target : p;
          const orbit = family==='orbit' ? 48+style*5 : 26+style*4;
          const kind = family==='summon' ? 'sentinel' : family==='orbit' ? 'orbit' : 'flame';
          this.effect(kind,origin.x+Math.cos(a)*orbit,origin.y+Math.sin(a)*orbit,radius*.65,color,1.7+rank*.23,power*.68,push);
        }
        break;
      case 'trap': {
        const facing = Math.atan2(p.dy,p.dx);
        for (let i=0;i<count;i++) this.effect('mine',p.x-Math.cos(facing+i*.48)*29,p.y-Math.sin(facing+i*.48)*29,radius,color,8,power*1.55,push,.33);
        break;
      }
      case 'curse': {
        const linked = [...this.grid.near(target.x,target.y,radius*2)].filter(e=>e.hp>0 && distance2(e,target)<(radius*2)**2).slice(0,2+count);
        linked.forEach((e,i)=>this.effect('pulse',e.x,e.y,radius*.47,color,.36,power*1.24,push,i*.16));
        break;
      }
      case 'gravity':
        this.effect('gravity',target.x,target.y,radius+15,color,1.65,power*.68,push);
        if (evolves) this.effect('gravity',p.x,p.y,radius,color,1.2,power*.55,push,.35);
        break;
      case 'tendril':
        for(let i=0;i<count;i++) this.effect('pulse',p.x+Math.cos(aim+i*.55)*43,p.y+Math.sin(aim+i*.55)*43,radius*.87,color,.33,power*1.45,push,i*.1);
        break;
    }
  }
  *blades() {
    const rank = this.arsenal.blade ?? 0;
    for (let i = 0; i < rank; i++) {
      const angle = this.time * 3.4 + i * Math.PI*2/rank;
      const r = 38 + rank*5;
      yield { x: this.player.x + Math.cos(angle)*r, y: this.player.y + Math.sin(angle)*r, angle };
    }
  }
  harpoonAim(nearest) {
    const p = this.player;
    const candidates = [];
    for (const enemy of this.grid.near(p.x,p.y,315)) {
      const distance = distance2(p,enemy);
      if (enemy.hp>0 && distance<315**2) candidates.push({enemy,distance,angle:angleTo(p,enemy)});
    }
    candidates.sort((a,b)=>a.distance-b.distance);
    let aim = angleTo(p,nearest), best = 0;
    for (const lead of candidates.slice(0,10)) {
      const dx = Math.cos(lead.angle), dy = Math.sin(lead.angle);
      let score = 0;
      for (const {enemy} of candidates) {
        const x = enemy.x-p.x, y = enemy.y-p.y;
        if (x*dx+y*dy>0 && Math.abs(x*dy-y*dx)<enemies[enemy.kind].radius+3) score++;
      }
      if (score>best) { best=score; aim=lead.angle; }
    }
    return aim;
  }
  shot(origin, angle, speed, life, damage, pierce, radius, color, weapon) {
    this.shots.add({ x: origin.x, y: origin.y-2, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life, damage, pierce, radius, color, weapon, hit: [] });
  }
  updateShots(dt) {
    for (let i = this.shots.live.length - 1; i >= 0; i--) {
      const shot = this.shots.live[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      for (const e of this.grid.near(shot.x, shot.y, 34)) {
        if (e.hp <= 0 || shot.hit.includes(e.id) || distance2(shot, e) >= (enemies[e.kind].radius + shot.radius) ** 2) continue;
        this.strike(e, shot.damage*(shot.weapon==='harpoon' && shot.hit.length ? 1.28 : 1), .15);
        shot.hit.push(e.id);
        shot.pierce--;
        if (!shot.pierce) break;
      }
      if (shot.life <= 0 || !shot.pierce) this.shots.remove(i);
    }
  }
  effect(kind, x, y, radius, color, life, damage = 0, push = 0, delay = 0) {
    this.effects.add({ kind, x, y, radius, color, life, maxLife: life, damage, push, delay, tick: 0, hit: [] });
  }
  updateEffects(dt) {
    for (let at = this.effects.live.length - 1; at >= 0; at--) {
      const effect = this.effects.live[at];
      if (effect.delay > 0) { effect.delay -= dt; continue; }
      effect.life -= dt;
      effect.tick -= dt;
      if (effect.kind === 'mine' && this.nearest(27, effect)) {
        effect.kind = 'pulse';
        effect.maxLife = effect.life = .32;
        this.emit('blast');
      }
      if (effect.kind === 'flame' && effect.tick <= 0) {
        effect.tick = .4;
        for (const e of this.grid.near(effect.x, effect.y, effect.radius+18)) {
          if (distance2(e, effect) <= effect.radius**2) this.strike(e, effect.damage);
        }
      }
      if (['gravity','sentinel','orbit'].includes(effect.kind) && effect.tick<=0) {
        effect.tick = effect.kind==='sentinel' ? .48 : .32;
        if (effect.kind==='sentinel') {
          const target = this.nearest(190,effect);
          if (target) this.shot(effect,angleTo(effect,target),345,.7,effect.damage,2,3,effect.color);
        } else {
          for (const e of this.grid.near(effect.x,effect.y,effect.radius)) {
            if (distance2(e,effect)>effect.radius**2 || e.hp<=0) continue;
            this.strike(e,effect.damage);
            if (effect.kind==='gravity' && !enemies[e.kind].boss) {
              const a=angleTo(e,effect);
              e.x+=Math.cos(a)*14; e.y+=Math.sin(a)*14;
            }
          }
          if (effect.kind==='orbit') {
            const bearing = angleTo(this.player,effect)+.86;
            effect.x=this.player.x+Math.cos(bearing)*55; effect.y=this.player.y+Math.sin(bearing)*55;
          }
        }
      }
      if (effect.kind === 'pulse') {
        const radius = effect.radius * (1 - effect.life/effect.maxLife);
        for (const e of this.grid.near(effect.x, effect.y, radius+32)) {
          if (distance2(e, effect) > (radius+enemies[e.kind].radius)**2 || effect.hit.includes(e.id)) continue;
          this.strike(e, effect.damage, effect.push);
          if (effect.push===.55 && this.harbourStory && e.hp>0 && !enemies[e.kind].boss) {
            const outward = angleTo(effect,e);
            e.x = clamp(e.x+Math.cos(outward)*18,14,arena.width-14);
            e.y = clamp(e.y+Math.sin(outward)*18,14,arena.height-14);
          }
          effect.hit.push(e.id);
        }
      }
      if (effect.life <= 0) this.effects.remove(at);
    }
  }
  collect(dt) {
    const p = this.player;
    const radius = 44 + (this.passives.prayer ?? 0)*14 + (this.perks.reach ?? 0) + this.mod('pickup') +
      (this.character.trait?.pickup??0) + (this.mutation==='flow'?27:0);
    for (let i = this.gems.live.length - 1; i >= 0; i--) {
      const gem = this.gems.live[i];
      const distance = Math.sqrt(distance2(gem, p));
      if (distance < 12) {
        if (gem.value < 0) p.hp = Math.min(p.maxHp, p.hp-gem.value);
        else this.xp += gem.value;
        this.gems.remove(i);
        this.emit('pickup');
      } else if (gem.magnet || distance < radius) {
        gem.magnet = true;
        const bearing = angleTo(gem, p);
        const speed = clamp(distance * 4, 135, 580);
        gem.x += Math.cos(bearing)*speed*dt;
        gem.y += Math.sin(bearing)*speed*dt;
      }
    }
  }
  offerUpgrades() {
    const replaced = new Set(Object.keys(this.arsenal).map(id => weapons[id].evolves));
    const owned = Object.keys(this.arsenal);
    const families = new Set(owned.map(id=>weapons[id].family).filter(Boolean));
    const candidates = Object.keys(weapons).filter(key => !weapons[key].evolves && !replaced.has(key) &&
      (this.arsenal[key] ?? 0) < 3 && (this.arsenal[key] || (owned.length < 6 && this.playMode!=='challenge' && weapons[key].stage<=this.config.openArsenal)));
    for (const [key, spec] of Object.entries(upgrades)) {
      if (key !== 'patch' && (this.passives[key] ?? 0) < spec.max && (!spec.family || families.has(spec.family))) candidates.push(key);
    }
    this.choices = Object.keys(weapons).filter(id=>this.arsenal[weapons[id].evolves]===3 && this.passives[weapons[id].recipe]).slice(0,3);
    if (this.level === 1 && this.character.id===0 && this.playMode!=='challenge') this.choices = ['bell', 'harpoon', 'salt'];
    else {
      while (this.choices.length < 3 && candidates.length) {
        this.choices.push(...candidates.splice(Math.floor(this.random() * candidates.length), 1));
      }
      if (!this.choices.length || (this.player.hp < this.player.maxHp * .55 && this.choices.length < 3)) this.choices.push('patch');
      const focusedRun = this.config.mode==='story' && this.stage.id>0;
      if (focusedRun && !this.choices.some(id=>this.arsenal[id] || weapons[id]?.evolves)) {
        const ownedUpgrade = owned.find(id=>this.arsenal[id]<3 && !weapons[id].evolves);
        if (ownedUpgrade) this.choices[0] = ownedUpgrade;
      }
      const health = this.player.hp/this.player.maxHp;
      const critical = focusedRun && health<.35;
      if (this.choices.length===3 && (critical || (this.level%4===0 && health<.7))) {
        const replace = this.choices.findLastIndex(id=>!weapons[id]?.evolves);
        if (replace>=0) this.choices[replace] = 'patch';
      }
    }
    this.mode = 'level';
    this.emit('level');
  }
  choose(key) {
    if (this.mode !== 'level' || !this.choices.includes(key)) return false;
    this.xp -= this.goal;
    this.level++;
    const weapon = weapons[key];
    if (weapon?.evolves) {
      delete this.arsenal[weapon.evolves];
      this.arsenal[key] = 1;
      this.emit('evolution', key);
    } else if (weapon) this.arsenal[key] = (this.arsenal[key] ?? 0) + 1;
    else if (key === 'patch') this.player.hp = Math.min(this.player.maxHp, this.player.hp + 32);
    else {
      this.passives[key] = (this.passives[key] ?? 0) + 1;
      const spec = upgrades[key];
      if (spec.stat) {
        const mod = spec.stat+(['damage','cadence','area','push'].includes(spec.stat)?spec.family:'');
        this.modifiers[mod]=(this.modifiers[mod]??0)+spec.value;
        if (spec.stat==='shell') { this.player.maxHp+=spec.value; this.player.hp+=spec.value; }
      }
      if (key === 'coat') {
        this.player.maxHp += 14;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 24);
      }
    }
    this.choices = [];
    this.mode = 'play';
    return true;
  }
  finish(mode) {
    this.mode = mode;
    this.emit(mode);
  }
}
