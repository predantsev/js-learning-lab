// Starts the "server" (only its config step) with four different environments, then shows
// key rotation: a token signed with the old key, checked before and after the window closes.
import crypto from 'node:crypto';
import { loadSecrets } from './config.js';

// Lab values only. A real key is generated once (crypto.randomBytes(32)) and kept out of the code.
const strong = crypto.randomBytes(32).toString('base64url');
const environments = [
  ['%%unset%%', {}],
  ['changeme', { SESSION_SECRET: 'changeme' }],
  ['%%short%%', { SESSION_SECRET: 'my-own-key-2026' }],
  ['%%random%%', { SESSION_SECRET: strong }],
];

for (const [label, env] of environments) {
  try {
    loadSecrets(env);
    console.log(`${label}: %%started%%`);
  } catch (error) {
    // The error names the variable and the problem — never the value.
    console.error(`${label}: %%refused%% — ${error.message}`);
  }
}

// Rotation: tokens are signed with the CURRENT key; the PREVIOUS one is still accepted
// until a fixed moment, so tokens issued just before the switch keep working for a while.
const sign = (key, payload) => crypto.createHmac('sha256', key).update(payload).digest('base64url');
const oldKey = crypto.randomBytes(32).toString('base64url');
const newKey = crypto.randomBytes(32).toString('base64url');
const previousUntil = Date.parse('2026-03-02T12:00:00Z');
const token = { payload: 'u-01', signature: sign(oldKey, 'u-01') }; // issued before the switch

function verify({ payload, signature }, now) {
  const keys = now < previousUntil ? [newKey, oldKey] : [newKey];
  const given = Buffer.from(signature);
  return keys.some((key) => {
    const expected = Buffer.from(sign(key, payload));
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  });
}
console.log(`%%oldToken%% 2026-03-02T11:00Z: ${verify(token, Date.parse('2026-03-02T11:00:00Z'))}`);
console.log(`%%oldToken%% 2026-03-02T12:00Z: ${verify(token, Date.parse('2026-03-02T12:00:00Z'))}`);
