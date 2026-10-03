// 136550 → "1365.50 UAH": amounts are stored in minor units and formatted only for display.
// No import of rates.js: conversion needs the key, so it happens on the server.
export function formatMinor(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} %%currency%%`;
}
