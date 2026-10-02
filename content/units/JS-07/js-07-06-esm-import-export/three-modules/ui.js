import { total } from "./domain.js";

console.log("▶ ui.js");

// totalText(expenses): the total as text for the page, in hryvnias.
export function totalText(expenses) {
  return "%%totalLabel%%" + (total(expenses) / 100).toFixed(2) + " %%uah%%";
}
