// Driver (read-only): starts your server, sends it two requests and stops it.
import { loadConfig } from './config.js';
import { startServer } from './app.js';

// In your terminal PORT would come from process.env; here the driver asks for port 0 (any free port).
const config = loadConfig({ PORT: '0' });
const server = await startServer(config);

if (!server?.listening) {
  console.log('%%notListening%%');
} else {
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [method, path] of [['GET', '/records?sort=name'], ['POST', '/records']]) {
      const response = await fetch(base + path, { method, signal: AbortSignal.timeout(1500) });
      console.log(`${method} ${path} → ${response.status} "${await response.text()}"`);
    }
  } catch (error) {
    console.log(`%%gaveUp%% ${error.name}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
