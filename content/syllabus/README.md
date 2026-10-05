# Lesson-level syllabus spine

This folder holds the lesson-level syllabus for the whole course: one YAML file per curriculum unit
(`JS-01.yaml` … `NO-14.yaml`, 56 files), validated by `scripts/content/validate-syllabus.mjs`. It is the
single source of truth for *which lesson teaches what, in which order, with which practice*. Lesson
authors expand each lesson into full bilingual content (explanations, exercises, fixtures, visuals);
this folder deliberately contains no lesson bodies, exercises or code.

Normative inputs: `docs/CURRICULUM.md` (units, stage policy, capstone mapping), `docs/COMPETENCY-MATRIX.md`
and its machine-readable twin `docs/competencies.json` (families, exact subskill strings, depth, unit
mapping, teaching order), `docs/CONTENT-DATA.md` (content contract), `docs/REQUIREMENTS.md`
(REQ-001–008, 013/014, 036–038) and `content/capstones/domains.yaml` (capstone domains). Markdown and
the competency inventory stay canonical; when they change, the syllabus must be re-validated.

## How to validate

```
node scripts/content/validate-syllabus.mjs                 # full run: all 56 units, closure, exit 1 on error
node scripts/content/validate-syllabus.mjs --partial       # only the unit files present (author workflow)
node scripts/content/validate-syllabus.mjs --partial --only=JS-05,JS-06
node scripts/content/validate-syllabus.mjs --quiet         # errors only
```

The summary it prints (lessons per unit, totals per stage, glossary count, subskill closure, difficult-
concept coverage) is the evidence block for status reports; do not quote counts from anywhere else.

## Teaching order

Stable ids are identity, not sequence. The validator takes the order from `unit_order` in
`docs/competencies.json`:

- JavaScript: JS-01 … JS-09 → JS-15 (local workflow) → JS-10 (CP-JS export) → JS-11 … JS-14 → JS-16 → JS-17 → JS-18 (gate)
- React: RE-01 … RE-07 → RE-09 → RE-10 → RE-11 → RE-08 (CP-RE) → RE-12 (gate)
- React Native: RN-01 … RN-06 → RN-09 → RN-10 → RN-07 → RN-11 → RN-08 (CP-RN) → RN-12 (gate)
- Node.js: NO-01 … NO-04 → NO-09 (SQL lab) → NO-05 → NO-10 (auth lab) → NO-07 → NO-11 → NO-06 → NO-12 → NO-13 → NO-08 (CP-NO) → NO-14 (gate)

Global lesson order = unit teaching order × lesson order inside the unit. Every `prerequisites` and
`retrieval.from` reference must point strictly earlier in that order.

## Schema (one file per unit)

```yaml
unit: JS-05
stage: JS                        # JS | RE | RN | NO (must match the unit prefix)
title: { uk: "…", en: "…" }
summary: { uk: "…", en: "…" }    # what the learner can DO after the unit, 1–2 sentences
competencies: [J-05]             # exactly the families mapped to this unit in competencies.json
capstoneStep:                    # or `capstoneStep: null` plus capstoneStepReason: { uk, en }
  mode: in-platform              # in-platform (JS-01…JS-09) | local (JS-15 onward: VS Code project)
  objective: { uk: "…", en: "…" }
  variants:                      # one concrete sentence per domain, same learning objective
    wishlist: { uk: "…", en: "…" }
    planner:  { uk: "…", en: "…" }
    habits:   { uk: "…", en: "…" }
    expenses: { uk: "…", en: "…" }
lessons:
  - id: js-05-01-map             # <unit lowercase>-<2-digit position>-<kebab slug>; stable, unique
    title: { uk: "…", en: "…" }
    kind: instructional          # instructional | review | assessment | local-task | capstone-step
    minutes: 10                  # instructional 5–15; review ≤45; local-task ≤60; assessment ≤90; capstone-step ≤120
    objectives: ["…"]            # English, observable verbs
    subskills:                   # exact strings from competencies.json; family must be mapped to the unit
      - { family: J-05, skill: "map/filter/find/some/every/reduce", depth: intro }   # intro | practice | assess
    misconceptions: ["…"]        # English; instructional lessons: 1–3 wrong mental models to dislodge
    prerequisites: [js-04-10-immutable-updates]   # direct prerequisites only, earlier in teaching order
    glossary: [array-method]     # kebab-case English term ids FIRST introduced here (unique course-wide)
    visual: { kind: pipeline, concept: "…" }      # or null; kind from the list below
    analogy: "… (limit: …)"      # or null; must state its limitation
    difficultConcept: scope-closure               # optional tag, see "Difficult concepts"
    practice:
      - { kind: predict, runtime: browser-js, summary: "…" }
    retrieval:                   # earlier concepts revisited without giving the answer up front
      - { concept: "…", from: js-04-07-reference-identity }
```

