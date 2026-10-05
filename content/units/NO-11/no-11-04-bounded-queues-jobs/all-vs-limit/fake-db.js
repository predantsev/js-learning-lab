// A simulated database for the lab: each query takes 30 ms, and it accepts at most 10 open
// connections at once, like the connection limit of a real database server.
// Where it differs from a real database: there is no network, no SQL and no data; the limit and the
// timing are fixed numbers chosen for the lab, and a real server's error text and code differ.
export function createFakeDb({ maxConnections = 10, queryMs = 30 } = {}) {
  let open = 0;
  return {
    async query() {
      if (open >= maxConnections) throw new Error('%%tooMany%%');
      open += 1;
      try {
        await new Promise((resolve) => setTimeout(resolve, queryMs));
        return 'ok';
      } finally {
        open -= 1;
      }
    },
  };
}
