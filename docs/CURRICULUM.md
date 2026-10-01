# Curriculum and competency program

This is the target course inventory, not a statement that content already exists. Unit IDs are stable. Each unit becomes one or more small lessons satisfying the content contract. Every named topic must have an explanation, real executable practice or explicitly local task, and assessed evidence. This outline is a minimum breadth, not a promise that one lesson per row is sufficient. The normative [competency matrix](COMPETENCY-MATRIX.md) closes granular professional outcomes and evidence; a row is neither authored content nor competence. Completeness takes precedence over duration and count: a year or longer is acceptable, with enough lessons, repeated practice and retrieval. No fixed lesson/unit count or one-shot implementation limit reduces core scope. Stage order is fixed; a learner may skip with checkpoints instead of completing a separate track.

## Stage practice/runtime policy

Small interactive examples remain inside the course throughout. Each exercise declares one of the runtime kinds defined in CONTENT-DATA.md, allowed APIs and observed output. Native/server tasks are clearly marked LocalTask with expected results and retry/troubleshooting. No stage becomes reading-only because native/server code cannot be validated by a browser preview.

| Stage | In-course practice | Actual local verification |
|---|---|---|
| JavaScript | Real browser JavaScript, DOM/forms and isolated learner-visible persistence; contextual HTML/CSS bridge before dependent work. | Same project export/run at JS-10; platform exercise isolation checked separately. |
| React | Real browser React components, state/hooks and UI interactions in the course; capstone proceeds in VS Code. | CP-RE project behavior and retained data verified locally. |
| React Native | Real shared JS/domain/state transformations and explicitly labeled interactive layout/navigation concept previews where appropriate. | Native views, device capabilities, persistence and screen behavior need declared emulator/device checks. Browser previews do not demonstrate native competence. |
| Node.js | Real browser-compatible JS transformations such as validation/response construction plus interactive request/error-flow concept exercises. An isolated actual Node in-course executor is an open option requiring feasibility evidence, not inherently impossible. | Node-only APIs, filesystem and real HTTP server behavior require a real local process and requests unless an actual isolated Node executor has been independently verified for the relevant API. Final server integration still has local instructions/checks. |

The course order remains JavaScript → React → React Native → Node.js even if architecture spikes test runtime capabilities early. Without native tooling, learners may continue with concept exercises and web-client Node integration; native tasks retain unperformed/skipped provenance and can be revisited. This learner pacing never waives full-product RN content/native-workflow release checks.

## JavaScript

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| JS-01 | What programming does; browser/editor/console; expressions, values, strings, numbers, booleans, null/undefined; read an error; contextual HTML/CSS entry: elements/attributes, simple markup, selectors and text presentation. | Predict and run tiny expressions; inspect/change a minimal labeled page containing capstone title and synthetic sample values. No outside HTML/CSS prerequisite. |
| JS-02 | const/let, legacy var reading, lexical scope/hoisting/TDZ, operators/equality/coercion/truthiness/nullish behavior, if/else/switch and fallthrough. | Debug a misleading comparison; compute item labels and validation messages. |
| JS-03 | Functions/default/rest/return/arrows, scope/closure/higher-order/recursion and pure behavior vs side effects; this/binding depth continues in JS-11. | Step through calls and captured variables; extract reusable capstone transformations. |
| JS-04 | Arrays, objects, property access, identity, shallow/deep copy and mutation/immutable updates; for/while/do-while/for-of/for-in ownership, break/continue, nested/empty loops; destructuring/spread. | Trace reference changes; add/update/remove domain records without losing unrelated fields. |
| JS-05 | map/filter/find/some/every/reduce, sorting comparator/order and search/complexity; choose readable transformations. | Filter a small card collection, then implement capstone search/filter and summary. |
| JS-06 | Before DOM: short HTML/CSS bridge for box/layout basics, selectors, forms and accessible labels; then DOM, events, rendering, propagation and focus. Cover semantic HTML/forms, cascade/specificity/box model/Flex/Grid/responsive websites, accessible labels/keyboard/focus and event delegation; no external prerequisite. Responsive learner websites do not change the desktop-only course platform. | Render list/cards; create/edit/delete with confirmation where appropriate and inline validation. |
| JS-07 | ESM/file structure/dynamic import and CJS reading boundary, JSON/storage, Error/throw/try/catch/finally and debugging; synchronous call stack. | Split project files; persist/reload data and recover invalid stored input. |
| JS-08 | Promises/chaining/composition, async/await, fetch, tasks/microtasks, cancellation/races/loading/error/retry and stale responses. | Controllable timeline and bundled mock response; local fixture fetch, failure/retry and response ordering. |
| JS-09 | Tests, assertions, boundary cases, debugging independently, delayed retrieval. | No-hint task combining earlier functions and events; verify list CRUD/filter/persistence. |
| JS-10 | Tooling and same-project VS Code transition; package manifest, install/run, browser tools. | Export at CP-JS; open same files, run locally, compare saved dataset and functionality. |