Enumerations (enforced):

- Lesson kinds: `instructional`, `review`, `assessment`, `local-task`, `capstone-step`.
- Depths: `intro`, `practice`, `assess`.
- Runtime kinds: `browser-js`, `browser-react`, `concept-preview`, `isolated-node`, `local-web`,
  `local-native`, `local-node`.
- Visual kinds: `code-trace`, `memory-graph`, `pipeline`, `event-loop`, `diagram`, `sequence`,
  `git-graph`, `render-timeline`.
- Practice kinds: `predict`, `run-change`, `write`, `debug`, `independent`, `local-task`, `review`.
- Difficult concepts: `scope-closure`, `reference-identity`, `event-loop-async`, `render-state-snapshot`,
  `effect-cleanup`, `client-server-boundary`, `native-web-boundary`.

Two fields extend the brief's schema and are documented here on purpose: `difficultConcept` (so the
validator can prove every mandatory difficult concept has a controllable visual *and* a bounded analogy)
and a bilingual `capstoneStepReason` (learner-facing: the learner sees why a unit has no project step).

## Rules the validator enforces

1. All 56 unit files exist, parse, match `unit_order`, and `competencies` equals the families mapped to the unit.
2. Lesson ids follow the pattern, are unique, and their two-digit position matches their order in the file.
3. `prerequisites` and `retrieval.from` resolve to earlier lessons; every lesson after the very first has a prerequisite.
4. Every bilingual field has non-empty `uk` and `en`; no `TODO`/`TBD`/`FIXME` anywhere.
5. Subskill closure: every exact subskill string of every family is introduced (`intro`/`practice`) and assessed
   (`assess`) inside the family's mapped units, and the first introduction precedes the first assessment in global
   order. Unknown family ids, unknown strings and unmapped families are errors.
6. A lesson that assesses a subskill carries an `independent` or `debug` practice entry (assessment happens in
   independent/debug work, never in a worked example).
7. `intro_same_unit_foundations` from `competencies.json` is enforced at lesson level (for example J-01 before W-01
   in JS-01, W-02 before W-03 in JS-06, J-11 before W-04 in JS-08, B-06 before B-07 in NO-10).
8. Per unit: at least one `predict`, `write`, `debug` and `independent` practice entry; from the second unit of the
   course on, at least two retrieval entries from earlier units, reaching two different earlier units when two exist.
9. Instructional lessons: 5–15 minutes, ≥1 objective, ≥1 misconception, and the full loop `predict` → `run-change`
   → focused practice (`write`/`debug`/`independent`/`local-task`); the capstone transfer is declared at unit level.
10. Difficult-concept lessons have both a visual and an analogy; every analogy states a limitation as `(limit: …)`;
    each of the seven mandatory difficult concepts appears at least once.
11. Runtime honesty per stage — one table for both validators, `STAGE_RUNTIMES` in `shared/content-schema.js`
    (content/README.md, "Runtimes per stage"): JS units `browser-js`, `local-web`, `concept-preview`; RE units
    `browser-react`, `browser-js`, `local-web`, `concept-preview`; RN units `concept-preview` for in-course UI,
    `browser-js` for pure shared code, `local-native` (at least one task per unit), `local-web`, and `isolated-node` /
    `local-node` for computer-side Node.js work such as the mock service of rn-06-01 — never native evidence; NO units
    every runtime, with at least one `isolated-node` or `local-node` entry per unit, `browser-react` for the client
    side and `local-native` only for the optional native-companion checks in NO-06.
    `browser-react` is not allowed in RN units: a React Native preview is never native verification.
