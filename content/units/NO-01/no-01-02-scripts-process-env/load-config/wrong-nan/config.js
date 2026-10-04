// Misconception: Number() is enough. Number("abc") is NaN and Number("0") is 0,
// so a broken PORT slips into the config.
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function loadConfig(env) {
  const errors = {};

  let port = 3000;
  if (env.PORT !== undefined) {
    port = Number(env.PORT);
  }

  const locale = env.LOCALE ?? 'uk';
  if (locale !== 'uk' && locale !== 'en') errors.LOCALE = `LOCALE must be uk or en, got "${locale}"`;

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