### Added required depth and closure

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| JS-11 | Object/function depth: this/binding, prototype lookup, classes/private/static members, composition vs inheritance. | Implement/debug equivalent compositional and class adapters; inspect ownership and retained closures. |
| JS-12 | Standard data semantics: strings/Unicode, precision/Math, date/timezone/Intl, regex, Map/Set and weak collection limits. | Boundary-fixture labs, localization/date assumptions, safe collection choice and number/text validation. |
| JS-13 | Iterators/generators, binary data and resource/memory cleanup; specialized metaprogramming/concurrency/resource syntax with version limits. | Working lazy traversal/byte lab and leak repair; assessed specialized API literacy, not a universal API mandate. |
| JS-14 | Required TypeScript foundation: models/unions/narrowing/nullability/functions/generics/modules; compile-time vs runtime validation. | Typecheck and independently debug pure domain models with strict options and runtime input validation. |
| JS-15 | Local professional workflow: terminal/packages/lockfiles/lint/build/env and Git commits/branches/conflicts/diffs/review. | Synthetic local repository/conflict lab and clean setup before JS-10 export; no remote account required. |
| JS-16 | Web boundary depth: HTTP/URL/cookies/storage/origins/CORS, cancellation/network failure, browser safety/XSS/input. | Actual local fixture requests, DevTools diagnosis and safe output/security lab. |
| JS-17 | Application data structures/algorithms, measured performance, memory/debugging, tests/refactoring and accessible responsive website quality. | No-hint defect repair, operation-count/profile evidence, behavior-preserving refactor and focused UI audit. |
| JS-18 | Cumulative JavaScript/web/TypeScript/workflow stage gate after foundational export. | All JS-stage matrix subskills independently assessed; CP-JS alone insufficient; delayed unseen debugging/transfer. |

## React

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| RE-01 | Component model, JSX, render, props, composition, list keys. | Visual component tree; migrate existing capstone UI into components, preserve domain functions. |
| RE-02 | state, event handlers, immutable updates, derived values, render snapshots. | Predict state/output; controlled CRUD forms and filters with stable keys. |
| RE-03 | hooks rules, useEffect, dependencies/cleanup, stale closures and external synchronization. | Step through render/effect; debug stale data; synchronize persistence without duplicate effects. |
| RE-04 | Lift state, local/shared ownership, reducers/context, refs/custom hooks and reusable composition; typed model depth in RE-09. | Move only necessary shared state; extract capstone persistence/data access hook. |
| RE-05 | Navigation/routing/history/params, forms/validation/accessibility, render error-boundary limits and loading/error/empty states. | List/detail/edit routes and back behavior; retain edits or warn before leaving. Router library remains undecided. |
| RE-06 | Async integration/cache/invalidation/races/cancellation/optimistic rollback, error handling and observable behavior tests. | Debug delayed fixture responses and test CRUD/filters as user actions. |
| RE-07 | Accessibility, responsive desktop composition, measured performance, unnecessary renders. | Keyboard CRUD and focused optimization from an observed bottleneck; no mandatory premature memoization. |
| RE-08 | Independent React checkpoint and delayed JS/React review. | Build an enhancement without compulsory hints; verify CP-RE in VS Code and explain state/closure behavior. |