13. A `capstone-step` lesson in a `mode: local` unit carries a `local-*` practice entry; in an `in-platform` unit it
    carries a `browser-*` entry; a unit with `capstoneStep: null` has no capstone-step lesson.
12. Glossary term ids are kebab-case and unique across the course.

## Design rationale

### Difficulty ramp

- **JS-01/JS-02 assume nothing.** One idea per lesson (8–12 minutes): run/change/see, numbers and text,
  precedence, booleans/null/undefined, reading an error, then elements/attributes, links/buttons/images/tables and
  CSS selectors — the contextual HTML/CSS entry required by REQ-002, with no outside prerequisite. The first
  debug exercise (JS-01) repairs a typo from the error message alone; the first independent task is a labeled page.
- **JS-03 → JS-05** build the function/data core with the two heaviest early visuals (closure memory graph, reference
  identity graph) before any DOM work. A counting `for`/`while` lesson sits in JS-02 (J-03 is mapped there) so that
  higher-order functions and recursion in JS-03 follow basic loop traversal, as the J-04 `intro_bridge` requires;
  loop depth (for-of/for-in, break/continue, nesting, termination) lives in JS-04 so that array methods in JS-05
  replace loops the learner has already written by hand.
- **JS-06** is the largest unit (16 lessons): the HTML/CSS bridge (forms, focus, cascade, box model, Flex/Grid,
  responsive/zoom/reduced motion) is taught *before* DOM/events so that no DOM lesson leans on unknown markup.
- **JS-07 → JS-09** add modules/errors/persistence, the event loop and tests; **JS-15 → JS-10** move the same project
  to VS Code (CP-JS). From JS-11 on, the capstone step is a `local` task with reference checkpoints and in-course
  practice stays `browser-js`.
- **JS-11 → JS-17** are the professional-depth units (object model, data semantics, resources, TypeScript, web
  boundary, algorithms/quality); **JS-18** is the cumulative gate.
- React, React Native and Node repeat the shape: concept units → depth units → checkpoint → gate, with lesson
  counts between 5 (checkpoints/gates) and 16.

Lesson counts are a consequence of subskill placement, not a target: the spine has 528 lessons because 383
subskills each need an introduction, practice and an independent/debug assessment at honest depth.

### Subskill placement

Every subskill string is placed exactly once at depth `intro` (the lesson that teaches it), optionally at
`practice`, and at least once at `assess` inside a debug or independent lesson of a mapped unit. Multi-unit families
introduce basics early and assess depth later, following `intro_bridge` in the inventory. The notable splits:

