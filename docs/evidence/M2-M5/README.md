# M2–M5 evidence index (2026-10-05)

Milestones M2 (JavaScript, issue #8), M3 (React, #9), M4 (React Native, #10) and M5 (Node.js, #11): all 56 units and 528 lessons of the course, with capstone steps for all four stages. This file records the verification commands that were actually run and their last lines. Read the "not covered" section before treating anything as proven. Platform evidence from M1 stays in [evidence/M1](../M1/README.md).

Measured environment: macOS 26 (arm64), Google Chrome 154 (headless through playwright-core), Node.js 25.2.1 as the executor. Some Node.js units and capstone steps were also run on official Node.js 22.13.1 and 22.23.3 binaries (see [STATUS.md](../../STATUS.md)). No other operating system or browser was run.

## Whole-corpus suites, commit d5d0636a (2026-10-05)

| Command | Last line |
|---|---|
| `node scripts/content/validate.mjs` | `CONTENT VALID: 528 lesson(s), 570 example run(s), 4664 exercise fixture run(s), 483 verified prediction(s), 2193 isolated-node run(s), 200 capstone step variant(s) with 240 capstone run(s), 0 error(s), 8 warning(s)` (69 minutes) |
| `node scripts/content/smoke.mjs` | `SMOKE OK: 528 lesson(s), 2768 page view(s), 0 problem(s)` |
| `npm run test:e2e` | `ℹ tests 146` · `ℹ pass 146` · `ℹ fail 0` |
| `npm test` | `ℹ tests 182` · `ℹ pass 182` · `ℹ fail 0` |
| `npx tsc --noEmit -p app/tsconfig.json` | exit 0, no output |

Seven content follow-up commits landed after d5d0636a (up to d9caec8a). For those, `node scripts/content/validate.mjs --since d5d0636a` reported 0 errors, `smoke.mjs` for units NO-01…NO-07 and NO-11…NO-14 reported `SMOKE OK`, and the end-to-end project tests passed 17 of 17. The full validator, full smoke and full end-to-end suite were not rerun on d9caec8a.

## Rerun on 2026-10-05 after the documentation update (content unchanged since d9caec8a)

| Command | Last line |
|---|---|
| `node scripts/build.mjs` | `content: 528/528 lessons, 1001 glossary terms, version 4594403455aa, 0 issue(s), 8 warning(s)` |
| `npx tsc --noEmit -p app/tsconfig.json` | exit 0, no output |
| `npm test` | `ℹ tests 182` · `ℹ pass 182` · `ℹ fail 0` |
| `node scripts/content/validate-syllabus.mjs` | `OK: 528 lessons in 56 unit file(s), no errors.` |
| `node scripts/content/validate.mjs --static` | `CONTENT VALID: 528 lesson(s), 0 example run(s), 0 exercise fixture run(s), 0 verified prediction(s), 0 isolated-node run(s), 200 capstone step variant(s) with 0 capstone run(s), 0 error(s), 8 warning(s)` |
| `python3 scripts/validate_competencies.py` | `SPECIFICATION PASS: {"competencies": 60, "units": 56, "requirements": 38, "cases": 19}` |
| `python3 scripts/validate_competencies.py --release` | `RELEASE NOT READY: 120 issue(s)` — expected: no family is verified and no evidence paths are recorded until the V-18 review |

The eight build and validator warnings are heuristic checks that were inspected and kept on purpose (for example long diagrams and literal `<…>` texts that are intended).

## What the content validator executes

For every lesson: every example, every exercise fixture (starter, solution, alternative and deliberately wrong solutions), every verified prediction in a real browser, and every isolated Node.js run. For every capstone step: all four capstone variants against their tests. The smoke test opens every lesson page in both languages and checks that it renders without page errors.

## Verification cases after M2–M5

| Case | Status | Where |
|---|---|---|
| V-01 inventory and navigation | Covered by the validators for all 528 lessons in both languages; no human read-through of the whole course. | validators above |
| V-04 teaching loop | Every unit was reviewed and corrected by a reviewer who had not written it; recurring defects became the rules of the [authoring guide](../../../content/README.md). | — |
| V-05 four capstones | Steps exist for all four capstones in all four stages and run in the validator; the steps were not independently reviewed. | validators above |
| V-06 export and local continuation | Export from JS-10 and the local React, React Native and Node.js projects are authored; opening an exported project in VS Code was not performed. | — |
| V-07 native and server | Server: real local Node.js server steps NO-03…NO-13. Native: **not performed** — no device or emulator run anywhere. | DECISIONS.md DEC-05 |
| V-08 language | Both languages are complete and validated; no human or native-speaker linguistic review. | smoke above |
| V-13 clean clone | Not rerun after M1. | — |
| V-14 offline | Not performed. | — |
| V-16, V-18, V-19 release gates | Not performed; tracked by issue #12. `--release` reports not ready. | — |

## Not covered / unverified

- Native device or emulator runs (every native task is recorded as not performed).
- Windows and Linux variants of local tasks and lab commands; browsers other than Chrome.
- Node.js 22 behaviour in units where it was not run: taken from the Node.js 22 documentation.
- Human, teacher or native-speaker review of the lessons; independent review of the capstone steps.
- The whole-corpus validator, smoke and end-to-end suites on the final commit d9caec8a (see above).
