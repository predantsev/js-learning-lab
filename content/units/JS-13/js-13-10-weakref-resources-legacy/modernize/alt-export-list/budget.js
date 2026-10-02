// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
// (It used to read `arguments` and declare everything with var.)
const currency = "UAH";
const NOTE = "no var, no arguments";

function sum(...amounts) {
  let total = 0;
  for (let i = 0; i < amounts.length; i += 1) {
    total += amounts[i];
  }
  return total;
}

function format(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} ${currency}`;
}

function formatTotal(...amounts) {
  return format(sum(...amounts));
}

export { sum, format, formatTotal };
