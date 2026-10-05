// Every change of the expense list as a typed action and one pure reducer: (list, action) => next
// list. The reducer never changes the list it receives; the domain functions compute every new list,
// and an action the domain rejects returns the same list — above all an amountMinor that is not a
// whole number of kopiykas above zero.
import { addExpense, updateExpense, removeExpense, validateExpense } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";

// What a saved expense consists of, besides its id.
export type ExpenseFields = Omit<Expense, "id">;

// A discriminated union on `type`: tsc rejects a misspelled type or a missing field.
export type ExpensesAction =
  | { type: "added"; fields: ExpenseFields }
  | { type: "updated"; id: string; fields: ExpenseFields }
  | { type: "removed"; id: string }
  | { type: "loaded"; expenses: Expense[] };

// An id that no expense of the list has yet (saved expenses may already use "e-7").
export function newId(list: Expense[]): string {
  let number = list.length + 1;
  while (list.some((expense) => expense.id === "e-" + number)) {
    number += 1;
  }
  return "e-" + number;
}

export function expensesReducer(expenses: Expense[], action: ExpensesAction): Expense[] {
  switch (action.type) {
    case "added":
      // addExpense checks the draft with validateExpense, so 12.5 or 0 kopiykas adds nothing.
      return addExpense(expenses, newId(expenses), action.fields);
    case "updated":
      // updateExpense copies any changes, so the draft is checked here first.
      if (!validateExpense(action.fields).ok) {
        return expenses;
      }
      return updateExpense(expenses, action.id, action.fields);
    case "removed":
      return removeExpense(expenses, action.id);
    case "loaded":
      // The starting expenses have arrived: they replace the list as a whole.
      return action.expenses;
    default: {
      // Every type is handled above, so here the action has the type never; a new action type
      // that is not handled makes tsc report this line.
      const unhandled: never = action;
      throw new Error("Unknown action: " + JSON.stringify(unhandled));
    }
  }
}
