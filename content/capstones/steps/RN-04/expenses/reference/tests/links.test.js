// Tests of src/links.ts: both forms of a deep link lead to the wish, an address without a path is no
// link, and a broken link leads to the not-found screen without an exception.
import { test, expect } from "./testing.js";
import { parseRecordLink } from "../src/links.ts";

test("both forms of a link open the detail screen of the expense", () => {
  expect(parseRecordLink("courselab://expense/e-02"), "the app's own scheme").toEqual({ screen: "Detail", params: { id: "e-02" } });
  expect(parseRecordLink("exp://192.168.1.20:8081/--/expense/e-02"), "Expo Go").toEqual({ screen: "Detail", params: { id: "e-02" } });
  expect(parseRecordLink("exp://192.168.1.20:8081/--/expense/e-02?source=test"), "with a query").toEqual({ screen: "Detail", params: { id: "e-02" } });
});

test("an address without a record path is no link at all", () => {
  expect(parseRecordLink("exp://192.168.1.20:8081"), "Expo Go opening the app").toBe(null);
  expect(parseRecordLink("courselab://"), "the scheme alone").toBe(null);
  expect(parseRecordLink("https://example.com/expense/e-02"), "a web address").toBe(null);
});

test("a broken link leads to the not-found screen and never throws", () => {
  expect(parseRecordLink("courselab://expense/"), "no id").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://wish/w-03"), "another kind of record").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://expense/%E0%A4%A"), "a broken escape").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://expense/e-02/edit"), "a longer path").toEqual({ screen: "NotFound" });
});
