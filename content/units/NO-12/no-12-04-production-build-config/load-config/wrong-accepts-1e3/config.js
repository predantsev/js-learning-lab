// The service's configuration: read from an env object once, at startup.
import path from 'node:path';

const LOOPBACK = ['127.0.0.1', '::1'];
const NODE_ENVS = ['production', 'development', 'test'];
const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

export function loadConfig(env) {
  const problems = [];

  const portText = env.PORT ?? '7330';
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) problems.push(`PORT must be a whole number from 1 to 65535, got "${portText}"`);

  const host = env.HOST ?? '127.0.0.1';
  if (!LOOPBACK.includes(host)) problems.push(`HOST must be 127.0.0.1 or ::1, got "${host}"`);

  const dataDir = env.DATA_DIR;
  if (!dataDir) problems.push('DATA_DIR is required, for example /srv/planner/data');
  else if (!path.isAbsolute(dataDir)) problems.push(`DATA_DIR must be an absolute path, got "${dataDir}"`);

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!NODE_ENVS.includes(nodeEnv)) problems.push(`NODE_ENV must be production, development or test, got "${nodeEnv}"`);

  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!LOG_LEVELS.includes(logLevel)) problems.push(`LOG_LEVEL must be error, warn, info or debug, got "${logLevel}"`);

  if (problems.length > 0) throw new Error(`Invalid configuration:\n${problems.join('\n')}`);
  return Object.freeze({ port, host, dataDir, nodeEnv, logLevel });
}
