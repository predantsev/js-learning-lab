// The service's configuration: read from an env object once, at startup.
// This version describes every variable as a rule: its default and a check that returns
// either { value } or { problem }.
import { isAbsolute } from 'node:path';

const oneOf = (name, allowed) => (text) =>
  allowed.includes(text) ? { value: text } : { problem: `${name} must be one of ${allowed.join(', ')}, got "${text}"` };

const rules = [
  ['port', 'PORT', '7330', (text) => {
    const port = Number.parseInt(text, 10);
    return String(port) === text && port >= 1 && port <= 65535 ? { value: port } : { problem: `PORT must be a whole number from 1 to 65535, got "${text}"` };
  }],
  ['host', 'HOST', '127.0.0.1', oneOf('HOST', ['127.0.0.1', '::1'])],
  ['dataDir', 'DATA_DIR', '', (text) => {
    if (text === '') return { problem: 'DATA_DIR is required' };
    return isAbsolute(text) ? { value: text } : { problem: `DATA_DIR must be absolute, got "${text}"` };
  }],
  ['nodeEnv', 'NODE_ENV', 'development', oneOf('NODE_ENV', ['production', 'development', 'test'])],
];

export function loadConfig(env) {
  const config = {};
  const problems = [];
  for (const [key, name, fallback, check] of rules) {
    const result = check(env[name] ?? fallback);
    if ('problem' in result) problems.push(result.problem);
    else config[key] = result.value;
  }
  const level = oneOf('LOG_LEVEL', ['error', 'warn', 'info', 'debug'])(env.LOG_LEVEL ?? 'info');
  if ('problem' in level) problems.push(level.problem);
  else config.logLevel = level.value;

  if (problems.length) throw new Error(problems.join('\n'));
  return Object.freeze(config);
}
