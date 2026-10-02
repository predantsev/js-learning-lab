import { test, expect } from "./testing.js";
import { heldDepositsMinor, isOverdue, returnTool } from "./lending.js";
import { LOANS, TODAY } from "./loans.js";

// Your tests go here: one for each defect you repair, on the boundary where it appears.

test("a loan returned after its due date is not overdue", () => {
  const loans = returnTool(LOANS, "L-01", TODAY);
  const drill = loans.find((loan) => loan.id === "L-01");
  expect(isOverdue(drill, TODAY)).toBe(false);
});

test("a loan due today is not overdue, one due yesterday is", () => {
  const loan = { id: "T-3", tool: "c", depositUah: 10, dueDate: "2026-03-10", returnedOn: null };
  expect(isOverdue(loan, "2026-03-10")).toBe(false);
  expect(isOverdue(loan, "2026-03-11")).toBe(true);
});
