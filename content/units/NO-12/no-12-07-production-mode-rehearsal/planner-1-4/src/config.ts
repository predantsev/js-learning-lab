// Reads the configuration once, at startup.
import path from 'node:path';

export type Config = Readonly<{ port: number; host: string; dataDir: string }>;

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const problems: string[] = [];
  const port = Number(env.PORT ?? '7330');
  if (!/^\d+$/.test(env.PORT ?? '7330') || port < 1 || port > 65535) problems.push(`PORT is not a port: "${env.PORT}"`);
  const host = env.HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1' && host !== '::1') problems.push(`HOST must be loopback: "${host}"`);
  const dataDir = env.DATA_DIR ?? '';
  if (!path.isAbsolute(dataDir)) problems.push(`DATA_DIR must be an absolute path: "${dataDir}"`);
  if (problems.length > 0) throw new Error(problems.join('\n'));
  return Object.freeze({ port, host, dataDir });
}
