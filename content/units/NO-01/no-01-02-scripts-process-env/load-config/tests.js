// loadConfig is called with hand-made environments: every value is text, as in process.env.
import { loadConfig } from './config.js';

const TODAY = '2026-03-01';

function expectRejected(env, name, received) {
  expect(typeof loadConfig, 'type of loadConfig').toBe('function');
  const result = loadConfig(env);
  const shown = JSON.stringify(env);
  expect(result.ok, `ok for ${shown}`).toBe(false);
  expect(typeof result.errors?.[name], `type of errors.${name} for ${shown}`).toBe('string');
  if (received !== undefined) expect(result.errors[name], `errors.${name} for ${shown}`).toContain(received);
}

test('uses the defaults for PORT and LOCALE', () => {
  expect(typeof loadConfig, 'type of loadConfig').toBe('function');
  expect(loadConfig({ TODAY }), 'loadConfig({ TODAY })').toEqual({ ok: true, value: { port: 3000, locale: 'uk', today: TODAY } });
});

test('turns PORT into a number', () => {
  expect(typeof loadConfig, 'type of loadConfig').toBe('function');
  const result = loadConfig({ PORT: '8080', LOCALE: 'en', TODAY });
  expect(result.value?.port, 'value.port for PORT "8080"').toBe(8080);
  expect(result, 'the whole result').toEqual({ ok: true, value: { port: 8080, locale: 'en', today: TODAY } });
});

test('rejects a PORT that is not a whole number from 1 to 65535', () => {
  // '1e3' is a whole number for Number() (1000), but it is not made of digits only.
  for (const PORT of ['abc', '0', '70000', '30.5', '1e3']) expectRejected({ PORT, TODAY }, 'PORT', PORT);
});

test('rejects a LOCALE other than uk or en', () => {
  for (const LOCALE of ['ua', 'de']) expectRejected({ LOCALE, TODAY }, 'LOCALE', LOCALE);
});

test('rejects a missing or impossible TODAY', () => {
  expectRejected({}, 'TODAY');
  for (const today of ['2026-13-01', '2026-03-32', '01.03.2026', '2026-3-1']) expectRejected({ TODAY: today }, 'TODAY', today);
});
