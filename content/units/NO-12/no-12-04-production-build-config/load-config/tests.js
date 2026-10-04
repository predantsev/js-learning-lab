import { loadConfig } from './config.js';

const guard = () => expect(typeof loadConfig, 'type of loadConfig').toBe('function');
const DATA = '/srv/planner/data';

// Calls loadConfig and returns the message it threw ('' when it did not throw).
function problemOf(env) {
  try {
    loadConfig(env);
    return '';
  } catch (error) {
    return String(error?.message ?? error);
  }
}

test('reads every value from the env object it is given', () => {
  guard();
  const config = loadConfig({ PORT: '8081', HOST: '::1', DATA_DIR: DATA, NODE_ENV: 'test', LOG_LEVEL: 'warn', EDITOR: 'vim' });
  expect({ ...config }, 'the config').toEqual({ port: 8081, host: '::1', dataDir: DATA, nodeEnv: 'test', logLevel: 'warn' });
});

test('uses the defaults for PORT, HOST, NODE_ENV and LOG_LEVEL', () => {
  guard();
  expect({ ...loadConfig({ DATA_DIR: DATA }) }, 'the config of { DATA_DIR } alone').toEqual({ port: 7330, host: '127.0.0.1', dataDir: DATA, nodeEnv: 'development', logLevel: 'info' });
});

test('returns a frozen object', () => {
  guard();
  expect(Object.isFrozen(loadConfig({ DATA_DIR: DATA })), 'Object.isFrozen(config)').toBe(true);
});

test('PORT must be a whole number from 1 to 65535', () => {
  guard();
  for (const port of ['abc', '0', '65536', '80.5', '1e3', '-1', '']) {
    expect(problemOf({ PORT: port, DATA_DIR: DATA }), `the error for PORT="${port}"`).toContain('PORT');
  }
});

test('HOST must be a loopback address', () => {
  guard();
  for (const host of ['0.0.0.0', 'localhost.example', '192.168.1.20']) {
    expect(problemOf({ HOST: host, DATA_DIR: DATA }), `the error for HOST="${host}"`).toContain('HOST');
  }
});

test('DATA_DIR is required and absolute', () => {
  guard();
  expect(problemOf({}), 'the error without DATA_DIR').toContain('DATA_DIR');
  expect(problemOf({ DATA_DIR: '' }), 'the error for DATA_DIR=""').toContain('DATA_DIR');
  expect(problemOf({ DATA_DIR: 'data' }), 'the error for DATA_DIR="data"').toContain('DATA_DIR');
});

test('NODE_ENV and LOG_LEVEL accept only their listed values', () => {
  guard();
  expect(problemOf({ DATA_DIR: DATA, NODE_ENV: 'prod' }), 'the error for NODE_ENV="prod"').toContain('NODE_ENV');
  expect(problemOf({ DATA_DIR: DATA, LOG_LEVEL: 'verbose' }), 'the error for LOG_LEVEL="verbose"').toContain('LOG_LEVEL');
});

test('one error lists every invalid variable', () => {
  guard();
  const message = problemOf({ PORT: 'abc', HOST: '0.0.0.0', NODE_ENV: 'prod' });
  for (const name of ['PORT', 'HOST', 'DATA_DIR', 'NODE_ENV']) expect(message, 'the error').toContain(name);
});

test('process.env is not read', () => {
  guard();
  const saved = { PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV };
  process.env.PORT = '1234';
  process.env.NODE_ENV = 'production';
  try {
    const config = loadConfig({ DATA_DIR: DATA });
    expect([config.port, config.nodeEnv], '[port, nodeEnv] while process.env says 1234 and production').toEqual([7330, 'development']);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
