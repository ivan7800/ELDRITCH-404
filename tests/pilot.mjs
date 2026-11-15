import { arena, enemies } from '../src/content.mjs';
import { distance2 } from '../src/math.mjs';
const priorities = ['tempest','choir','bell','salt','resin','harpoon','blade','lantern','prayer','boots','coat','mine','patch'];
export function choose(choices,health) {
  if (health < 43 && choices.includes('patch')) return 'patch';
  return priorities.find(id=>choices.includes(id)) ?? choices[0];
}
export function plan(game) {
  const p = game.player;
  const candidates = game.enemies.filter(e=>e.hp>0 && distance2(e,p)<210**2);
  const loot = game.gems.live.filter(e=>distance2(e,p)<310**2);
  let bestScore = -Infinity;
  let output = {};
  for (let dir=0;dir<17;dir++) {
    const x = dir===16 ? 0 : Math.cos(dir*Math.PI/8);
    const y = dir===16 ? 0 : Math.sin(dir*Math.PI/8);
    const next = {x:p.x+x*43,y:p.y+y*43};
    let score = dir===16 ? -.55 : 0;
    for (const e of candidates) {
      const d = Math.sqrt(distance2(e,next));
      score -= Math.max(0,(enemies[e.kind].boss?105:66)-d) ** 2 / 300;
    }
    for (const h of game.hazards.live) {
      const future = {x:h.x + h.vx*.24,y:h.y + h.vy*.24};
      const d = Math.sqrt(distance2(future,next));
      score -= Math.max(0,(h.kind==='seal'?55:28)-d)**2/85;
    }
    for (const gem of loot) {
      if (gem.magnet) continue;
      const d = Math.sqrt(distance2(gem,next));
      score += (gem.value < 0 ? (p.hp<p.maxHp-12 ? 6 : -.45) : 1.35)*Math.exp(-d/43);
    }
    const wall = Math.min(next.x,arena.width-next.x,next.y,arena.height-next.y);
    if (wall < 75) score -= (75-wall)**2/180;
    const boss = game.boss;
    if (boss) score -= Math.max(0,Math.abs(Math.sqrt(distance2(boss,next))-117)-17)/21;
    if (score>bestScore) { bestScore=score; output={x,y}; }
  }
  output.dash = p.dashCooldown===0 && candidates.filter(e=>distance2(e,p)<40**2).length>=3;
  return output;
}
