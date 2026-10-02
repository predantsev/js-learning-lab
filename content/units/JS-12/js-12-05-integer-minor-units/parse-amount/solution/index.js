// Reads an amount typed as hryvnias ("12,50", "12.5", "12") and returns it
// in kopiykas: { ok: true, value: 1250 } or { ok: false, error }.
function isDigits(text) {
  return [...text].every((char) => char >= "0" && char <= "9");
}

function parseAmountMinor(text) {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: false, error: "required" };
  }
  const parts = trimmed.replace(",", ".").split(".");
  const whole = parts[0];
  const fraction = parts.length > 1 ? parts[1] : "";
  if (parts.length > 2 || whole === "" || !isDigits(whole) || !isDigits(fraction)) {
    return { ok: false, error: "not-a-number" };
  }
  if (fraction.length > 2) {
    return { ok: false, error: "too-many-decimals" };
  }
  const kopiykas = fraction.length === 1 ? Number(fraction) * 10 : Number(fraction);
  const value = Number(whole) * 100 + kopiykas;
  if (value === 0) {
    return { ok: false, error: "not-positive" };
  }
  return { ok: true, value };
}

console.log(parseAmountMinor("12,50"));
console.log(parseAmountMinor("0,29"));
console.log(parseAmountMinor("1,005"));
