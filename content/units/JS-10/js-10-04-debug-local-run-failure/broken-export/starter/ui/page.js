// The page: the list of expenses and the total.
import { formatAmount, totalOf } from "../domain/expenses";

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, category: "food" },
  { id: "e-02", label: "%%transitPass%%", amountMinor: 52000, category: "transport" },
  { id: "e-06", label: "%%lunch%%", amountMinor: 21050, category: "food" },
];

export function start() {
  const list = document.querySelector("#items");
  for (const expense of expenses) {
    const item = document.createElement("li");
    item.textContent = expense.label + " — " + formatAmount(expense.amountMinor);
    list.append(item);
  }
  document.querySelector("#summary").textContent = "%%total%% " + formatAmount(totalOf(expenses));
}
