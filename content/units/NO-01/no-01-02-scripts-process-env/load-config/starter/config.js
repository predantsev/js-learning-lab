// Turns environment variables (always text or undefined) into a typed config, or reports errors.
// Result: { ok: true, value: { port, locale, today } } or { ok: false, errors: { NAME: message } }.
export function loadConfig(env) {
  // So far every value is passed on as it arrived: text, or undefined when unset.
  return { ok: true, value: { port: env.PORT, locale: env.LOCALE, today: env.TODAY } };
}
