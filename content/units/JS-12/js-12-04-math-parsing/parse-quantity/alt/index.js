// Reads the "how many?" field. Accepts only whole numbers from 1 to 99,
// written with the digits 0–9 (spaces around them are fine).
// Returns { ok: true, value } or { ok: false, error }.
const DIGITS = "0123456789";

function parseQuantity(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "required" };
  }
  let value = 0;
  for (const char of trimmed) {
    if (!DIGITS.includes(char)) {
      return { ok: false, error: "not-a-number" };
    }
    value = value * 10 + DIGITS.indexOf(char);
  }
  if (value >= 1 && value <= 99) {
    return { ok: true, value };
  }
  return { ok: false, error: "out-of-range" };
}

console.log(parseQuantity(" 12 "));
console.log(parseQuantity("12px"));
console.log(parseQuantity(""));
console.log(parseQuantity("100"));
