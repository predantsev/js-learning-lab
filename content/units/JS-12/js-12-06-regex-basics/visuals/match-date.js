// Walks the input piece by piece, as /^\d{4}-\d{2}-\d{2}$/ does.
// "d" means "one digit"; "-" means "exactly this character".
const pattern = ["d", "d", "d", "d", "-", "d", "d", "-", "d", "d"];

function matchesDate(input) {
  let pos = 0;
  for (const piece of pattern) {
    const char = input[pos];
    const fits = piece === "d" ? char >= "0" && char <= "9" : char === piece;
    if (!fits) {
      return false;
    }
    pos = pos + 1;
  }
  return pos === input.length;
}

const good = matchesDate("2026-03-01");
const bad = matchesDate("2026-3-1x");
console.log(good, bad);
