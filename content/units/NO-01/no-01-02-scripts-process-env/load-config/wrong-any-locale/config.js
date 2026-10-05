// Misconception: any LOCALE text is fine, so "ua" or "de" reaches the config.
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function loadConfig(env) {
  const errors = {};

  let port = 3000;
  if (env.PORT !== undefined) {
    port = Number(env.PORT);
    if (!/^\d+$/.test(env.PORT) || port < 1 || port > 65535) {
      errors.PORT = `PORT must be a whole number from 1 to 65535, got "${env.PORT}"`;
    }
  }

  const locale = env.LOCALE ?? 'uk';

  const today = env.TODAY;
  const match = DATE.exec(today ?? '');
  if (today === undefined) {
    errors.TODAY = 'TODAY is required, for example 2026-03-01';
  } else if (!match || Number(match[2]) < 1 || Number(match[2]) > 12 || Number(match[3]) < 1 || Number(match[3]) > 31) {
    errors.TODAY = `TODAY must be a date YYYY-MM-DD, got "${today}"`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { port, locale, today } };
}
