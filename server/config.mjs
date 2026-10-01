// Runtime configuration. Everything binds to loopback; ports and paths are configurable.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PORT = 7300;
export const APP_HOSTNAME = 'js-learning-lab.localhost';
export const APP_FALLBACK_HOSTNAME = 'localhost';
export const SANDBOX_HOST_PATTERN = /^(?:127\.0\.0\.1|\[::1\]|jsll-run-\d+\.localhost)$/;
export const DATA_SCHEMA_VERSION = 1;

export function loadConfig(env = process.env, overrides = {}) {
  const rawPort = overrides.port ?? env.JSLL_PORT ?? DEFAULT_PORT;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid port "${rawPort}". Use an integer between 1 and 65535 (JSLL_PORT).`);
  return {
    port,
    dataDir: path.resolve(overrides.dataDir ?? env.JSLL_DATA_DIR ?? path.join(ROOT, '.learner-data')),
    exportsDir: path.resolve(overrides.exportsDir ?? env.JSLL_EXPORTS_DIR ?? path.join(ROOT, 'exports')),
    runtimeDir: path.resolve(overrides.runtimeDir ?? env.JSLL_RUNTIME_DIR ?? path.join(ROOT, '.runtime')),
    distDir: path.resolve(overrides.distDir ?? path.join(ROOT, 'dist')),
    testHooks: overrides.testHooks ?? env.JSLL_TEST_HOOKS === '1',
    quiet: overrides.quiet ?? false,
  };
}

export const appHosts = (port) => [`${APP_HOSTNAME}:${port}`, `${APP_FALLBACK_HOSTNAME}:${port}`];
export const appOrigins = (port) => appHosts(port).map((h) => `http://${h}`);

/** Classify the Host header: 'app' | 'sandbox' | null (rejected: DNS rebinding or stray host). */
export function classifyHost(hostHeader, port) {
  if (typeof hostHeader !== 'string') return null;
  const host = hostHeader.toLowerCase();
  if (appHosts(port).includes(host)) return 'app';
  const i = host.lastIndexOf(':');
  if (i === -1 || Number(host.slice(i + 1)) !== port) return null;
  return SANDBOX_HOST_PATTERN.test(host.slice(0, i)) ? 'sandbox' : null;
}
