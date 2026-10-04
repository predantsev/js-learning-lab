// The kill harness: for each design, ROUNDS rounds of "save wishes over HTTP, kill, reopen".
// A wish counts as acknowledged when the server answered 201. After the kill a NEW repository
// object reads the same file, and every acknowledged wish that is missing is a lost write.
import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { cached, readBack, writeThrough } from './designs.js';

const FLUSH_MS = 200; // the cache's flush interval (the real one in the question was 10 s)
const ROUNDS = 8;
const FILE = 'wishes.json';

function serve(repo) {
  return http.createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    try {
      const item = await repo.add(JSON.parse(body));
      response.writeHead(201, { 'content-type': 'application/json' });
      response.end(JSON.stringify(item));
    } catch {
      response.writeHead(500).end();
    }
  });
}

async function round(design, killAfterMs) {
  writeFileSync(FILE, JSON.stringify({ schemaVersion: 1, records: [] }));
  const repo = design(FILE);
  const server = serve(repo);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/items`;
  const acknowledged = [];
  const started = Date.now();
  let n = 0;
  let inFlight = 0;
  // Three senders at once and no pause, so that the kill usually lands while a request (and its
  // save) is still running.
  async function sender() {
    while (Date.now() - started < killAfterMs) {
      const id = `w-${++n}`;
      inFlight++;
      try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify({ id, name: '%%wish%%' }), signal: AbortSignal.timeout(2000) });
        if (response.status === 201) acknowledged.push(id);
      } catch {
        // the kill cut the connection: no answer, so not acknowledged
      }
      inFlight--;
    }
  }
  const senders = [sender(), sender(), sender()];
  await new Promise((resolve) => setTimeout(resolve, killAfterMs));
  const killedMidRequest = inFlight > 0;
  repo.kill(); // the crash: no more writes, memory is abandoned
  server.closeAllConnections();
  server.close();
  const onDisk = new Set(readBack(FILE).map((item) => item.id));
  const lost = acknowledged.filter((id) => !onDisk.has(id)).length;
  await Promise.all(senders);
  return { lost, killedMidRequest };
}

for (const [name, design] of [
  ['write-through', (file) => writeThrough(file)],
  [`cache, flush every ${FLUSH_MS} ms`, (file) => cached(file, FLUSH_MS)],
]) {
  const results = [];
  for (let i = 0; i < ROUNDS; i++) results.push(await round(design, 150 + Math.random() * 250));
  const hit = results.filter((result) => result.lost > 0).length;
  const total = results.reduce((sum, result) => sum + result.lost, 0);
  const midRequest = results.filter((result) => result.killedMidRequest).length;
  console.log(`${name}: %%rounds%% ${ROUNDS}, %%midRequest%% ${midRequest}, %%lostIn%% ${hit}, %%lostTotal%% ${total}`);
}
