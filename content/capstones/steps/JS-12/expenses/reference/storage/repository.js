// The expense repository: the current list of expenses and its saving, in one place. The same
// repository is written twice, as a class and as a factory function; both have the same methods
// and pass the same tests (tests/repository.test.js). The page uses the class.
import { addExpense, updateExpense, removeExpense, summarizeExpenses } from "../domain/expenses.js";
import { saveExpenses } from "./expenses.js";

// The class keeps the list and the storage in private fields: code outside the class cannot read
// or replace them, so every change goes through a method, and every method saves.
export class ExpenseRepository {
  #storage;
  #expenses;

  constructor(storage, expenses) {
    this.#storage = storage;
    this.#expenses = [...expenses];
  }

  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.
  get items() {
    return [...this.#expenses];
  }

  // Adds an expense if the draft passes validateExpense; an invalid draft changes nothing.
  add(id, input) {
    const next = addExpense(this.#expenses, id, input);
    if (next !== this.#expenses) {
      this.#expenses = next;
      saveExpenses(this.#storage, this.#expenses);
    }
  }

  update(id, changes) {
    this.#expenses = updateExpense(this.#expenses, id, changes);
    saveExpenses(this.#storage, this.#expenses);
  }

  remove(id) {
    this.#expenses = removeExpense(this.#expenses, id);
    saveExpenses(this.#storage, this.#expenses);
  }

  // The total of every category in minor units: { food, transport, home, fun }.
  totalByCategory() {
    return summarizeExpenses(this.#expenses).byCategory;
  }
}

// The same repository as a factory: the closure keeps the list and the storage, and the methods
// use them directly, without `this`. So a method still works when it is passed on alone.
export function createExpenseRepository(storage, initialExpenses) {
  let expenses = [...initialExpenses];

  function replace(next) {
    expenses = next;
    saveExpenses(storage, expenses);
  }

  return {
    get items() {
      return [...expenses];
    },
    add(id, input) {
      const next = addExpense(expenses, id, input);
      if (next !== expenses) {
        replace(next);
      }
    },
    update(id, changes) {
      replace(updateExpense(expenses, id, changes));
    },
    remove(id) {
      replace(removeExpense(expenses, id));
    },
    totalByCategory() {
      return summarizeExpenses(expenses).byCategory;
    },
  };
}
