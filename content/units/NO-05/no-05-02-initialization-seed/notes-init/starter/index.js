// Starts the notes server twice against one store file and asks for the notes each time.
import { rm } from 'node:fs/promises';
import { startServer } from './init.js';

const FILE = 'data/notes.json';
const fixtures = [
  { id: 'n-01', title: '%%welcome%%', body: '%%welcomeBody%%', pinned: true },
  { id: 'n-02', title: '%%ideas%%', body: '', pinned: false },
];

await rm('data', { recursive: true, force: true });
for (const round of [1, 2]) {
  const server = await startServer(FILE, fixtures);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/notes`, { signal: AbortSignal.timeout(2000) });
    console.log(`%%start%% ${round}: ${response.status} ${await response.text()}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
