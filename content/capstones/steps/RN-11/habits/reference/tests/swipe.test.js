// Tests of the swipe rule (src/swipe.ts), of the undo through the repository (src/repository.ts) and of
// the synthetic records used for measuring (data/synthetic.js through the contract).
import { test, expect } from "./testing.js";
import { isSwipe } from "../src/swipe.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { parseHabitList } from "../data/model.ts";
import { makeSyntheticHabits } from "../data/synthetic.js";

test("a swipe is to the left and either far enough or fast enough", () => {
  expect(isSwipe({ translationX: -130, velocityX: -50 }), "130 points to the left").toBe(true);
  expect(isSwipe({ translationX: -40, velocityX: -900 }), "short but fast").toBe(true);
  expect(isSwipe({ translationX: -100, velocityX: -300 }), "short and slow").toBe(false);
  expect(isSwipe({ translationX: 150, velocityX: 900 }), "to the right").toBe(false);
  expect(isSwipe({ translationX: 5, velocityX: -900 }), "fast to the left but moved right").toBe(false);
});

test("undo saves the list as it was before the swipe", async () => {
  const storage = createMemoryStorage();
  const repository = createRepository(storage, [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] }]);
  const before = (await repository.readAll()).records;
  const after = await repository.apply({ type: "completionAdded", id: "h-01", day: "2026-03-02" });
  expect(after[0].completions, "today added after the swipe").toEqual(["2026-03-01", "2026-03-02"]);
  await repository.restore(before);
  expect((await createRepository(storage, []).readAll()).records, "after the undo, read anew").toEqual(before);
});

test("the synthetic records for measuring pass the contract, the same on every run", () => {
  const parsed = parseHabitList(makeSyntheticHabits(500, 365));
  expect(parsed.ok, "the contract").toBe(true);
  expect(parsed.ok && parsed.value.length, "records").toBe(500);
  expect(JSON.stringify(makeSyntheticHabits(500, 365)) === JSON.stringify(makeSyntheticHabits(500, 365)), "two runs").toBe(true);
});
