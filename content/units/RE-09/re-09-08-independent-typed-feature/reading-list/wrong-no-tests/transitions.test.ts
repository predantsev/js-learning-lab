import { test, expect } from "./testing";
import { subject } from "./subject";

test("loading + loaded → ready", () => {
  const next = subject.readingReducer({ status: "loading" }, { type: "loaded", books: [] });
  expect(next.status).toBe("ready");
});
