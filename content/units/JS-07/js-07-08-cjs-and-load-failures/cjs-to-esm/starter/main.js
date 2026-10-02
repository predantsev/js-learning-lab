// This file is already an ES module: it imports two names from records.js.
import { validate, summarize } from "./records.js";

const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-09", label: "%%gift%%", amountMinor: 1500, date: "2026-03-02", category: "gifts" },
];

const valid = expenses.filter((expense) => validate(expense).ok);
const summary = summarize(valid);
console.log("%%countText%%" + summary.count + " · %%totalText%%" + summary.totalText + " %%uah%%");
