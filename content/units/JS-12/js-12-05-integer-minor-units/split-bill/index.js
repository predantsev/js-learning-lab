// Ten coffees at 0.10 each: once as fractional hryvnias, once as whole kopiykas.
let totalFloat = 0;
let totalMinor = 0;
for (let i = 0; i < 10; i++) {
  totalFloat = totalFloat + 0.1;
  totalMinor = totalMinor + 10;
}
console.log("%%float%%", totalFloat);
console.log("%%minor%%", totalMinor);

// Split a bill of 100 kopiykas between three friends.
const billMinor = 100;
const people = 3;
const share = Math.floor(billMinor / people);
const shares = [share, share, share];

const sumOfShares = shares.reduce((sum, part) => sum + part, 0);
console.log("%%shares%%", shares, "%%sum%%", sumOfShares, "%%of%%", billMinor);
