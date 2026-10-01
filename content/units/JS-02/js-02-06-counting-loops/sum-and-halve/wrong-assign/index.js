// The running total is overwritten instead of added to, so sum ends as the last i.
const n = 10;
let sum = 0;
for (let i = 1; i <= n; i++) {
  sum = i;
}

let price = 160;
let halvings = 0;
while (price >= 10) {
  price = price / 2;
  halvings++;
}

console.log(sum, halvings);
