export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const distance2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export function seeded(seed) {
  const random = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  random.state = () => seed;
  return random;
}
export class SpatialGrid {
  constructor(size = 64) {
    this.size = size;
    this.buckets = new Map();
    this.reusable = [];
  }
  reset(entities) {
    for (const bucket of this.buckets.values()) {
      bucket.length = 0;
      this.reusable.push(bucket);
    }
    this.buckets.clear();
    for (const entity of entities) {
      if (entity.hp <= 0) continue;
      const key = this.key(Math.floor(entity.x / this.size), Math.floor(entity.y / this.size));
      if (!this.buckets.has(key)) this.buckets.set(key, this.reusable.pop() ?? []);
      this.buckets.get(key).push(entity);
    }
  }
  key(x, y) { return x + 4096 * y; }
  *near(x, y, r) {
    for (let row = Math.floor((y-r)/this.size); row <= Math.floor((y+r)/this.size); row++) {
      for (let col = Math.floor((x-r)/this.size); col <= Math.floor((x+r)/this.size); col++) {
        const bucket = this.buckets.get(this.key(col, row));
        if (bucket) yield* bucket;
      }
    }
  }
}
export class Pool {
  constructor(limit) { this.limit = limit; this.live = []; this.free = []; }
  add(data) {
    if (this.live.length >= this.limit) return;
    const item = Object.assign(this.free.pop() ?? {}, data);
    this.live.push(item);
    return item;
  }
  remove(index) {
    const item = this.live[index];
    this.live[index] = this.live[this.live.length - 1];
    this.live.pop();
    this.free.push(item);
  }
}
