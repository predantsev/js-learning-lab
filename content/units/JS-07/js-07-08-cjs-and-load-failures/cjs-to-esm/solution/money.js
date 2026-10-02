// formatMinor(amountMinor): kopiykas as hryvnias with two digits, e.g. 84550 → "845.50".
export function formatMinor(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