| Family | Introduced in | Assessed in | Note |
|---|---|---|---|
| J-01 | JS-01 (values, typeof, precedence) · JS-02 (equality, nullish, rare operators, Symbol/BigInt) | JS-02 | |
| J-02 | JS-02 | JS-02 (var/TDZ/shadowing) · JS-03 (const/let, scope) | closure lesson closes scope |
| J-03 | JS-02 (if/else/switch, counting for/while) · JS-04 (loop depth) | JS-02 · JS-04 | basic loops precede JS-03 higher-order/recursion |
| J-04 | JS-03 (1–6) · JS-11 (this, call/apply/bind) | JS-03 · JS-11 | |
| J-10 | JS-07 (all eight) | JS-07 · JS-13 (cleanup, module cycles) | |
| W-01 | JS-01 (structure, links/buttons, images/tables) · JS-06 (forms, focus, safe semantics) | JS-06 | |
| W-04 | JS-08 (methods/status/JSON/response checks, failures) · JS-16 (URL, cookies/origins, CORS) | JS-08 · JS-16 | |
| W-05 | JS-16 (input/XSS/secrets/privacy) · JS-17 (a11y, DevTools, measured improvement) | JS-16 · JS-17 | |
| P-01 | JS-15 | JS-15 (scripts/lockfile/semver/config) · JS-10 (paths, safe commands, lint, source maps) | export is the real test |
| P-04 | JS-09 · JS-17 (refactor, review) | JS-09 · JS-17 · JS-18 (gate re-assesses all seven) | |
| P-05 | RE-01 (typed props) · RE-04 (typed reducers) · RE-09 (API models, reuse boundaries, error models) | RE-09 | |
| R-03/R-05/R-06 | RE-04 / RE-05 / RE-06 | partly in the home unit, depth in RE-09 | design-test-operate depth |
| R-10 | RE-08 | RE-08 (enhancement, tests, cleanup, routes, explanation) · RE-12 (E2E limits, artifact) | |
| N-01/N-02/N-04 | RN-01/RN-02 · RN-03 (adapters, lists) · RN-10 (performance) | RN-01…RN-03 · RN-10 | |
| N-07 | RN-06 (permission requests, capability checks) · RN-09 (secure storage, secrets, privacy, auth/deep links) | RN-06 · RN-09 | |
| N-10 | RN-07 | RN-07 · RN-12 (E2E/platform coverage) | |
| N-12 | RN-08 | RN-08 · RN-12 | |
| B-03 | NO-03 (lifecycle, methods/status, cancellation) · NO-04 (REST, validation, errors, pagination, idempotency, versions) | NO-03 · NO-04 | |
| B-05 | NO-09 (tradeoffs, migration, init, concurrency) · NO-05 (backup/restore, recovery, schema contract) | NO-09 · NO-05 | |
| B-07 | NO-10 (threat model, rate limits, CORS-is-not-auth) · NO-07 (input/path safety, deps, redaction, safe errors, TLS) | NO-10 · NO-07 | |
| B-09 | NO-07 (real-HTTP tests, mocks, logs) · NO-12 (metrics, profiling, typed contracts) | NO-07 · NO-12 | |
| B-13 | NO-08 · NO-14 (focused labs) | NO-08 · NO-14 | |

Required-awareness families (J-14, R-09, N-09) are introduced in instructional lessons and assessed at
explain-read depth inside independent lessons (explanation and boundary-identification items, not implementation).

### Where the difficult-concept visuals live

| Concept | Lesson | Visual | Bounded analogy (authors localise) |
|---|---|---|---|
| scope/closure | `js-03-05-closures` | memory-graph | backpack of references (limit: references, not copies) |
| reference identity/mutation | `js-04-07-reference-identity` | memory-graph | house address on two notes (limit: primitives are copied) |
| event loop/async | `js-08-01-timers-and-the-event-loop` | event-loop | one cook, an order rail (limit: the browser has helpers for I/O) |
| client/server boundary | `js-16-04-same-origin-cors` and `no-06-01-client-server-boundary` | sequence | reception rules (limit: CORS protects the reader, not the server) / bank branch vs statement (limit: the branch can be down) |
| render/state snapshot | `re-02-02-state-snapshots` | render-timeline | a photo per render (limit: the next photo is taken only on re-render) |
| effect/cleanup | `re-03-03-dependencies-cleanup` | render-timeline | subscribe/unsubscribe before moving (limit: cleanup also runs before every re-run) |
| native/web boundary | `rn-01-01-native-vs-web` | diagram | same script on stage vs filmed (limit: the shared script is the domain code) |

Beyond the mandatory seven, visuals are attached only where they explain a mechanism: call-stack traces for
functions/recursion/errors, memory graphs for copies and collections, pipelines for array methods/streams/SQL
grouping, sequences for HTTP/CORS/auth/hydration/native bridge, git-graphs for Git and migration history,
render-timelines for React scheduling and native screen focus, diagrams for architecture/ownership/state
machines/prototype chains. Roughly 60 % of lessons carry a visual; the rest are deliberately text + code.

### Spiral and retrieval

Every unit from JS-02 on carries at least two retrieval entries from earlier units — one from the previous unit or
two ("recent"), one from several units back ("distant") — attached to the lesson where the old concept is needed
again, phrased as a question to answer before the lesson restates it. Checkpoints (RE-08, RN-08, NO-08) and gates
(JS-18, RE-12, RN-12, NO-14) retrieve across whole stages. The spine's retrieval plan per unit:

