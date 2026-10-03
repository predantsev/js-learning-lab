import { RATES_API_KEY, rateFor } from "./rates";

// 136550 → "1365.50 UAH": amounts are stored in minor units and formatted only for display.
export function formatMinor(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} %%currency%%`;
}

export function toEuro(amountMinor) {
  return ((amountMinor / 100) * rateFor("EUR", RATES_API_KEY)).toFixed(2);
}
