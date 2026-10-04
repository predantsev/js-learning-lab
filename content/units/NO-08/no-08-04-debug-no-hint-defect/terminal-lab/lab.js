// Lab helpers for the demo and for your regression test.
// freshStore(name): writes the fixtures to <name>.json in the working folder → the file name.
// serve(server): starts an http.Server on a free 127.0.0.1 port → { base, close() }.
import { writeFile } from 'node:fs/promises';
import { HABITS } from './habits.js';

export async function freshStore(name) {
  const file = `${name}.json`;
  await writeFile(file, JSON.stringify({ schemaVersion: 1, records: HABITS }));
  return file;
}

export async function serve(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
