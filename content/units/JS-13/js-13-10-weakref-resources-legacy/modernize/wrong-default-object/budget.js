// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
const currency = "UAH";

function sum(...amounts) {
  let total = 0;
  for (const amount of amounts) {
    total += amount;
  }
  return total;
}

function format(amountMinor) {
  return (amountMinor / 100).toFixed(2) + " " + currency;
}

function formatTotal(...amounts) {
  return format(sum(...amounts));
}

export default { sum, format, formatTotal };
