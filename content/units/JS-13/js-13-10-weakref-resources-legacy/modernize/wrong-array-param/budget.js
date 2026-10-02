// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
const currency = "UAH";

export function sum(amounts) {
  return amounts.reduce((total, amount) => total + amount, 0);
}

export function format(amountMinor) {
  return (amountMinor / 100).toFixed(2) + " " + currency;
}

export function formatTotal(...amounts) {
  return format(sum(amounts));
}
