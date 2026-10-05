// Tests of the swipe rule (src/swipe.ts), of the undo through the repository (src/repository.ts) and of
// the synthetic records used for measuring (data/synthetic.js through the contract).
import { test, expect } from "./testing.js";
import { isSwipe } from "../src/swipe.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { parseItemList } from "../data/model.ts";
import { makeSyntheticWishes } from "../data/synthetic.js";

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
  const repository = createRepository(storage, [{ id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: null }]);
  const before = (await repository.readAll()).records;
  const after = await repository.apply({ type: "acquiredToggled", id: "w-01" });
  expect(after[0].acquired, "acquired after the swipe").toBe(true);
  await repository.restore(before);
  expect((await createRepository(storage, []).readAll()).records, "after the undo, read anew").toEqual(before);
});

test("the synthetic records for measuring pass the contract, the same on every run", () => {
  const parsed = parseItemList(makeSyntheticWishes(1000));
  expect(parsed.ok, "the contract").toBe(true);
  expect(parsed.ok && parsed.value.length, "records").toBe(1000);
  expect(JSON.stringify(makeSyntheticWishes(1000)) === JSON.stringify(makeSyntheticWishes(1000)), "two runs").toBe(true);
});
