// The habits data source. It never names a host: the base URL comes from the dev config.
import { mockBaseUrl } from './devConfig.js';

export function createMockSource(target, fetchFn) {
  return {
    async list(signal) {
      const response = await fetchFn(`${mockBaseUrl(target)}/records/habits`, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
  };
}
