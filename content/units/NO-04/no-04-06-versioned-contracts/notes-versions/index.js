// Two clients of the notes API: one released long ago (v1), one new (v2).
import { createApp } from './app.js';

// The old client: already installed on people's phones, it cannot be changed overnight.
async function v1Client(base) {
  const response = await fetch(`${base}/v1/notes/n-1`, { signal: AbortSignal.timeout(2000) });
  const note = await response.json();
  return `v1 ${response.status}: ${note.title.toUpperCase()}`;
}

// The new client, written against version 2.
async function v2Client(base) {
  const response = await fetch(`${base}/v2/notes/n-1`, { signal: AbortSignal.timeout(2000) });
  const note = await response.json();
  return `v2 ${response.status}: ${note.heading.toUpperCase()}`;
}

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const client of [v1Client /* , v2Client */]) {
    try {
      console.log(await client(base));
    } catch (error) {
      console.log(`${client.name} %%broke%%: ${error.name}: ${error.message}`);
    }
  }
} finally {
  server.closeAllConnections();
  server.close();
}