### Added required depth and closure

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| RE-09 | Typed React models/reducers/context/forms, error boundaries, async cache/optimistic failure and contract depth. | Strict typed UI and state-transition tests; debug race/rollback and accessible error recovery. |
| RE-10 | Suspense/transitions/concurrent mental model and version-labelled modern APIs; measured profiling. | Run supported lazy/transition example; test pending/error responsiveness and justify API/toolchain boundaries. |
| RE-11 | SSR/static/hydration/server-client/RSC boundary literacy. | Read/diagnose architecture and supplied hydration traces; actual server-rendering lab deferred to NO-13 after Node basics. |
| RE-12 | Cumulative React quality, local production build, CI/review/release/rollback fundamentals. | All React matrix families plus independent enhancement/debug/E2E and artifact checks; CP-RE CRUD alone insufficient. |

## React Native

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| RN-01 | Native vs web rendering, local tooling/device/emulator setup, environment constraints. | Clearly labeled browser concept exercise, then local native hello screen and actual device/emulator evidence. |
| RN-02 | Core views/text, styling/layout, safe areas, platform differences, accessibility. | Translate capstone component design into native screens with readable accessible labels. |
| RN-03 | State/hooks reuse, input, lists/keys, touch interaction, keyboard behavior. | Native CRUD list/forms; reuse pure JS domain code, adapt UI deliberately. |
| RN-04 | Navigation, screen lifecycle, route parameters, back behavior and unsaved edits. | List/detail/edit screens; test device/emulator back and keyboard interactions. |
| RN-05 | Local persistence, async APIs, loading/errors, offline state, data migration. | Restart native app and retain synthetic records; explain browser vs native storage adapter. |
| RN-06 | Networking, permissions/capabilities and device limitations. | Use bundled fixtures and/or a provided minimal local mock-service tool with exact prerequisites/start/stop instructions; no learner-authored Node backend required yet. Verify toolchain-specific host/emulator/device addressing before release; real API integration follows in NO-06. No decorative permission request. |
| RN-07 | Debugging, native errors, tests, platform differences and deployment concepts. | Debug a real local native failure; distinguish unit tests from emulator/device checks. Store publication is not required. |
| RN-08 | Independent native checkpoint and delayed React/JS retrieval. | CP-RN on declared native target, with explicit unsupported targets; reinforce state/effect/data transformation. |


### Added required depth and closure

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| RN-09 | Permission/device/secure-storage/privacy/deep-link depth and shared typed platform contracts. | Focused synthetic capability lab with deny/revoke/unavailable-target handling; vetted platform-specific adapters. |
| RN-10 | Gestures/animation/assets and measured list/UI/JS performance; reduced motion and lifecycle cleanup. | Actual native interaction/profile and independent defect repair on declared supported target. |
| RN-11 | Android/iOS build/config/signing/distribution/update/privacy basics and local release artifact. | Build/install/test release on declared target; explain other-platform limits; no paid store account/upload required. |
| RN-12 | Native/new-architecture/interop literacy and cumulative native quality gate. | All RN competency evidence, independent native bug fix, lifecycle/offline/security/a11y/release checks; distinguish mocks/skips. |

## Node.js

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| NO-01 | Node runtime vs browser, modules, packages, environment, process and local tooling. | Run actual local script; inspect inputs/output; explain APIs absent from the browser. |
| NO-02 | Async I/O, filesystem, errors, event loop, bounded operations and resource cleanup. | Persist a synthetic dataset safely; debug async failure; compare browser runtime behavior. |
| NO-03 | HTTP, requests/responses, methods/status, JSON, routes and server lifecycle. | Start real loopback server; send actual HTTP requests; inspect response and stop/restart. |
| NO-04 | CRUD API, validation, errors, pagination/filtering/sorting and stable contracts. | Move capstone repository adapter to API; invalid input receives predictable errors without corruption. |
| NO-05 | Server persistence, schema changes, initialization/seed and backup/restore. | Restart server without data loss; implement chosen storage, safe migration and recovery. Capstone storage choice is open; platform DB remains optional, but the separate local SQL/relational lab in NO-09 is required. |
| NO-06 | Client/server boundary, React + native integration, CORS/origins, credentials concepts. | Same selected domain connects web client and, when native tooling is available, native companion; distinguish client cache from server source of truth. Web integration suffices for learner Node completion; absent native integration remains explicitly unperformed, not passed. |
| NO-07 | Security basics: untrusted input, injection, safe paths, secrets, network exposure; tests/logging. | Reject invalid requests/path traversal; test API; avoid sensitive logs and bind to loopback by default. Actual production accounts are not prerequisites; required local synthetic authentication/authorization/security practice is in NO-10. |
| NO-08 | Independent end-to-end capstone, troubleshooting and delayed cumulative assessment. | CP-NO real requests, persistence restart and client behavior; complete no-hint integration and explain tradeoffs. |


