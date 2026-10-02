import { test, expect } from "./testing.js";
import { loadExpenses } from "./expenses-api.js";

test("%%solutionTest%%", async () => {
  const fakeFetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const result = await loadExpenses(fakeFetch);
  expect(result.state, "%%mState%%").toBe("error");
});
