// formatPrice on main, before the pull request (read-only).
export function formatPrice(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} UAH`;
}
