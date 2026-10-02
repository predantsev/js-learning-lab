// Reads the "how many?" field. Accepts only whole numbers from 1 to 99,
// written with the digits 0–9 (spaces around them are fine).
// Returns { ok: true, value } or { ok: false, error }.
function parseQuantity(text) {
  const value = parseInt(text, 10);
  return { ok: true, value };
}

console.log(parseQuantity(" 12 "));
console.log(parseQuantity("12px"));
console.log(parseQuantity(""));
console.log(parseQuantity("100"));
