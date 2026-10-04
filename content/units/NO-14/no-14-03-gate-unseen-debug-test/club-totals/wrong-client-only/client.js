// What the club's page does, without the page: it loads the summary, and after a member logs pages
// it adds them to the row it shows instead of loading everything again.
export function createClient(base) {
  let members = [];
  const ask = (path, init = {}) => fetch(base + path, { ...init, signal: AbortSignal.timeout(2000) });
  return {
    get members() {
      return members;
    },
    async load() {
      members = await (await ask('/summary')).json();
    },
    async logPages(memberId, bookId, pages) {
      const response = await ask('/reads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ memberId, bookId, pages }),
      });
      if (response.status !== 201) throw new Error(`POST /reads answered ${response.status}`);
      await this.load(); // show what the server says instead of adding locally
    },
  };
}
