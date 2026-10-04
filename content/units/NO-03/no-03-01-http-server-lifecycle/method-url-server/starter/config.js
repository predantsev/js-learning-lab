// Ready-made settings reader (read-only). It turns environment-like strings into typed values
// and fails fast on a port that cannot exist.
export function loadConfig(env) {
  const port = Number(env.PORT ?? '4321');
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be a whole number from 0 to 65535, got "${env.PORT}"`);
  }
  return { host: '127.0.0.1', port };
}
