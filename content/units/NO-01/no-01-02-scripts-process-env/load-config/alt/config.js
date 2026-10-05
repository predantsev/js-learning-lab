// Another valid solution: a round trip for the port (the number written back must give the same
// text, so "1e3", " 80" and "30.5" fail) and a calendar round trip for the date (stricter than
// required: it also rejects 2026-02-30).
function checkPort(text) {
  if (text === undefined) return { value: 3000 };
  const port = Number(text);
  if (String(port) !== text || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: `PORT: expected a whole number 1–65535, received "${text}"` };
  }
  return { value: port };
}

function checkDate(text) {
  if (text === undefined) return { error: 'TODAY: missing (YYYY-MM-DD)' };
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && date.toISOString().slice(0, 10) === text;
  return valid ? { value: text } : { error: `TODAY: not a calendar date: "${text}"` };
}

export function loadConfig(env) {
  const port = checkPort(env.PORT);
  const locale = ['uk', 'en'].includes(env.LOCALE ?? 'uk') ? { value: env.LOCALE ?? 'uk' } : { error: `LOCALE: unsupported "${env.LOCALE}"` };
  const today = checkDate(env.TODAY);
  const errors = {};
  if (port.error) errors.PORT = port.error;
  if (locale.error) errors.LOCALE = locale.error;
  if (today.error) errors.TODAY = today.error;
  if (port.error || locale.error || today.error) return { ok: false, errors };
  return { ok: true, value: { port: port.value, locale: locale.value, today: today.value } };
}
