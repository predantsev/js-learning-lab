// Reads the "how many?" field. Accepts only whole numbers from 1 to 99,
// written with the digits 0–9 (spaces around them are fine).
// Returns { ok: true, value } or { ok: false, error }.
function parseQuantity(text) {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: false, error: "required" };
  }
  const onlyDigits = [...trimmed].every((char) => char >= "0" && char <= "9");
  if (!onlyDigits) {
    return { ok: false, error: "not-a-number" };
  }
  const value = Number(trimmed);
  if (value < 1 || value > 99) {
    return { ok: false, error: "out-of-range" };
  }
  return { ok: true, value };
}

console.log(parseQuantity(" 12 "));
console.log(parseQuantity("12px"));
console.log(parseQuantity(""));
console.log(parseQuantity("100"));
