import { test, expect } from "./testing.js";
import { createLocker } from "./domain/locker.ts";
import { FIXTURES } from "./fixtures.js";

// Characterization tests of the locker: they pin today's behavior.
function filled() {
  const locker = createLocker();
  for (const parcel of FIXTURES) locker.arrive(parcel);
  return locker;
}

test("%%tFind%%", () => {
  expect(filled().findByCode("P-1003")?.recipient, "%%mFind%%").toBe("%%r3%%");
  expect(filled().findByCode("P-9999"), "%%mMissing%%").toBe(null);
});

test("%%tPickUp%%", () => {
  const locker = filled();
  expect(locker.pickUp("P-1002")?.code, "%%mPickUp%%").toBe("P-1002");
  expect(locker.findByCode("P-1002"), "%%mAfter%%").toBe(null);
  expect(locker.waitingCount(), "%%mCount%%").toBe(3);
});

test("%%tReturn%%", () => {
  const locker = filled();
  locker.pickUp("P-1001");
  expect(locker.nextToReturn()?.code, "%%mReturn%%").toBe("P-1002");
  expect(locker.oldest(10).map((parcel) => parcel.code), "%%mOldest%%").toEqual(["P-1003", "P-1004"]);
});

test("%%tDuplicate%%", () => {
  const locker = filled();
  expect(() => locker.arrive({ code: "P-1004", recipient: "%%r1%%" }), "%%mDuplicate%%").toThrow(Error);
  expect(locker.waitingCount(), "%%mCount%%").toBe(4);
});
