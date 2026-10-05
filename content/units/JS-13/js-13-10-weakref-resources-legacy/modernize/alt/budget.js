// A legacy "module": an IIFE that hides currency and hands out three functions.
// Rewrite it as an ES module with the same behavior.
const currency = "UAH";

export const sum = (...amounts) => amounts.reduce((total, amount) => total + amount, 0);

export const format = (amountMinor) => `${(amountMinor / 100).toFixed(2)} ${currency}`;

export const formatTotal = (...amounts) => format(sum(...amounts));
