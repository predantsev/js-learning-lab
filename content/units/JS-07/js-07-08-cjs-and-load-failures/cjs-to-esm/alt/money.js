// formatMinor(amountMinor): kopiykas as hryvnias with two digits, e.g. 84550 → "845.50".
function formatMinor(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}

// An export list: the closest shape to module.exports = { formatMinor }.
export { formatMinor };
