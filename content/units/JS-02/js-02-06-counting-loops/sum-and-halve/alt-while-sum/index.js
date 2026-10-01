// The sum can also be built with while and +=; the counting for loop is just shorter.
const n = 10;
let sum = 0;
let i = 1;
while (i <= n) {
  sum += i;
  i++;
}

let price = 160;
let halvings = 0;
while (price >= 10) {
  price /= 2;
  halvings += 1;
}

console.log(sum, halvings);
