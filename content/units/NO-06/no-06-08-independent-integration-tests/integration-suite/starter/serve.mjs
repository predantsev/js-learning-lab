// For the terminal only: the planner API as its own process on 127.0.0.1:7350, data in tasks.json.
// Stop it with Ctrl+C; start it again and the data is still there.
import { startServer } from './system.js';

const server = await startServer({ dataFile: new URL('./tasks.json', import.meta.url), port: Number(process.env.PORT ?? 7350) });
console.log(`%%apiOn%% ${server.base} (%%dataFile%% tasks.json). %%stopHint%%`);
process.on('SIGINT', async () => {
  await server.stop();
  console.log('%%apiStopped%%');
});
