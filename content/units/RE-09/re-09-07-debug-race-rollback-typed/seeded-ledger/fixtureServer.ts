// A fixture server with timeline controls.
export const GOOD = `[
  { "id": "e-01", "label": "%%groceries%%", "amount_minor": 84550, "spent_on": "2026-03-01" },
  { "id": "e-02", "label": "%%transit%%", "amount_minor": 52000, "spent_on": "2026-03-01" },
  { "id": "e-06", "label": "%%lunch%%", "amount_minor": 21050, "spent_on": "2026-03-02" }
]`;
// The same list after a faulty server update: e-02 lost its date.
export const DAMAGED = GOOD.replace('"amount_minor": 52000, "spent_on": "2026-03-01"', '"amount_minor": 52000, "spent_on": null');

let answer = GOOD;

export function setAnswer(jsonText: string): void {
  answer = jsonText;
}

// Like response.json(): the parsed body after 20 ms.
export function getJson(): Promise<unknown> {
  return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(answer)), 20));
}

// Saves an amount after `delayMs`; rejects when `fail` is true.
export function putAmount(id: string, amountMinor: number, delayMs: number, fail: boolean): Promise<void> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error(`503 for ${id}`)) : resolve()), delayMs),
  );
}
