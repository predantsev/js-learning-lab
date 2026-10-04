// redact on synthetic values: top level, nested, letter case, errors with causes, no mutation.
import { redact } from './redact.js';

const KEYS = ['token', 'password', 'authorization'];
const run = (value) => {
  expect(typeof redact, 'type of redact').toBe('function');
  return redact(value, { keys: KEYS });
};

test('a secret key at the top level is replaced', () => {
  expect(run({ port: 4310, token: 'demo-1' }), 'redacted { port, token }').toEqual({ port: 4310, token: '[REDACTED]' });
  expect(run({ password: { old: 'a', next: 'b' } }), 'a secret whose value is an object').toEqual({ password: '[REDACTED]' });
  expect(run({ label: L.lunch, amountMinor: 21050, note: null }), 'a value with no secrets').toEqual({ label: L.lunch, amountMinor: 21050, note: null });
});

test('secrets inside nested objects and arrays are replaced; arrays stay arrays', () => {
  const result = run({ database: { file: 'x.db', password: 'demo-2' }, backups: [{ token: 'demo-3', target: 'b/' }, 'plain'] });
  expect(result, 'redacted nested value').toEqual({ database: { file: 'x.db', password: '[REDACTED]' }, backups: [{ token: '[REDACTED]', target: 'b/' }, 'plain'] });
  expect(Array.isArray(result?.backups), 'backups is still an array').toBe(true);
});

test('key names match in any letter case', () => {
  expect(run({ Authorization: 'Bearer demo-4', TOKEN: 'demo-5', Token_id: 7 }), 'redacted header-like object')
    .toEqual({ Authorization: '[REDACTED]', TOKEN: '[REDACTED]', Token_id: 7 });
});

test('an error becomes { name, message, cause } with the cause redacted, at any depth', () => {
  const inner = new TypeError(L.innerFailed, { cause: { target: 'b/', token: 'demo-6' } });
  const outer = new Error(L.syncFailed, { cause: inner });
  expect(run(outer), 'redacted error chain').toEqual({
    name: 'Error',
    message: L.syncFailed,
    cause: { name: 'TypeError', message: L.innerFailed, cause: { target: 'b/', token: '[REDACTED]' } },
  });
  expect(run({ failure: new RangeError(L.innerFailed) }), 'an error with no cause inside an object')
    .toEqual({ failure: { name: 'RangeError', message: L.innerFailed } });
});

test('the original value is not changed', () => {
  const original = { token: 'demo-7', nested: { password: 'demo-8' }, list: [{ authorization: 'demo-9' }] };
  run(original);
  expect(original, 'the value passed to redact').toEqual({ token: 'demo-7', nested: { password: 'demo-8' }, list: [{ authorization: 'demo-9' }] });
});
