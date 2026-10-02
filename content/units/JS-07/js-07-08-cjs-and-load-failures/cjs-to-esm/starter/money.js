// CommonJS, as it was written for Node.js. Rewrite it as an ES module.

// formatMinor(amountMinor): kopiykas as hryvnias with two digits, e.g. 84550 → "845.50".
function formatMinor(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}

module.exports = { formatMinor };
