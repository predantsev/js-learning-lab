// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
var currency = "UAH";

export function sum() {
  var total = 0;
  for (var i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}

export function format(amountMinor) {
  return (amountMinor / 100).toFixed(2) + " " + currency;
}

export function formatTotal() {
  return format(sum.apply(null, arguments));
}
