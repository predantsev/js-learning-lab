// Tests of src/draft.ts: the form's text goes through the shared rules, and every error key has its
// message. No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { checkDraft, draftOf, messageFor } from "../src/draft.ts";

test("draftOf gives empty fields for a new wish and text for a saved one", () => {
  expect(draftOf(null), "a new wish").toEqual({ name: "", price: "", category: "" });
  expect(draftOf({ id: "w-05", name: "%%fixture5Name%%", price: null, acquired: false, category: null }), "no price, no category").toEqual({ name: "%%fixture5Name%%", price: "", category: "" });
  expect(draftOf({ id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" }).price, "price 80").toBe("80");
});

test("checkDraft treats an empty price as no price and keeps a valid wish", () => {
  expect(checkDraft({ name: " %%newName%% ", price: "", category: "" }), "empty price").toEqual({ ok: true, value: { name: "%%newName%%", price: null } });
  expect(checkDraft({ name: "%%newName%%", price: "30", category: "" }), "price 30").toEqual({ ok: true, value: { name: "%%newName%%", price: 30 } });
});

test("checkDraft gives the error keys of validateItem", () => {
  expect(checkDraft({ name: "  ", price: "abc", category: "" }), "empty name, price abc").toEqual({ ok: false, errors: { name: "required", price: "not-a-number" } });
  expect(checkDraft({ name: "%%newName%%", price: "-1", category: "" }), "price -1").toEqual({ ok: false, errors: { price: "negative" } });
  expect(checkDraft({ name: "%%newName%%", price: "12.5", category: "" }), "price 12.5").toEqual({ ok: false, errors: { price: "not-whole" } });
});

test("messageFor has a text for every error key and none without a key", () => {
  for (const key of ["required", "too-long", "not-a-number", "negative", "not-whole"]) {
    expect(messageFor(key) !== "", "a message for " + key).toBe(true);
  }
  expect(messageFor(undefined), "no key").toBe("");
});
