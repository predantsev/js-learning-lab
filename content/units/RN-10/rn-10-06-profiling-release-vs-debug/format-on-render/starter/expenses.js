// expenses.js: 200 synthetic expenses. Do not edit.
const LABELS = ['%%groceries%%', '%%pass%%', '%%coffee%%', '%%bulbs%%', '%%cinema%%', '%%lunch%%'];

export const expenses = Array.from({ length: 200 }, (_, i) => ({
  id: `e-${String(i + 1).padStart(3, '0')}`,
  label: `${LABELS[i % LABELS.length]} #${i + 1}`,
  amountMinor: 500 + ((i * 7919) % 90000),
  date: `2026-0${1 + (i % 3)}-${String(1 + (i % 28)).padStart(2, '0')}`,
}));
