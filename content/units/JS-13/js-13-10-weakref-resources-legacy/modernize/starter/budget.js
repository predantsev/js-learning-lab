// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
var BudgetTools = (function () {
  var currency = "UAH";

  function sum() {
    var total = 0;
    for (var i = 0; i < arguments.length; i++) {
      total += arguments[i];
    }
    return total;
  }

  function format(amountMinor) {
    return (amountMinor / 100).toFixed(2) + " " + currency;
  }

  function formatTotal() {
    return format(sum.apply(null, arguments));
  }

  return { sum: sum, format: format, formatTotal: formatTotal };
})();
