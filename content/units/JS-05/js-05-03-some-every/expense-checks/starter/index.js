const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

// 1. true when every expense has a non-empty label.
function allLabeled(list) {
  // your code here
}

// 2. true when at least one expense costs MORE than limitMinor.
//    Amounts are in minor units (kopiykas): 60000 means 600.00.
function anyOverLimit(list, limitMinor) {
  // your code here
}

console.log(allLabeled(expenses));
console.log(anyOverLimit(expenses, 60000));
console.log(allLabeled([]), anyOverLimit([], 60000));
