import { arena, enemies, sites } from './content.mjs';
import { clamp } from './math.mjs';
const rows = ['player','drowned','skitter','brute','seer','charger','shade','boss'];
const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.assets = {};
  }
  async load() {
    for (const name of ['sprites','quay','cast',...Array.from({length:9},(_,i)=>'arena'+(i+1)), ...sites.map(x => x.art)]) {
      const img = new Image();
      img.src = 'assets/' + name + '.png';
      this.assets[name] = img;
    }
    await Promise.all(Object.values(this.assets).map(img => img.decode()));
  }
  camera(p) {
    const height = 374;
    const width = clamp(height*this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight), 208, 960);
    const cw = Math.round(width / 2);
    if (cw !== this.canvas.width || this.canvas.height !== 187) {
      this.canvas.width = cw;
      this.canvas.height = 187;
    }
    return { width: cw*2, height, x: clamp(p.x-cw,0,arena.width-cw*2), y: clamp(p.y-height/2,0,arena.height-height) };
  }
  draw(game, reduced, contrast = false) {
    const cam = this.camera(game.player);
    const c = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = Math.round(cam.x/2);
    const cy = Math.round(cam.y/2);
    c.imageSmoothingEnabled = false;
    const backdrop = this.assets['arena'+game.stage.id] ?? this.assets.quay;
    c.drawImage(backdrop, cx, cy, w, h, 0, 0, w, h);
    c.save();
    c.translate(-cx, -cy);

    for (const effect of game.effects.live) {
      if (this.visible(effect,cam,2*effect.radius+40)) this.drawEffect(c,effect,game.time,reduced,false);
    }
    const warning = contrast ? '#fff4b3' : '#ffb3a7';
    for (const hazard of game.hazards.live) {
      if (!this.visible(hazard,cam,hazard.kind==='seal'?75:115)) continue;
      const x = hazard.x/2;
      const y = hazard.y/2;
      if (hazard.kind === 'seal') {
        const radius = hazard.radius/2;
        const armed = hazard.delay <= 0;
        c.globalAlpha = armed ? .59 : .22;
        c.fillStyle = '#a93553';
        c.beginPath(); c.arc(x,y,radius,0,TAU); c.fill();
        c.globalAlpha = 1;
        this.ring(c,x,y,radius+1,'#150e1a',.96);
        if (!armed) c.setLineDash([3,2]);
        this.ring(c,x,y,radius,warning,1);
        if (!armed) c.setLineDash([]);
        const remaining = clamp(hazard.delay/1.15,0,1);
        c.strokeStyle = warning;
        c.beginPath(); c.arc(x,y,radius*.67,-Math.PI/2,-Math.PI/2+TAU*(1-remaining)); c.stroke();
        c.fillStyle = warning;
        c.fillRect(x-2,y,5,1); c.fillRect(x,y-2,1,5);
      } else {
        if (hazard.delay>0) {
          this.ring(c,x,y,5,warning,1);
          c.strokeStyle = warning;
          c.setLineDash([4,2]);
          c.beginPath(); c.moveTo(x,y); c.lineTo(x+hazard.vx*.14,y+hazard.vy*.14); c.stroke();
          c.setLineDash([]);
          continue;
        }
        c.fillStyle = '#452d45';
        c.fillRect(x-4,y-4,8,8);
        c.fillStyle = '#ee83a5';
        c.fillRect(x-3,y-2,6,4);
        c.fillStyle = '#ffe1bf';
        c.fillRect(x-1,y-1,2,2);
      }
    }
    for (const gem of game.gems.live) {
      if (!this.visible(gem,cam,14)) continue;
      const x = Math.round(gem.x/2);
      const y = Math.round(gem.y/2);
      c.fillStyle = '#0d1e26'; c.fillRect(x-4,y+2,8,3);
      c.fillStyle = gem.value < 0 ? '#d97882' : contrast ? '#f7ff9f' : gem.value >= 5 ? '#9cfde6' : '#63c9bf';
      c.beginPath(); c.moveTo(x,y-4); c.lineTo(x+3,y-1); c.lineTo(x,y+3); c.lineTo(x-3,y); c.closePath(); c.fill();
      c.fillStyle = '#e7fedd'; c.fillRect(x-1,y-2,1,2);
    }
    const subjects = [
      ...game.stage.sites.map(site => ({ ...site, site: true, used: game.usedSites.has(site.ritual) })),
      ...game.enemies, { ...game.player, kind: 'player' }
    ].filter(e => this.visible(e,cam,e.site ? 150 : 85)).sort((a,b) => a.y-b.y);
    for (const e of subjects) {
      if (e.site) {
        const x = Math.round(e.x/2);
        const y = Math.round(e.y/2);
        if (!reduced) this.glow(c,x,y-24,43,e.art==='shrine'?'#be6989':game.stage.color,e.used?.08:.22);
        if (e.ritual && !e.used) this.ring(c,x,y,25,'#dabb89',contrast?.9:.64);
        c.drawImage(this.assets[e.art],x-56,y-83);
      } else this.actor(c,e,game,reduced);
    }
    for (const shot of game.shots.live) {
      if (!this.visible(shot,cam,48)) continue;
      const x = shot.x/2;
      const y = shot.y/2;
      c.strokeStyle = shot.color;
      c.lineWidth = shot.radius === 4 ? 2 : 1;
      c.beginPath(); c.moveTo(x-shot.vx/57,y-shot.vy/57); c.lineTo(x,y); c.stroke();
      c.fillStyle = '#fff1cb'; c.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);
    }
    for (const blade of game.blades()) {
      c.save(); c.translate(Math.round(blade.x/2),Math.round(blade.y/2)); c.rotate(blade.angle);
      c.fillStyle='#562f43'; c.fillRect(-3,-3,6,7);
      c.fillStyle='#f3a3b4'; c.fillRect(0,-4,3,9); c.fillStyle='#ffedcd'; c.fillRect(2,-3,1,4);
      c.restore();
    }
    for (const effect of game.effects.live) {
      if (this.visible(effect,cam,2*effect.radius+40)) this.drawEffect(c,effect,game.time,reduced,true);
    }
    const player = game.player;
    if (!reduced) {
      for (let i=0;i<24;i++) {
        const x = ((i*161 + game.time*(i%3+3)) % 890);
        const y = (i*73)%590 + Math.sin(game.time+i)*6;
        c.fillStyle = i%9 ? game.stage.color : '#bacad0';
        c.globalAlpha = .25 + .18*Math.sin(i+game.time*1.5);
        c.fillRect(Math.floor(x),Math.floor(y),i%9 ? 1 : 2,1);
      }
      c.globalAlpha = 1;
    }
    c.restore();
    const vignette = c.createRadialGradient((player.x-cam.x)/2,(player.y-cam.y)/2,52,w/2,h/2,Math.max(w,h)*.64);
    vignette.addColorStop(0,'#040b1000');
    vignette.addColorStop(1,contrast||reduced?'#040a1222':game.sanity<=55 ? '#1b102c8c' : '#040a1266');
    c.fillStyle = vignette;
    c.fillRect(0,0,w,h);
    this.compass(c,game,cam);
    return cam;
  }
  visible(e,cam,pad) {
    return e.x > cam.x-pad && e.x < cam.x+cam.width+pad && e.y > cam.y-pad && e.y < cam.y+cam.height+pad;
  }
  actor(c,e,game,reduced) {
    const x = Math.round(e.x/2);
    const y = Math.round(e.y/2);
    const hero = e.kind === 'player';
    const def = enemies[e.kind];
    const boss = !!def?.boss;
    const radius = boss ? 22 : e.kind === 'brute' ? 9 : 6.5;
    if (e.action === 'tell') {
      if (boss) this.ring(c,x,y,24+8*Math.sin(Math.min(1,e.timer)*2.7),'#f18a95',.88);
      else {
        c.save();
        c.translate(x,y); c.rotate(e.aim);
        c.fillStyle='#d0718155'; c.fillRect(0,-4,62,8);
        c.fillStyle='#fac1a27a'; c.fillRect(0,-1,62,1);
        c.restore();
      }
    }
    if (hero || boss) {
      this.glow(c,x,y-7,hero ? 45 : 65,hero ? '#65d7b2' : '#c175a1',hero ? .23 : .25);
      this.ring(c,x,y,hero ? 9 : 25,hero ? '#89c7ab' : '#bb768a',.65);
    }
    c.fillStyle = '#0810179f';
    c.beginPath(); c.ellipse(x,y,radius,Math.max(2,radius*.31),0,0,TAU); c.fill();
    const frame = hero && !e.walk ? 0 : Math.floor(game.time*9 + (e.id ?? 0)%4) % 4;
    const size = hero ? 48 : boss ? 59 : e.kind === 'brute' ? 44 : 37;
    c.save();
    c.translate(x,y+2);
    c.scale((hero ? e.dx : e.facing) < 0 ? -1 : 1,1);
    c.globalAlpha = e.kind === 'shade' ? .78 : 1;
    if (!reduced && (e.flash || (hero && e.hurt))) c.filter = hero ? 'brightness(1.3) saturate(0.4)' : 'brightness(1.65)';
    const castRow = hero?game.character.id : boss&&e.kind!=='boss' ? e.kind.startsWith('champion')?12+def.stage:21+def.stage : -1;
    const original = castRow<=0 || !this.assets.cast;
    const row = original ? rows.indexOf(boss?'boss':def?.sprite??e.kind) : castRow;
    c.drawImage(original?this.assets.sprites:this.assets.cast,frame*64,row*68,64,68,-Math.round(size/2),-size,size,size);
    c.restore();
    if (def?.behavior) {
      c.fillStyle=def.color; c.fillRect(x-3,y-9,6,2);
      if (e.shield>game.time) this.ring(c,x,y-6,9,'#a6ffe1',.75);
    }
    if (hero && game.mutation) { c.fillStyle='#e5a4d5'; c.fillRect(x-4,y-16,2,2); c.fillRect(x+2,y-16,2,2); }
    if (!hero && !boss && e.hp < e.maxHp && e.maxHp > 35) {
      c.fillStyle = '#10171e'; c.fillRect(x-6,y-24,12,2);
      c.fillStyle = enemies[e.kind].color; c.fillRect(x-6,y-24,Math.ceil(12*e.hp/e.maxHp),1);
    }
  }
  ring(c,x,y,r,color,alpha) {
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineWidth = 1;
    c.beginPath(); c.arc(x,y,Math.max(.1,r),0,TAU); c.stroke();
    c.globalAlpha = 1;
  }
  glow(c,x,y,r,color,alpha) {
    const gradient = c.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,color);
    gradient.addColorStop(1,color+'00');
    c.globalAlpha = alpha;
    c.fillStyle = gradient; c.fillRect(x-r,y-r,r*2,r*2);
    c.globalAlpha = 1;
  }
  drawEffect(c,e,t,reduced,above) {
    if (e.delay > 0) return;
    const decorative = ['blink','burst','spark','ring'].includes(e.kind);
    if (above !== decorative || (reduced && ['burst','spark'].includes(e.kind))) return;
    const x = e.x/2;
    const y = e.y/2;
    const age = 1-e.life/e.maxLife;
    if (e.kind === 'pulse' || e.kind === 'ring') {
      const radius = Math.max(2,e.radius/2*age);
      this.ring(c,x,y,radius,e.color,.86*(1-age*.78));
      if (!reduced) this.ring(c,x,y,radius*.87,e.color,.4*(1-age));
    } else if (['flame','gravity','sentinel','orbit'].includes(e.kind)) {
      const r = e.radius/2;
      this.glow(c,x,y,r+6,e.color,.37);
      this.ring(c,x,y,r,e.color,.65);
      c.fillStyle = e.color;
      for (let i=0;i<(e.kind==='sentinel'?3:7);i++) {
        const dx = Math.sin(i*2.72)*r*.65;
        const dy = Math.cos(i*2.72)*r*.65;
        const lift = (i*11+t*23)%9;
        c.fillRect(Math.floor(x+dx),Math.floor(y+dy-lift),2,4);
      }
    } else if (e.kind === 'mine') {
      c.fillStyle='#e0a48e'; c.fillRect(x-3,y-2,6,4);
      c.fillStyle='#ffc98a'; c.fillRect(x+1,y-4,2,2);
    } else {
      c.fillStyle = e.color;
      c.globalAlpha = 1-age;
      for (let i=0;i<6;i++) {
        const bearing = i*TAU/6;
        c.fillRect(Math.round(x+Math.cos(bearing)*age*e.radius),Math.round(y+Math.sin(bearing)*age*e.radius),2,2);
      }
      c.globalAlpha = 1;
    }
  }
  compass(c,game,cam) {
    const pending = game.stage.sites.filter(e => e.ritual && !game.usedSites.has(e.ritual));
    const candidates = game.boss ? [game.boss] : pending;
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (const item of candidates) {
      if (this.visible(item,cam,-25)) continue;
      const x = clamp((item.x-cam.x)/2,11,w-11);
      const y = clamp((item.y-cam.y)/2,31,h-30);
      const angle = Math.atan2((item.y-cam.y)/2-y,(item.x-cam.x)/2-x);
      c.save(); c.translate(x,y); c.rotate(angle);
      c.fillStyle = game.boss || item.ritual === 'blood' ? '#f0a29c' : '#94d9c2';
      c.beginPath(); c.moveTo(5,0); c.lineTo(-3,-4); c.lineTo(-2,0); c.lineTo(-3,4); c.fill();
      c.restore();
    }
  }
}
