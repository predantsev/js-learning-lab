// Checks loadSecrets and keysFor with lab environments (never real keys).
import { ConfigError } from './config-error.js';
import { keysFor, loadSecrets } from './secrets.js';

const KEY_A = 'lab-key-A-0123456789abcdefghijklmnop';
const KEY_B = 'lab-key-B-0123456789abcdefghijklmnop';
const UNTIL = '2026-03-02T12:00:00Z';

// Calls loadSecrets and returns the error it threw, or null.
function errorOf(env) {
  try {
    loadSecrets(env);
    return null;
  } catch (error) {
    return error;
  }
}

test('a strong SESSION_SECRET loads, with no previous key', () => {
  expect(loadSecrets({ SESSION_SECRET: KEY_A }), 'result').toEqual({ current: KEY_A, previous: null, previousUntil: null });
});

test('a missing SESSION_SECRET throws a ConfigError that names the variable', () => {
  for (const env of [{}, { SESSION_SECRET: '' }]) {
    const error = errorOf(env);
    expect(error instanceof ConfigError, `ConfigError for ${JSON.stringify(env)}`).toBe(true);
    expect(error?.message, 'message').toContain('SESSION_SECRET');
  }
});

test('a placeholder value is refused in any letter case', () => {
  for (const value of ['changeme', 'CHANGEME', 'replace-me-with-32-random-bytes-in-base64url', 'Replace-Me-With-32-Random-Bytes-In-Base64url']) {
    expect(errorOf({ SESSION_SECRET: value }) instanceof ConfigError, `ConfigError for "${value}"`).toBe(true);
  }
});

test('a key shorter than 32 characters is refused; exactly 32 is accepted', () => {
  expect(errorOf({ SESSION_SECRET: 'x'.repeat(31) }) instanceof ConfigError, 'ConfigError for 31 characters').toBe(true);
  expect(errorOf({ SESSION_SECRET: 'k'.repeat(32) }), 'error for 32 characters').toBeNull();
});

test('the error message never contains the secret value', () => {
  for (const value of ['my-own-key-2026', 'changeme']) {
    const error = errorOf({ SESSION_SECRET: value });
    expect(error instanceof ConfigError, `ConfigError for "${value}"`).toBe(true);
    expect(error.message.includes(value), `the message "${error.message}" contains the value`).toBe(false);
  }
});

test('loading prints nothing that contains a key', () => {
  const before = logs().length; // only what loadSecrets prints during this check counts
  loadSecrets({ SESSION_SECRET: KEY_A, SESSION_SECRET_PREVIOUS: KEY_B, SESSION_SECRET_PREVIOUS_UNTIL: UNTIL });
  errorOf({ SESSION_SECRET: 'my-own-key-2026' });
  const printed = logs().slice(before).join('\n');
  for (const value of [KEY_A, KEY_B, 'my-own-key-2026']) {
    expect(printed.includes(value), `printed output contains "${value}"`).toBe(false);
  }
});

test('a previous key needs a valid SESSION_SECRET_PREVIOUS_UNTIL and must be strong too', () => {
  const noUntil = errorOf({ SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: KEY_A });
  expect(noUntil instanceof ConfigError, 'ConfigError without SESSION_SECRET_PREVIOUS_UNTIL').toBe(true);
  const badUntil = errorOf({ SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: KEY_A, SESSION_SECRET_PREVIOUS_UNTIL: 'soon' });
  expect(badUntil instanceof ConfigError, 'ConfigError for SESSION_SECRET_PREVIOUS_UNTIL "soon"').toBe(true);
  const weak = errorOf({ SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: 'changeme', SESSION_SECRET_PREVIOUS_UNTIL: UNTIL });
  expect(weak instanceof ConfigError, 'ConfigError for a placeholder previous key').toBe(true);
});

test('keysFor accepts the previous key only before previousUntil', () => {
  const secrets = loadSecrets({ SESSION_SECRET: KEY_B, SESSION_SECRET_PREVIOUS: KEY_A, SESSION_SECRET_PREVIOUS_UNTIL: UNTIL });
  expect(secrets.previousUntil, 'previousUntil').toBe(Date.parse(UNTIL));
  expect(keysFor(secrets, Date.parse(UNTIL) - 1), 'keys 1 ms before').toEqual([KEY_B, KEY_A]);
  expect(keysFor(secrets, Date.parse(UNTIL)), 'keys at previousUntil').toEqual([KEY_B]);
  expect(keysFor(loadSecrets({ SESSION_SECRET: KEY_B }), 0), 'keys with no previous key').toEqual([KEY_B]);
});
