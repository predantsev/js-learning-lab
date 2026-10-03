// expenses.js: shared validation of the expense tracker. Do not edit.
// Accepts "12,50" and "12.50"; returns { ok: true, value: amountMinor } or { ok: false, errors: { amountMinor: messageKey } }.
export function validateAmount(text) {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return { ok: false, errors: { amountMinor: 'amountRequired' } };
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return { ok: false, errors: { amountMinor: 'amountInvalid' } };
  const amountMinor = Math.round(Number(normalized) * 100);
  if (amountMinor <= 0) return { ok: false, errors: { amountMinor: 'amountInvalid' } };
  return { ok: true, value: amountMinor };
}
