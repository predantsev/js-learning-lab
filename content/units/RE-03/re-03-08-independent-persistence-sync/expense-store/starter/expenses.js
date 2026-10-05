// The expense tracker's domain module (read-only). Amounts are whole minor units (kopiykas/cents).
export const STORAGE_KEY = "jsll.expenses.v1";
export const TODAY = "2026-03-02";

export const CATEGORIES = [
  { id: "food", label: "%%food%%" },
  { id: "transport", label: "%%transport%%" },
  { id: "home", label: "%%home%%" },
  { id: "fun", label: "%%fun%%" },
];

export const DEFAULT_EXPENSES = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
];

/** Returns { ok: true, value } with a clean record, or { ok: false, errors: { field: messageKey } }. */
export function validateExpense(input) {
  if (input === null || typeof input !== "object") return { ok: false, errors: { record: "notAnObject" } };
  const errors = {};
  const label = typeof input.label === "string" ? input.label.trim() : "";
  if (typeof input.id !== "string" || input.id === "") errors.id = "required";
  if (label.length < 1 || label.length > 80) errors.label = "length";
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) errors.amountMinor = "positiveInteger";
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "format";
  if (!CATEGORIES.some((category) => category.id === input.category)) errors.category = "unknown";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id: input.id, label, amountMinor: input.amountMinor, date: input.date, category: input.category } };
}

export function summarizeExpenses(expenses) {
  return { count: expenses.length, totalMinor: expenses.reduce((sum, expense) => sum + expense.amountMinor, 0) };
}

/** "18", "18.5" or "18,50" → 1850; anything else → NaN. */
export function parseAmount(text) {
  const match = /^\s*(\d+)(?:[.,](\d{1,2}))?\s*$/.exec(text);
  if (!match) return NaN;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export function formatAmount(minor) {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}
