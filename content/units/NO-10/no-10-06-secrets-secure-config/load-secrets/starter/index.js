// Tries loadSecrets with five environments and prints what happens, then lists the keys
// accepted before and after the rotation window closes. Keys here are lab values only.
import { keysFor, loadSecrets } from './secrets.js';

const KEY_A = 'lab-key-A-0123456789abcdefghijklmnop'; // 35 characters
const KEY_B = 'lab-key-B-0123456789abcdefghijklmnop';

const environments = [
  ['%%unset%%', {}],
  ['changeme', { SESSION_SECRET: 'changeme' }],
  ['%%short%%', { SESSION_SECRET: 'my-own-key-2026' }],
  ['%%noUntil%%', { SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: KEY_A }],
  ['%%rotation%%', { SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: KEY_A, SESSION_SECRET_PREVIOUS_UNTIL: '2026-03-02T12:00:00Z' }],
];

let rotating = null;
for (const [label, env] of environments) {
  try {
    rotating = loadSecrets(env);
    console.log(`${label}: %%started%%`);
  } catch (error) {
    console.log(`${label}: ${error.name} — ${error.message}`);
  }
}

if (rotating) {
  const names = (keys) => keys.map((key) => (key === KEY_A ? 'A' : key === KEY_B ? 'B' : '?')).join(', ');
  console.log(`11:00 → ${names(keysFor(rotating, Date.parse('2026-03-02T11:00:00Z')))}`);
  console.log(`12:00 → ${names(keysFor(rotating, Date.parse('2026-03-02T12:00:00Z')))}`);
}
