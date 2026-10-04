// Tests of the page address in ui/address.js: the view of the list goes into the query of the
// address and comes back unchanged, and an unknown filter from the address is not trusted.
import { test, expect } from "./testing.js";
import { readView, viewAddress } from "../ui/address.js";

const FILTERS = ["food", "transport", "home", "fun"];
const BASE = "http://example.localhost/index.html?id=7";

test("a search with &, # and spaces comes back unchanged from the address", () => {
  const view = { query: "%%homeAndGardenQuery%% #1", filter: "food" };
  const address = new URL(viewAddress(BASE, view));
  expect(readView(address.search, FILTERS), "the view read back").toEqual(view);
  expect(address.searchParams.get("id"), "the other parameter").toBe("7");
});

test("an empty search and the filter all leave the address clean", () => {
  expect(viewAddress(BASE, { query: "", filter: "all" }), "the address").toBe(BASE);
});

test("readView does not trust an unknown filter", () => {
  expect(readView("?show=%3Cimg%3E", FILTERS), "an unknown filter").toEqual({ query: "", filter: "all" });
  expect(readView("", FILTERS), "no query at all").toEqual({ query: "", filter: "all" });
});
