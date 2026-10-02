import { totalText } from "./ui.js";
import { total } from "./domain.js";

console.log("▶ main.js");

const expenses = [
  { id: "e-01", amountMinor: 84550 },
  { id: "e-02", amountMinor: 52000 },
];
console.log(totalText(expenses));
console.log(total(expenses));
