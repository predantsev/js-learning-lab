import { test, expect } from "./testing.js";
import { settings } from "./fakeServer.js";

// Checks the server directly instead of the screen.
test("%%testAdd%%", async () => {
  const response = await fetch("/api/expenses", { method: "POST", body: JSON.stringify({ label: "%%lunch%%", amountMinor: 21050 }) });
  expect(response.status, "%%mStatus%%").toBe(201);
});

test("%%testFail%%", async () => {
  settings.failNext = 1;
  const response = await fetch("/api/expenses", { method: "POST", body: JSON.stringify({ label: "%%lunch%%", amountMinor: 21050 }) });
  expect(response.status, "%%mStatus%%").toBe(503);
});
