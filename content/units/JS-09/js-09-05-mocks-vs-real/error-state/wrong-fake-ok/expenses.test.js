import { test, expect } from "./testing.js";
import { loadExpenses } from "./expenses-api.js";

test("%%solutionTest%%", async () => {
  const fakeFetch = async () => ({ ok: true, status: 200, json: async () => ({ items: [] }) });
  const result = await loadExpenses(fakeFetch);
  expect(result, "%%mError%%").toEqual({ state: "ready", expenses: [] });
});
