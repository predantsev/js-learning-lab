// The bug report, reproduced: the expenses screen on the Android emulator, debug build.
import { mockBaseUrl } from './devConfig.js';
import { loadRecords } from './loadRecords.js';
import { networkSecurityConfig as xml } from './networkSecurityConfig.js';
import { cleartextPermitted } from './policy.js';

const target = 'android-emulator';
const url = `${mockBaseUrl(target)}/records/expenses`;

console.log(`${target} requests ${url}`);
console.log(`plain HTTP to ${new URL(url).hostname} permitted: ${cleartextPermitted(xml, new URL(url).hostname)}`);

// A service that accepted the connection and never answers (the mock service with ?hang=1).
const silentFetch = (requestUrl, { signal } = {}) =>
  new Promise((resolve, reject) => {
    signal?.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
  });

// The demo itself gives up after 1000 ms, so that it always finishes.
const outcome = await Promise.race([
  loadRecords(url, { fetchFn: silentFetch, timeoutMs: 300 }).then(() => 'loaded', (error) => error.name),
  new Promise((resolve) => setTimeout(() => resolve('still waiting after 1000 ms'), 1000)),
]);
console.log(`silent service, timeoutMs 300: ${outcome}`);