### Added required depth and closure

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| NO-09 | Required local relational/SQL lab: modelling/joins/constraints/transactions/indexes/migrations/query safety. | Synthetic related data, real queries/rollback/migration and parameterized injection-safe input; platform DB still optional. |
| NO-10 | Required local authentication/authorization/session/token/password/secrets/security-control lab. | Synthetic users/ownership; vetted hashes/session controls, expired/revoked/unauthorized cases; platform login not required. |
| NO-11 | Streams/backpressure, events/buffers, bounded jobs/concurrency, cancellation/resource cleanup. | Actual slow-consumer pipeline and queue; independently repair memory/handle leak and retry/idempotency defect. |
| NO-12 | Backend testing/diagnostics/observability and operation: config/build/CI/health/shutdown/backup/restore/recovery/rollback. | Real local production-mode rehearsal and incident runbook; cloud/vendor infrastructure not prerequisite. |
| NO-13 | Actual Node-backed React SSR/static output and hydration boundary lab; RSC architecture awareness retained. | Real server requests plus browser hydration; diagnose mismatch/serialization/security with no forced framework. |
| NO-14 | Cumulative independent professional gate across all four stages. | Selected capstone plus required focused labs, unseen debug/test/review/design tradeoffs and verified runtime/evidence closure. |

## Concept-to-capstone mapping

All four choices cover the same shared objectives, with reusable domain-independent components/contracts where feasible. Prefer shared implementation and focused variants; do not require one universal generated template without evidence. Extensions below are small variants, not four separate curricula. Synthetic fixtures, equivalent rubrics and starter states exist for every option.

| Shared objective | Units | Wishlist | Planner | Habit tracker | Expense tracker |
|---|---|---|---|---|---|
| Values/validation/functions | JS-01–03 | Item name/optional price | Task title/date | Habit name/frequency | Label/amount/date |
| Lists and create/update/delete | JS-04,06; RE-01–02; RN-03; NO-04 | Items | Tasks | Habits and entries | Expenses |
| Search/filter/sort | JS-05; RE-05; NO-04 | Wanted/acquired | Pending/done/date | Active/date/completed | Category/date |
| Derived data and boundary cases | JS-05,09; RE-02 | Item count/optional total | Due task count | Completion count/rate | Total by category |
| Persistence/recovery | JS-07; RE-03–04; RN-05; NO-02,05 | Selected domain stored through stage adapters | Same | Same | Same |
| Async errors/loading/retry | JS-08; RE-06; RN-06; NO-03,06 | Shared fixture/API contract with domain fields | Same | Same | Same |
| Accessibility/testing/debugging | JS-06,09; RE-06–08; RN-02,07–08; NO-07–08 | Equivalent observable-behavior rubric | Same | Same | Same |
| Small domain extension | Stage checkpoint task | Acquired flag, optional category | Due date and priority | Dated completions, simple streak with stated date assumptions | Fixed currency per project, integer minor units and category totals |

Avoid payments, bank connections, scraping, complex calendars/timezones and medical claims. These are educational domain limits, not production product promises. Final detailed fields and validation thresholds are proposals to confirm during content authoring.

## Checkpoints and dependency bypass

