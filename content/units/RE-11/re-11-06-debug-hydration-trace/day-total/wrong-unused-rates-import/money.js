import { RATES_API_KEY, rateFor } from "./rates";

// toEuro is gone, but the import stayed: nothing uses it, yet it still pulls rates.js and the key in.
// 136550 → "1365.50 UAH": amounts are stored in minor units and formatted only for display.
export function formatMinor(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} %%currency%%`;
}