| Unit | Retrieves from | Unit | Retrieves from |
|---|---|---|---|
| JS-02 | JS-01 | RE-01 | JS-03, JS-04, JS-06, JS-14 |
| JS-03 | JS-01, JS-02 | RE-02 | JS-03, JS-04, JS-06, RE-01 |
| JS-04 | JS-01, JS-02, JS-03 | RE-03 | JS-03, JS-08, JS-13, RE-02 |
| JS-05 | JS-03, JS-04 | RE-04 | JS-06, JS-14, RE-01, RE-03 |
| JS-06 | JS-01, JS-02, JS-04, JS-05 | RE-05 | JS-06, JS-07, JS-16, RE-04 |
| JS-07 | JS-02, JS-03, JS-04, JS-06 | RE-06 | JS-08, RE-02, RE-03 |
| JS-08 | JS-03, JS-04, JS-07 | RE-07 | JS-04, JS-06, JS-17, RE-01 |
| JS-09 | JS-02, JS-05, JS-07, JS-08 | RE-09 | JS-14, RE-04, RE-05, RE-06 |
| JS-15 | JS-01, JS-07, JS-09 | RE-10 | JS-07, JS-08, RE-02, RE-06 |
| JS-10 | JS-07, JS-09, JS-15 | RE-11 | JS-16, RE-01, RE-03 |
| JS-11 | JS-03, JS-04, JS-06, JS-09 | RE-08 | JS-03, JS-04, JS-09, RE-02, RE-03 |
| JS-12 | JS-02, JS-04, JS-05, JS-09 | RE-12 | JS-10, JS-15, RE-08, RE-09 |
| JS-13 | JS-03, JS-06, JS-07, JS-12 | RN-01 | JS-14, JS-15, RE-01, RE-09 |
| JS-14 | JS-02, JS-04, JS-07, JS-11 | RN-02 | JS-06, RE-07, RN-01 |
| JS-16 | JS-06, JS-07, JS-08 | RN-03 | JS-11, RE-01, RE-02, RN-02 |
| JS-17 | JS-05, JS-06, JS-09, JS-13 | RN-04 | JS-16, RE-03, RE-05, RN-03 |
| JS-18 | JS-02 … JS-17 (10 units) | RN-05 | JS-07, JS-14, RE-03, RN-03 |
| NO-01 | JS-07, JS-08, JS-13, JS-14 | RN-06 | JS-08, JS-16, RE-06, RN-05 |
| NO-02 | JS-07, JS-08, JS-13, NO-01 | RN-09 | JS-16, RN-04, RN-05, RN-06 |
| NO-03 | JS-08, JS-16, NO-02 | RN-10 | JS-06, RE-07, RN-03, RN-04 |
| NO-04 | JS-05, JS-14, RE-09, NO-03 | RN-07 | JS-09, RE-06, RN-01, RN-05 |
| NO-09 | JS-05, JS-12, NO-02, NO-04 | RN-11 | JS-15, RE-12, RN-09 |
| NO-05 | JS-07, RN-05, NO-02, NO-09 | RN-08 | JS-03, JS-05, RE-02, RE-03, RN-05 |
| NO-10 | JS-16, NO-04, NO-09 | RN-12 | JS-13, RE-03, RN-01, RN-04, RN-05, RN-09, RN-11 |
| NO-07 | JS-09, JS-16, NO-02, NO-10 | NO-12 | JS-17, RE-12, NO-05, NO-07 |
| NO-11 | JS-08, JS-13, NO-02 | NO-13 | JS-07, RE-11, NO-03 |
| NO-06 | JS-16, RE-06, RE-09, RN-06 | NO-08 | JS-09, RE-03, RE-08, RN-08, NO-05 |
| | | NO-14 | JS-03, JS-18, RE-02, RE-12, RN-12, NO-09, NO-10, NO-13 |

