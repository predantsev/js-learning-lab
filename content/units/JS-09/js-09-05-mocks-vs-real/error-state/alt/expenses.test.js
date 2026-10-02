import { test, expect } from "./testing.js";
import { loadExpenses } from "./expenses-api.js";

// Not proven here: the real server's answers and the real address. Only how loadExpenses treats a 500.
test("%%solutionTest%%", async () => {
  const fakeFetch = () => Promise.resolve(new Response("oops", { status: 500 }));
  const result = await loadExpenses(fakeFetch);
  expect(result.state, "%%mState%%").toBe("error");
  expect(result.status, "%%mStatus%%").toBe(500);
});
