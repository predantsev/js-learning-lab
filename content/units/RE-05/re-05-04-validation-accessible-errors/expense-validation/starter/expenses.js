// The expense tracker's validator: { ok: true, value } or { ok: false, errors: { field: messageKey } }.
export const CATEGORIES = ["food", "transport", "home", "fun"];

export function validateExpense(input) {
  const errors = {};
  const label = String(input.label ?? "").trim();
  if (label.length === 0) errors.label = "labelRequired";
  else if (label.length > 80) errors.label = "labelTooLong";
  const amountText = String(input.amount ?? "").trim().replace(",", ".");
  const amountMinor = /^\d+(\.\d{1,2})?$/.test(amountText) ? Math.round(Number(amountText) * 100) : NaN;
  if (Number.isNaN(amountMinor)) errors.amount = "amountInvalid";
  else if (amountMinor <= 0) errors.amount = "amountPositive";
  if (!CATEGORIES.includes(input.category)) errors.category = "categoryRequired";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { label, amountMinor, category: input.category } };
}

export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
