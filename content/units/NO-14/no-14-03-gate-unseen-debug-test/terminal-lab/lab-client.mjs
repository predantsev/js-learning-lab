// Real requests to the running club lab: node lab-client.mjs log | show
//   log  — m-03 logs 30 pages of b-02, and prints the line the club page would show
//   show — prints the line of m-03 as the server's summary gives it now
const base = `http://127.0.0.1:${process.env.PORT ?? 7360}`;
const ask = (path, init = {}) => fetch(base + path, { ...init, signal: AbortSignal.timeout(2000) });
const line = (m) => `${m.name} — %%pages%%: ${m.pagesRead}, %%votes%%: ${m.votes}`;

const command = process.argv[2];
const before = (await (await ask('/summary')).json()).find((m) => m.id === 'm-03');
if (command === 'log') {
  const response = await ask('/reads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: 'm-03', bookId: 'b-02', pages: 30 }),
  });
  console.log(`POST /reads → ${response.status}`);
  console.log(`%%onPage%% ${line({ ...before, pagesRead: before.pagesRead + 30 })}`);
} else if (command === 'show') {
  console.log(`%%fromServer%% ${line(before)}`);
} else {
  console.log('usage: node lab-client.mjs log | show');
}
