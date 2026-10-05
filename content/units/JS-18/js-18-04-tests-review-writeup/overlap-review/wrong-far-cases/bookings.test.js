import { test, expect } from "./testing.js";
import { createBookingService, memoryStore } from "./service.js";

// Your tests. `rules` is the rules module being tested — { overlaps, canBook } — either the
// version on main or the one in the pull request. Start every test name with its kind:
// "unit: …", "integration: …" or "mocked: …".
export function bookingTests(rules) {
  // A fresh booking for every test: 10 June in, 13 June out.
  const stay = () => ({ id: "b-1", room: "A", start: "2026-06-10", end: "2026-06-13" });

  test("unit: a stay inside a booking overlaps", () => {
    expect(rules.canBook([stay()], { room: "A", start: "2026-06-11", end: "2026-06-12" })).toBe(false);
  });

  test("unit: a stay a week later is free", () => {
    expect(rules.canBook([stay()], { room: "A", start: "2026-06-20", end: "2026-06-22" })).toBe(true);
  });

  test("unit: arriving on the checkout day is allowed, the day before is not", () => {
    expect(rules.canBook([stay()], { room: "A", start: "2026-06-13", end: "2026-06-15" })).toBe(true);
    expect(rules.canBook([stay()], { room: "A", start: "2026-06-12", end: "2026-06-15" })).toBe(false);
  });

  test("unit: another room never overlaps", () => {
    expect(rules.canBook([stay()], { room: "B", start: "2026-06-08", end: "2026-06-11" })).toBe(true);
  });

  test("integration: the service refuses an overlapping stay and saves nothing", () => {
    const store = memoryStore([stay()]);
    const service = createBookingService(store, rules);
    expect(service.book({ room: "A", start: "2026-06-09", end: "2026-06-14" }).ok).toBe(false);
    expect(store.load().length).toBe(1);
  });

  test("mocked: the service saves the booking when the rules allow it", () => {
    const store = memoryStore([stay()]);
    const service = createBookingService(store, { canBook: () => true });
    expect(service.book({ room: "A", start: "2026-06-09", end: "2026-06-14" }).ok).toBe(true);
    expect(store.load().length).toBe(2);
  });
}
