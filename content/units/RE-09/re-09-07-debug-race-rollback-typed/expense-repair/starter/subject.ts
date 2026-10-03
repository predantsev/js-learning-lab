// What the regression tests test. Read-only.
// Your tests call subject.expensesReducer and subject.loadExpenses. The checks of this exercise
// put each seeded defect back into this object to see whether one of your tests catches it.
import { expensesReducer } from "./expensesReducer";
import { loadExpenses } from "./api";

export const subject = { expensesReducer, loadExpenses };
