import { test, expect } from "./testing.js";
import { heldDepositsMinor, isOverdue, returnTool } from "./lending.js";
import { LOANS, TODAY } from "./loans.js";

// Tests far from the boundary: round deposits and a loan returned before its due date.
test("deposits are summed in kopiykas", () => {
  const loans = [
    { id: "T-1", tool: "a", depositUah: 100, dueDate: "2026-03-12", returnedOn: null },
    { id: "T-2", tool: "b", depositUah: 50, dueDate: "2026-03-12", returnedOn: null },
  ];
  expect(heldDepositsMinor(loans)).toBe(15000);
});

test("a returned loan is not overdue", () => {
  const loan = { id: "T-3", tool: "c", depositUah: 10, dueDate: "2026-03-12", returnedOn: "2026-03-09" };
  expect(isOverdue(loan, TODAY)).toBe(false);
});
