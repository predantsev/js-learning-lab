// Misconception: the right shape is a valid date. 2026-13-01 has four, two and two digits.
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
  if (locale !== 'uk' && locale !== 'en') errors.LOCALE = `LOCALE must be uk or en, got "${locale}"`;

  const today = env.TODAY;
  const match = DATE.exec(today ?? '');
  if (today === undefined) {
    errors.TODAY = 'TODAY is required, for example 2026-03-01';
  } else if (!match) {
    errors.TODAY = `TODAY must be a date YYYY-MM-DD, got "${today}"`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { port, locale, today } };
}
