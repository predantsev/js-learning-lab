// The web client's adapter for expenses: what the page calls. The form gives the amount as the
// person typed it, in hryvnias (or the project currency's main unit): "12.50".
export function createAdapter(base, requestId) {
  const headers = { 'content-type': 'application/json', 'x-request-id': requestId };
  return {
    async addExpense({ label, amount, date, category }) {
      const response = await fetch(`${base}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ label, amountMinor: Number(amount), date, category }),
        signal: AbortSignal.timeout(5000),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}
