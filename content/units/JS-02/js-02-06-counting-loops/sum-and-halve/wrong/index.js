// Off by one: i < n stops before n, so the last number is never added (45 instead of 55).
const n = 10;
let sum = 0;
for (let i = 1; i < n; i++) {
  sum = sum + i;
}

let price = 160;
let halvings = 0;
while (price >= 10) {
  price = price / 2;
  halvings++;
}

console.log(sum, halvings);
