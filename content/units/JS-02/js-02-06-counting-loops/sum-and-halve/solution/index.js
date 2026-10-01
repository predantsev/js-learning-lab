// 1. With a for loop, add up the whole numbers from 1 to n.
const n = 10;
let sum = 0;
for (let i = 1; i <= n; i++) {
  sum = sum + i;
}

// 2. With a while loop, count how many times the price can be halved
//    before it is below 10. Example: 80 -> 40 -> 20 -> 10 -> 5 is 4 halvings.
let price = 160;
let halvings = 0;
while (price >= 10) {
  price = price / 2;
  halvings++;
}

console.log(sum, halvings);
