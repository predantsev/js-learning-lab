import { test, expect } from "./testing.js";
import { loadExpenses } from "./expenses-api.js";

// What this test does NOT prove: that the real server ever answers 500 like this,
// that the address is right, or what the page shows to the user in the error state.
test("%%solutionTest%%", async () => {
  const fakeFetch = async () => ({ ok: false, status: 500, json: async () => ({ error: "server error" }) });
  const result = loadExpenses(fakeFetch);
  expect(result, "%%mError%%").toEqual({ state: "error", status: 500 });
});
