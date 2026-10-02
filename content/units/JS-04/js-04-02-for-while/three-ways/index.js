// The same total written with three loops.
// Amounts are in minor units (kopiykas or cents).
const amounts = [84550, 52000, 18000];

let forTotal = 0;
for (let i = 0; i < amounts.length; i++) {
  forTotal = forTotal + amounts[i];
}
console.log("for:", forTotal);

let whileTotal = 0;
let w = 0;
while (w < amounts.length) {
  whileTotal = whileTotal + amounts[w];
  w++;
}
console.log("while:", whileTotal);

let doTotal = 0;
let d = 0;
do {
  doTotal = doTotal + amounts[d];
  d++;
} while (d < amounts.length);
console.log("do-while:", doTotal);
