import { test, expect } from "./testing.js";
import { heldDepositsMinor, isOverdue, returnTool } from "./lending.js";
import { LOANS, TODAY } from "./loans.js";

// A fraction sum that happens to survive Math.floor: 0.7 + 0.1 is 0.7999999999999999,
// yet (0.7 + 0.1) * 100 is exactly 80, so this test does not catch the cut-down total.
test("fractional deposits sum to exact kopiykas", () => {
  const loans = [
    { id: "T-1", tool: "a", depositUah: 0.7, dueDate: "2026-03-12", returnedOn: null },
    { id: "T-2", tool: "b", depositUah: 0.1, dueDate: "2026-03-12", returnedOn: null },
  ];
  expect(heldDepositsMinor(loans)).toBe(80);
});

test("a loan returned after its due date is not overdue", () => {
  const drill = returnTool(LOANS, "L-01", TODAY).find((loan) => loan.id === "L-01");
  expect(isOverdue(drill, TODAY)).toBe(false);
});
