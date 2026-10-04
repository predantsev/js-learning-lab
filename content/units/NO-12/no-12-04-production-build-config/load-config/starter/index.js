// A demo (read-only): the service reads its configuration once, at startup, and refuses to start
// on an invalid value — before listen() is ever called.
import { loadConfig } from './config.js';

const environments = [
  { DATA_DIR: '/srv/planner/data', NODE_ENV: 'production' },
  { PORT: 'abc', HOST: '0.0.0.0', NODE_ENV: 'prod' },
];
for (const env of environments) {
  try {
    const config = loadConfig(env);
    console.log(`%%wouldListen%% ${config.host}:${config.port} — ${JSON.stringify(config)}`);
  } catch (error) {
    console.log(`%%refused%%\n${error.message}`);
  }
}
