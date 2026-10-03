// A fixture server: after 50 ms it answers with JSON text, parsed like response.json() does.
// The third record has its amount as text — the kind of mistake a real server makes after an update.
const RESPONSE = `[
  { "id": "e-01", "label": "%%groceries%%", "amount_minor": 84550, "spent_on": "2026-03-01", "category": "food" },
  { "id": "e-02", "label": "%%transit%%", "amount_minor": 52000, "spent_on": "2026-03-01", "category": "transport" },
  { "id": "e-03", "label": "%%coffee%%", "amount_minor": "18000", "spent_on": "2026-02-28", "category": "fun" }
]`;

export function fetchExpenses(): Promise<unknown> {
  return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(RESPONSE)), 50));
}
