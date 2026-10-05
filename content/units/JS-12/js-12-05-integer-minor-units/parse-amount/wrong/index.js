// Reads an amount typed as hryvnias ("12,50", "12.5", "12") and returns it
// in kopiykas: { ok: true, value: 1250 } or { ok: false, error }.
function parseAmountMinor(text) {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: false, error: "required" };
  }
  const hryvnias = Number(trimmed.replace(",", "."));
  if (Number.isNaN(hryvnias)) {
    return { ok: false, error: "not-a-number" };
  }
  const value = Math.trunc(hryvnias * 100);
  if (value <= 0) {
    return { ok: false, error: "not-positive" };
  }
  return { ok: true, value };
}

console.log(parseAmountMinor("12,50"));
console.log(parseAmountMinor("0,29"));
console.log(parseAmountMinor("1,005"));
