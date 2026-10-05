// Tests of the swipe rule (src/swipe.ts), of the undo through the repository (src/repository.ts) and of
// the synthetic records used for measuring (data/synthetic.js through the contract).
import { test, expect } from "./testing.js";
import { isSwipe } from "../src/swipe.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { parseExpenseList } from "../data/model.ts";
import { makeSyntheticExpenses } from "../data/synthetic.js";

test("a swipe is to the left and either far enough or fast enough", () => {
  expect(isSwipe({ translationX: -130, velocityX: -50 }), "130 points to the left").toBe(true);
  expect(isSwipe({ translationX: -40, velocityX: -900 }), "short but fast").toBe(true);
  expect(isSwipe({ translationX: -100, velocityX: -300 }), "short and slow").toBe(false);
  expect(isSwipe({ translationX: 150, velocityX: 900 }), "to the right").toBe(false);
  expect(isSwipe({ translationX: 5, velocityX: -900 }), "fast to the left but moved right").toBe(false);
  expect(isSwipe({ translationX: -40, velocityX: 900 }), "moved left, but the fling is to the right").toBe(false);
  expect(isSwipe({ translationX: -120, velocityX: 0 }), "exactly 120 points to the left").toBe(true);
});

test("undo saves the list as it was before the swipe", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, [{ id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" }]);
  const before = (await repository.readAll()).records;
  const after = await repository.apply({ type: "removed", id: "e-01" });
  expect(after.length, "removed by the swipe").toBe(0);
  await repository.restore(before);
  expect((await createRepository(storage, []).readAll()).records, "after the undo, read anew").toEqual(before);
});

test("the synthetic records for measuring pass the contract, the same on every run", () => {
  const parsed = parseExpenseList(makeSyntheticExpenses(1000));
  expect(parsed.ok, "the contract").toBe(true);
  expect(parsed.ok && parsed.value.length, "records").toBe(1000);
  expect(JSON.stringify(makeSyntheticExpenses(1000)) === JSON.stringify(makeSyntheticExpenses(1000)), "two runs").toBe(true);
});
