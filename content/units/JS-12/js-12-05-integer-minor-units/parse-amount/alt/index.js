// Reads an amount typed as hryvnias ("12,50", "12.5", "12") and returns it
// in kopiykas: { ok: true, value: 1250 } or { ok: false, error }.
const DIGITS = "0123456789";

function parseAmountMinor(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "required" };
  }
  let whole = 0;
  let fractionDigits = 0;
  let fraction = 0;
  let seenSeparator = false;
  let wholeDigits = 0;
  for (const char of trimmed) {
    if (char === "," || char === ".") {
      if (seenSeparator) {
        return { ok: false, error: "not-a-number" };
      }
      seenSeparator = true;
    } else if (DIGITS.includes(char)) {
      if (seenSeparator) {
        fraction = fraction * 10 + DIGITS.indexOf(char);
        fractionDigits = fractionDigits + 1;
      } else {
        whole = whole * 10 + DIGITS.indexOf(char);
        wholeDigits = wholeDigits + 1;
      }
    } else {
      return { ok: false, error: "not-a-number" };
    }
  }
  if (wholeDigits === 0) {
    return { ok: false, error: "not-a-number" };
  }
  if (fractionDigits > 2) {
    return { ok: false, error: "too-many-decimals" };
  }
  const value = whole * 100 + (fractionDigits === 1 ? fraction * 10 : fraction);
  if (value <= 0) {
    return { ok: false, error: "not-positive" };
  }
  return { ok: true, value };
}

console.log(parseAmountMinor("12,50"));
console.log(parseAmountMinor("0,29"));
console.log(parseAmountMinor("1,005"));
