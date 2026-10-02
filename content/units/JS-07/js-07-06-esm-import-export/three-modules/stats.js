import { total } from "./domain.js";

console.log("▶ stats.js");

// average(expenses): the average amountMinor, or 0 for an empty list.
export function average(expenses) {
  return expenses.length === 0 ? 0 : total(expenses) / expenses.length;
}
