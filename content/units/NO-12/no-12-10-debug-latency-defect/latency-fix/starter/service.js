// The expense service after three recent changes:
//   1. categories.json is read synchronously on every request (it used to be read once);
//   2. every returned expense gets `rank` — its place among all expenses by amount;
//   3. the request log line now carries the query string.
// GET /expenses?category=<id>&payer=<address>&limit=<n> answers the n largest expenses of that
// category (and payer, when given).
import http from 'node:http';
import { readFileSync } from 'node:fs';

function byAmountDesc(a, b) {
  return b.amountMinor - a.amountMinor;
}

export function createService(expenses, { log, span = (name, fn) => fn() }) {
  let lastId = 0;
  return http.createServer((request, response) => {
    const requestId = `r-${++lastId}`;
    const started = performance.now();
    const url = new URL(request.url, 'http://127.0.0.1');
    const categories = span('categories', () => JSON.parse(readFileSync('categories.json', 'utf8')));
    const category = url.searchParams.get('category');
    if (!categories.includes(category)) {
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'unknown category' }));
      return;
    }
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const page = span('query', () => {
      const payer = url.searchParams.get('payer');
      const matching = expenses.filter((e) => e.category === category && (!payer || e.payer === payer)).toSorted(byAmountDesc).slice(0, limit);
      return matching.map((expense) => ({ ...expense, rank: expenses.toSorted(byAmountDesc).indexOf(expense) + 1 }));
    });
    const body = span('serialize', () => JSON.stringify(page));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(body);
    log({ requestId, route: url.pathname, query: url.search, status: 200, ms: Math.round((performance.now() - started) * 100) / 100 });
  });
}
