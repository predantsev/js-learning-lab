import { labConfig } from './labConfig.js';
import { review } from './review.js';

const KINDS = ['public-identifier', 'runtime-token', 'server-secret'];
const PLACES = { 'public-identifier': 'app-config', 'runtime-token': 'secure-storage', 'server-secret': 'server' };
const entryOf = (name) => (review && typeof review === 'object' ? review[name] : undefined);

test('every config entry is reviewed exactly once', () => {
  expect(Object.keys(review ?? {}).sort(), 'names in review').toEqual(Object.keys(labConfig).sort());
});

test('every note has a kind, a place and a reason', () => {
  for (const name of Object.keys(labConfig)) {
    const entry = entryOf(name);
    expect(KINDS.includes(entry?.kind), `${name}.kind is one of ${KINDS.join(', ')}`).toBe(true);
    expect(Object.values(PLACES).includes(entry?.livesIn), `${name}.livesIn is a known place`).toBe(true);
    expect(typeof entry?.reason === 'string' && entry.reason.trim().length >= 15, `${name}.reason has at least 15 characters`).toBe(true);
  }
});

test('each kind lives in its own place', () => {
  for (const name of Object.keys(labConfig)) {
    const entry = entryOf(name);
    if (!KINDS.includes(entry?.kind)) continue;
    expect(entry.livesIn, `${name} (${entry.kind}).livesIn`).toBe(PLACES[entry.kind]);
  }
});

test('the addresses and the client id are public identifiers', () => {
  for (const name of ['authIssuer', 'clientId', 'photoUploadUrl']) {
    expect(entryOf(name)?.kind, `${name}.kind`).toBe('public-identifier');
  }
});

test('the tokens that arrive after sign-in are runtime tokens', () => {
  for (const name of ['accessToken', 'refreshToken']) {
    expect(entryOf(name)?.kind, `${name}.kind`).toBe('runtime-token');
  }
});

test('the client secret, the push key and the webhook secret stay on the server', () => {
  for (const name of ['clientSecret', 'pushServerKey', 'webhookSigningSecret']) {
    expect(entryOf(name)?.kind, `${name}.kind`).toBe('server-secret');
  }
});
