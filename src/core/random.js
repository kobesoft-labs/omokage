// Seeded randomness: the same seed (e.g. a user name) always yields the same avatar.

const hash = (s) => {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
};

/**
 * Returns a generator `r()` in [0, 1) with two helpers:
 *   r.pick(list)   one item of the list
 *   r.chance(p)    true with probability p
 */
export function seeded(seed) {
  let a = hash(String(seed));
  const r = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.pick = (list) => list[Math.floor(r() * list.length)];
  r.chance = (p) => r() < p;
  return r;
}
