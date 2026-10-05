// A client built from the shared contract: it validates every wish before the app sees it.
import { parseWishV1, parseWishV2 } from './contract.ts';
import { createServer } from './server.ts';

async function load(base, path, parse) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(2000) });
  const body = await response.json();
  const problems = response.ok ? body.flatMap((wish, index) => parse(wish).map((error) => `${index}.${error}`)) : [`status ${response.status}`];
  if (problems.length > 0) return `${path}: %%rejected%% — ${problems.join('; ')}`;
  return `${path}: %%accepted%% ${body.length}`;
}

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  console.log(await load(base, '/v1/records', parseWishV1)); // the client already installed on phones
  // console.log(await load(base, '/v2/records', parseWishV2)); // a new client, built from contract v2
} finally {
  server.closeAllConnections();
  server.close();
}