| ID | State and evidence | Starter for skipping |
|---|---|---|
| CP-START | Chosen domain, synthetic sample list, empty exercise workspace. | Every capstone has the same simple starter contract. |
| CP-JS | Vanilla JavaScript CRUD, filters, validation, local persistence, assertions; VS Code transition after JS-10. | Working JS files, schema and synthetic data, plus change summary; self-check prior concepts without blocking access. |
| CP-RE | Same domain in React, retained pure domain functions and migrated data, tested observable behavior. | React project compatible with CP-JS data; annotated migration and diff, not forced overwrite. |
| CP-RN | Native companion in same exported project workspace, reused domain logic, platform-specific UI/storage; actual native target check. | Ready native subproject plus setup/target instructions; retain web sibling and existing edits. |
| CP-NO | Local server with shared domain API and persistence, integrated web client, optional-for-learner native companion, and recovery checks. Native absence is recorded; product native-integration checks still apply on the supported target. | Server/client adapters with seeded fixtures and schema migration instructions. |

At each checkpoint, show missing dependencies, offer a separate starter/reference version and keep learner-authored vs supplied provenance. Skipping instruction never marks project verification passed; native-tooling skips remain revisitable.

**Before export (in-platform files):** show a changed-file preview, create a recovery snapshot and require explicit replacement choice before applying starter changes. Preserve the previous workspace on failure.

**After export (VS Code files):** local files are authoritative. Supply a separate downloadable starter/reference archive, file/version manifest, readable diff from the preceding reference checkpoint, and step-by-step change instructions. Guide the learner to back up their actual project, compare the reference with their own edits, manually merge selected changes, then run the checkpoint checks. Reference diffs are not claimed to describe unseen local edits. Optionally accept an explicitly user-selected file snapshot for comparison; import must not overwrite either local files or prior in-course work. Automatic preview/snapshot/replacement applies only to platform-managed copies, never to local project files. Record checkpoint evidence as learner-confirmed or directly verified with its source; no automatic local inspection is implied.

**Capstone change:** create a separate workspace/project with its own starter/progress. Keep the old project accessible and preserve global course evidence; new-project transfer/checkpoint work starts unperformed.

A proposed workspace after export contains domain/, web/, native/ and server/ as these become necessary. Do not impose monorepo tooling before choosing architecture. “Same project” means preserved domain identity, files, work and continuity, not identical browser/native runtime code.

## Teaching order and stage closure

Stable IDs are identity, not a mandatory numerical teaching sequence. The explicit sequence in competencies.json is:

- JavaScript: JS-01–09 → JS-15 local workflow → JS-10/CP-JS foundational export → JS-11–14 → JS-16–18. Foundations such as HTML/CSS and loops are deepened before their first dependent work, not postponed to an external course.
- React: RE-01–07 → RE-09–11 → RE-08 checkpoint → RE-12 cumulative gate.
- React Native: RN-01–06 → RN-09–10 → RN-07 → RN-11 → RN-08 checkpoint → RN-12 cumulative gate.
- Node: NO-01–04 → NO-09 SQL → NO-05 persistence → NO-10 auth → NO-07 security → NO-11 resources → NO-06 integration → NO-12–13 → NO-08 checkpoint → NO-14 cumulative gate.

Competency prerequisites constrain independent assessment closure, not the first introductory mention of every subskill. A multi-unit family may introduce basics early and assess deeper work later; authors must give each lesson/subskill actual prerequisites and validate them before release. Cross-stage revisits do not introduce a fifth stage. Server-only React practice is anticipated conceptually in RE-11 and actually executed in NO-13.

JS-10/CP-JS remains the established foundational export; it is not proof of all expanded JavaScript skills. CP-RE/RN/NO retain their existing domain continuity/rubrics, supplemented by stage gates. Stage completion requires all assigned required-core and required-awareness subskills at specified depth, independent debugging/retrieval and transfer or a justified focused lab; final NO-14/M6 checks cumulative retained competence. TypeScript, SQL/auth, delivery and professional recovery are required course skills without forcing them into the platform architecture or unnatural capstone features.

Without native tools, continuation remains available using supplied/reference/concept work, but missing native target evidence stays skipped/unperformed. It does not confer full native/full-course competency completion or waive product-native release evidence. Paid cloud/store accounts and external deployment are not required; declared-target release builds and local production-mode delivery/restore rehearsals supply real evidence with transparent limits.
