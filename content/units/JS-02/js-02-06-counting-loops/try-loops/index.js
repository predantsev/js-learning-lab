for (let i = 1; i <= 5; i++) {
  console.log("%%pass%%", i);
}

let n = 8;
let halvings = 0;
while (n >= 1) {
  n = n / 2;
  halvings++;
}
console.log("%%halvings%%", halvings);