Recurring threads: closures (JS-03) return in JS-11, JS-13, RE-02/RE-03, RE-08, RN-08, NO-14; reference identity
(JS-04) returns in JS-05, JS-06, JS-12, RE-01, RE-07; the event loop (JS-08) returns in JS-13, RE-06, RE-10, NO-01,
NO-11; origins/CORS (JS-16) return in RE-05, RE-11, RN-04, RN-06, NO-03, NO-06, NO-10; cleanup (JS-13/RE-03)
returns in RN-04, RN-10, RN-12, NO-08.

### Capstone thread

The learner picks one of four domains at CP-START (`content/capstones/domains.yaml`). Every unit either advances
that project or states why not:

- **JavaScript, in-platform (JS-01 → JS-09):** starter page → labels/validation messages → extracted pure
  functions → record CRUD → search/filter/sort/summary → accessible cards + form UI → modules + persistence →
  async fixture loading → tests. **JS-15** prepares the local toolchain and an empty repository; **JS-10** is CP-JS
  (export, run locally, compare, commit). **JS-11 → JS-17, local:** repository adapter, strict data rules, lazy
  paging/teardown, strict TypeScript domain, fixtures over HTTP with safe output, profile/refactor/audit.
  **JS-18:** none (cumulative gate).
- **React, local (RE-01 → RE-12):** typed components → interactive state → persistence effect → typed reducer +
  data hook → routes/states → async data layer → keyboard + measured performance → typed contracts → lazy route +
  transition → client/server boundary annotation on paper (RE-11) → CP-RE enhancement (RE-08) → production build
  and rollback plan (RE-12).
- **React Native, local in `native/` (RN-01 → RN-12):** native subproject → screens → native CRUD → navigation →
  native persistence → native data loading → (RN-09: none — synthetic capability lab) → interaction/motion/
  performance → native tests → release build → CP-RN enhancement (RN-08). **RN-12:** none (gate; the release
  artifact already exists). Every native step runs "on your declared target" and may be skipped with
  unperformed provenance when tooling is absent.
- **Node, local in `server/` (NO-01 → NO-14):** typed script → file persistence → first endpoint → CRUD API →
  (NO-09: none — required SQL lab) → durable storage with schema contract → (NO-10: none — required auth lab) →
  hardened API → streamed export/import → integrated clients (NO-06) → production-mode operation → server-rendered
  list (NO-13) → CP-NO integration (NO-08). **NO-14:** none (final gate).

Capstone-vs-focused-lab is a per-unit decision made here, because the inventory's `transfer` field is identical for
all 60 families ("apply to the chosen capstone where natural; otherwise retain the focused synthetic lab"). The
six `capstoneStep: null` units (JS-18, RN-09, RN-12, NO-09, NO-10, NO-14) each carry a learner-facing bilingual
reason.

### Runtime honesty

- JavaScript practice is real sandboxed browser JavaScript (`browser-js`), including TypeScript files with real
  `tsc` diagnostics from JS-14 on. Terminal, Git, build and VS Code work is `local-web`.
- React practice is real React 19 in the sandbox (`browser-react`); RE-11 uses `concept-preview` for supplied
  hydration traces and makes no browser-SSR claim — the executable SSR lab is NO-13.
- React Native in-course UI is `concept-preview` (react-native-web) and is labeled as such in every summary;
  anything that proves native behavior is a `local-native` task on the learner's declared emulator/device with
  learner-confirmed evidence. Before Node, native networking uses bundled fixtures and the supplied mock service.
- Node in-course practice is planned on `isolated-node` (a real Node child process: `node:http` on loopback,
  `node:fs` in a scratch dir, `node:sqlite`, streams, `node:crypto`). **Planning assumption:** `docs/CONTENT-DATA.md`
  still lists `isolated-node` as a candidate pending its feasibility spike; if the spike fails, the affected practice
  entries become `local-node` tasks without changing the lesson structure. Real server processes and HTTP requests
  from the learner's own machine are `local-node` regardless.

### Other decisions and open points for authors

- The router library for RE-05 is undecided in `docs/CURRICULUM.md`; the lessons describe routes through a minimal
  router abstraction and do not name a library.
- Lesson minutes are instructional estimates excluding independent project work; gates and checkpoints are long by
  design (up to 90–120 minutes) and are not instructional lessons.
