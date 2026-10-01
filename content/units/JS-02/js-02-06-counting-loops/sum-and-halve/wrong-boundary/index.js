// "Below 10" read as > 10: a price of exactly 10 is not halved any more (4 instead of 5).
const n = 10;
let sum = 0;
for (let i = 1; i <= n; i++) {
  sum = sum + i;
}

let price = 160;
let halvings = 0;
while (price > 10) {
  price = price / 2;
  halvings++;
}

console.log(sum, halvings);
