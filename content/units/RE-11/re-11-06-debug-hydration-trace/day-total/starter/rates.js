// Exchange rates from a paid service. The key is made up.
export const RATES_API_KEY = "demo-RATE-not-a-real-key";

export function rateFor(currency, key) {
  // A pretend call to the rates service: it answers only with the right key.
  if (key !== RATES_API_KEY) throw new Error("rates service refused the key");
  return { EUR: 0.022 }[currency];
}
