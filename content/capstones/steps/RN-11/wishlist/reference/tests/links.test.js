// Tests of src/links.ts: both forms of a deep link lead to the wish, an address without a path is no
// link, and a broken link leads to the not-found screen without an exception.
import { test, expect } from "./testing.js";
import { parseRecordLink } from "../src/links.ts";

test("both forms of a link open the detail screen of the wish", () => {
  expect(parseRecordLink("courselab://wish/w-03"), "the app's own scheme").toEqual({ screen: "Detail", params: { id: "w-03" } });
  expect(parseRecordLink("exp://192.168.1.20:8081/--/wish/w-03"), "Expo Go").toEqual({ screen: "Detail", params: { id: "w-03" } });
  expect(parseRecordLink("exp://192.168.1.20:8081/--/wish/w-03?source=test"), "with a query").toEqual({ screen: "Detail", params: { id: "w-03" } });
});

test("an address without a record path is no link at all", () => {
  expect(parseRecordLink("exp://192.168.1.20:8081"), "Expo Go opening the app").toBe(null);
  expect(parseRecordLink("courselab://"), "the scheme alone").toBe(null);
  expect(parseRecordLink("https://example.com/wish/w-03"), "a web address").toBe(null);
});

test("a broken link leads to the not-found screen and never throws", () => {
  expect(parseRecordLink("courselab://wish/"), "no id").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://task/t-02"), "another kind of record").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://wish/%E0%A4%A"), "a broken escape").toEqual({ screen: "NotFound" });
  expect(parseRecordLink("courselab://wish/w-03/edit"), "a longer path").toEqual({ screen: "NotFound" });
});
