// A client that retries a POST once when the network fails (no answer at all).
export async function postWithRetry(url, value, headers = {}) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(value),
        signal: AbortSignal.timeout(2000), // never wait longer than 2 s
      });
      console.log(`[client] %%attempt%% ${attempt}: ${response.status}`);
      return response.json();
    } catch (error) {
      // fetch rejects when no answer came back: we do not know whether the server did the work.
      console.log(`[client] %%attempt%% ${attempt}: ${error.name} — %%noAnswer%%`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('gave up after 2 attempts');
}
