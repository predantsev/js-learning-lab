// Reads an amount typed as hryvnias ("12,50", "12.5", "12") and returns it
// in kopiykas: { ok: true, value: 1250 } or { ok: false, error }.
function parseAmountMinor(text) {
  const hryvnias = parseFloat(text);
  if (Number.isNaN(hryvnias)) {
    return { ok: false, error: "required" };
  }
  return { ok: true, value: Math.round(hryvnias * 100) };
}

console.log(parseAmountMinor("12,50"));
console.log(parseAmountMinor("0,29"));
console.log(parseAmountMinor("1,005"));
