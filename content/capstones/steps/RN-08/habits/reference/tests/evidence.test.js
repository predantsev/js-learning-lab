// Tests of the CP-RN records (evidence/records.js) with the course's rules (evidence/evidence.js): every
// check has a record, and every record is accepted as what it is — here, an honest skip.
import { test, expect } from "./testing.js";
import { CHECKS, judge } from "../evidence/evidence.js";
import { build, declaredTarget } from "../evidence/build.js";
import { records } from "../evidence/records.js";

test("every one of the six checks has a record on the declared target", () => {
  const checked = records.filter((record) => record.target === declaredTarget).map((record) => record.check);
  expect([...new Set(checked)].sort(), "checks").toEqual([...CHECKS].sort());
});

test("no record is rejected, and no skip claims a result", () => {
  for (const record of records) {
    // A real result is "passed", "assisted" or "failed", a skip "skipped": only "rejected" breaks the rubric.
    const verdict = judge(record, { declaredTarget: declaredTarget, build: build });
    expect(verdict.status === "rejected", record.check + " on " + record.target.kind + ": " + (verdict.reason ?? verdict.status)).toBe(false);
  }
});
