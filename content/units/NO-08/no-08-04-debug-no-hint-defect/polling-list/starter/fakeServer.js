// A stand-in for the expense API inside this preview: it replaces fetch for /api/expenses and
// answers GET /api/expenses?category=<id> with the fixtures of that category after delayMs.
// Every request it receives prints one "server:" line in the console — the preview's server log.
// Where it differs from the real server: there is no HTTP and no server process (the answer is
// made inside the page), nothing is stored, and the "log" is the page console. It honours an
// AbortSignal the way fetch does: an aborted request rejects with an AbortError.
import { EXPENSES } from './expenses.js';

export function installFakeServer({ delayMs = 300 } = {}) {
  const realFetch = window.fetch;
  let count = 0;
  window.fetch = (input, init = {}) => {
    const url = new URL(String(input), window.location.href);
    if (url.pathname !== '/api/expenses') return realFetch(input, init);
    count += 1;
    console.log(`server: GET ${url.pathname}${url.search} (#${count})`);
    const category = url.searchParams.get('category');
    return new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
      if (init.signal?.aborted) return abort();
      const timer = setTimeout(() => {
        const body = EXPENSES.filter((expense) => expense.category === category);
        resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
      }, delayMs);
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        abort();
      });
    });
  };
}
