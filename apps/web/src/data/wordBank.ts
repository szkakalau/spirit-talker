/** 1000+ English paranormal / atmosphere tokens for spirit-word mode */
const A = [
  'cold', 'warm', 'still', 'low', 'high', 'soft', 'sharp', 'far', 'near', 'old', 'lost', 'last', 'first', 'deep', 'thin',
  'thick', 'dark', 'pale', 'grey', 'blue', 'red', 'white', 'black', 'hollow', 'heavy', 'light', 'slow', 'quick', 'fine',
  'rough',
]
const B = [
  'shadow', 'voice', 'step', 'breath', 'door', 'hall', 'stairs', 'mirror', 'glass', 'wind', 'bell', 'knock', 'tap',
  'hum', 'drift', 'trace', 'sign', 'thread', 'threshold', 'corner', 'basement', 'attic', 'window', 'frame', 'wall',
  'floor',
]
const C = [
  'behind you', 'above', 'below', 'within', 'without', 'before dawn', 'after midnight', 'at the door', 'on the stair',
  'in the hall', 'underfoot', 'overhead', 'far away', 'close now', 'not alone', 'listen', 'wait', 'remember', 'forget',
  'follow', 'stay', 'leave', 'return', 'again',
]

const EXTRA = [
  'hello', 'help', 'here', 'there', 'now', 'then', 'yes', 'no', 'name', 'why', 'silent', 'running', 'watching',
  'listening', 'cold spot', 'orb', 'mist', 'echo', 'static', 'frequency', 'presence', 'absence', 'threshold',
]

function uniq(arr: string[]): string[] {
  return [...new Set(arr)].filter(Boolean);
}

const combined: string[] = [];
for (const a of A) {
  for (const b of B) {
    combined.push(`${a} ${b}`);
  }
}
for (const a of A.slice(0, 22)) {
  for (const c of C) {
    combined.push(`${a} · ${c}`);
  }
}
combined.push(...EXTRA);

export const SPIRIT_WORD_BANK = uniq(combined);
