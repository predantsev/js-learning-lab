// Reads the data settings from the environment once, in one place.
export function loadConfig(env) {
  const dataSource = env.DATA_SOURCE ?? 'fixtures';
  if (dataSource !== 'fixtures' && dataSource !== 'http') {
    throw new Error(`DATA_SOURCE must be "fixtures" or "http", not "${dataSource}"`);
  }
  const apiBaseUrl = env.API_BASE_URL ?? null;
  // No silent fallback: an HTTP source without an address is a configuration error.
  if (dataSource === 'http' && apiBaseUrl === null) {
    throw new Error('API_BASE_URL is required when DATA_SOURCE is "http"');
  }
  return { dataSource, apiBaseUrl };
}