- Glossary term ids mark the lesson that first introduces a term; the glossary itself (definitions, aliases) is
  authored separately per `docs/CONTENT-DATA.md`.
- `visual.concept`, `analogy`, `misconceptions`, `objectives` and `practice[].summary` are author briefs in English;
  learner-facing text is bilingual in the authored lesson, not here.
- Stable ids survive edits. To remove a lesson, keep its position number unused only if the file is regenerated;
  otherwise retire the id in the commit message and renumber following lessons deliberately — the validator
  requires contiguous numbering, so a removal is a visible, reviewed change, never a silent reuse.

### Known tensions and assumptions recorded by the expansion pass

These came up while the unit files were expanded and are left for the authors or the specification owners; none
blocks the spine, and the validator cannot check them.

- **Dynamic import before promises.** `js-07-07` introduces `import()` one unit before promises (JS-08); the lesson
  uses it read-only through `.then` and says so. Moving the subskill to JS-13 would be a spec change (J-10 maps to
  JS-07 and JS-13), so it is recorded instead.
- **Render-vs-commit before state.** `re-01-06` needs a re-render trigger; it uses a prepared button whose state code
  is explained in RE-02.
- **Loopback versus a physical device.** AGENTS.md binds services to loopback, but a physical phone cannot reach the
  computer's loopback. RN-06 and NO-06 teach the emulator host alias as the safe route and a non-loopback bind as an
  explicit, temporary exposure decision; the supplied mock service needs a port-reverse or opt-in LAN path. A debug-only
  cleartext exception (Android network security config / iOS ATS) is assumed and must be documented with the tool.
- **Platform capabilities the summaries assume (unconfirmed, no spike evidence yet):** `isolated-node` spawning a
  child process / worker thread (`no-11-06`), running a CI script with pre-installed dependencies (`no-12-05`),
  `--cpu-prof` (`no-12-02`), SIGTERM from the harness (`no-12-06`); `browser-react` loading `react-dom/client` to
  hydrate a server-rendered HTML string (`no-13-02`, `no-13-04`); a sandbox the learner can pause with DevTools
  (`js-09-06`); hover-to-see inferred types, an emitted-JavaScript view and a `strictNullChecks` toggle (JS-14); a
  platform fixture endpoint with seeded 404/500/HTML-fallback responses and recorded Set-Cookie/CORS transcripts
  (JS-16); fixture controls for delay/status/offline (JS-08); an in-course manifest/scripts checker (`js-10-01`);
  `npm ci` on the exported project needing registry access unless dependencies are bundled (`js-10-02`, REQ-023).
- **Runtime labels that stretch.** RN-07 test lessons run the test runner on the host but are labeled `local-native`
  because each includes a device check; `rn-01-07` puts a strict `tsc` run under `local-native` for the same reason.
  P-03 is `local-web` in the inventory while JS-14 practice runs TypeScript in the sandbox (`browser-js`).
- **Dense lessons** flagged by the expansion: `js-17-11` (six assessed subskills in 15 minutes) and `js-18-04`
  (tests, review, write-up and a local Git conflict in 30 minutes). Authors may split them; the validator requires
  contiguous renumbering, so a split is a visible change.
- **Gate scope.** JS-18, RE-12, RN-12 and NO-14 formally assess only their mapped families (the closure model places
  `assess` entries inside mapped units); the cumulative claim rests on their retrieval entries and unseen practice
  content, which authors must write across all families of the stage.
- **Checkpoint review lessons** (`re-08-01`, `rn-08-01`, `no-08-01`) carry `intro` entries for checkpoint families
  while their practice is retrieval; authors may move those introductions to the following instructional lesson.
- **Unresolved tool choices** are never named in the lessons: router (RE-05), React Native toolchain, navigation and
  storage libraries, runtime schema parser, test runner. Summaries use core APIs and neutral phrases.
- **Glossary gaps.** Plain `origin` is not introduced anywhere (candidates: `js-16-03` or `js-10-03`); two
  misconceptions recur verbatim across stages (response ordering; one character is one byte).
- **Spelling.** English text uses American spelling (authorization, optimize, behavior) to match the inventory.

