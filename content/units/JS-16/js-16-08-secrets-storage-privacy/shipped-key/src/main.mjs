// src/main.mjs: the page's entry module, before the build.
import { totalMinor, formatMinor } from "../money.mjs";

const expenses = [
  { label: "Weekly groceries", amountMinor: 84550 },
  { label: "Transit pass", amountMinor: 52000 },
];

const total = totalMinor(expenses);
document.querySelector("h1").textContent = APP_TITLE;
document.querySelector("#total").textContent = formatMinor(total);

const ratesUrl = `https://rates.example/latest?key=${RATES_API_KEY}`;
console.log("Rates request prepared:", ratesUrl.length, "characters");
