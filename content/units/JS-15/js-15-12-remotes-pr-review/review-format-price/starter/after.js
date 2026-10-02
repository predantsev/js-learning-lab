// formatPrice on the pull request's branch (read-only).
// Pull request: "Format prices without floating-point division".
export function formatPrice(amountMinor) {
  const whole = Math.floor(amountMinor / 100);
  const cents = amountMinor % 100;
  return `${whole}.${cents} UAH`;
}
