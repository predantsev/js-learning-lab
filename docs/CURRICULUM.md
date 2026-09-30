# Complete curriculum outline

This is the target course inventory, not a statement that content already exists. Unit IDs are stable. Each unit becomes one or more small lessons satisfying the content contract. Every named topic must have an explanation, real executable practice or explicitly local task, and assessed evidence. This outline is a minimum breadth, not a promise that one lesson per row is sufficient. Stage order is fixed; a learner may skip with checkpoints instead of completing a separate track.

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
| JS-02 | const/let, assignment, operators, comparisons, coercion pitfalls, conditionals, logical operators. | Debug a misleading comparison; compute item labels and validation messages. |
| JS-03 | Functions, parameters, return, arrow syntax, scope and closure; pure behavior vs side effects. | Step through calls and captured variables; extract reusable capstone transformations. |
| JS-04 | Arrays, objects, property access, identity, mutation/immutable updates, loops, destructuring, spread. | Trace reference changes; add/update/remove domain records without losing unrelated fields. |
| JS-05 | map/filter/find/some/reduce, sorting and search; choose readable transformations. | Filter a small card collection, then implement capstone search/filter and summary. |
| JS-06 | Before DOM: short HTML/CSS bridge for box/layout basics, selectors, forms and accessible labels; then DOM, events, rendering, propagation and focus. Extend only as required by the upcoming project/JSX. | Render list/cards; create/edit/delete with confirmation where appropriate and inline validation. |
| JS-07 | Modules, file structure, JSON, storage, errors and debugging; synchronous call stack. | Split project files; persist/reload data and recover invalid stored input. |
| JS-08 | Promises, async/await, fetch, event loop, loading/error/retry, stale responses. | Controllable timeline and bundled mock response; local fixture fetch, failure/retry and response ordering. |
| JS-09 | Tests, assertions, boundary cases, debugging independently, delayed retrieval. | No-hint task combining earlier functions and events; verify list CRUD/filter/persistence. |
| JS-10 | Tooling and same-project VS Code transition; package manifest, install/run, browser tools. | Export at CP-JS; open same files, run locally, compare saved dataset and functionality. |

## React

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| RE-01 | Component model, JSX, render, props, composition, list keys. | Visual component tree; migrate existing capstone UI into components, preserve domain functions. |
| RE-02 | state, event handlers, immutable updates, derived values, render snapshots. | Predict state/output; controlled CRUD forms and filters with stable keys. |
| RE-03 | hooks rules, useEffect, dependencies/cleanup, stale closures and external synchronization. | Step through render/effect; debug stale data; synchronize persistence without duplicate effects. |
| RE-04 | Lift state, local vs shared state, context, custom hooks, reusable composition. | Move only necessary shared state; extract capstone persistence/data access hook. |
| RE-05 | Navigation/routing concepts, forms/validation, loading/error/empty states. | List/detail/edit routes and back behavior; retain edits or warn before leaving. Router library remains undecided. |
| RE-06 | Async integration, race/cancellation, error handling; testing observable behavior. | Debug delayed fixture responses and test CRUD/filters as user actions. |
| RE-07 | Accessibility, responsive desktop composition, measured performance, unnecessary renders. | Keyboard CRUD and focused optimization from an observed bottleneck; no mandatory premature memoization. |
| RE-08 | Independent React checkpoint and delayed JS/React review. | Build an enhancement without compulsory hints; verify CP-RE in VS Code and explain state/closure behavior. |

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

## Node.js

| Unit | Topics and outcomes | Practice / transfer |
|---|---|---|
| NO-01 | Node runtime vs browser, modules, packages, environment, process and local tooling. | Run actual local script; inspect inputs/output; explain APIs absent from the browser. |
| NO-02 | Async I/O, filesystem, errors, event loop, bounded operations and resource cleanup. | Persist a synthetic dataset safely; debug async failure; compare browser runtime behavior. |
| NO-03 | HTTP, requests/responses, methods/status, JSON, routes and server lifecycle. | Start real loopback server; send actual HTTP requests; inspect response and stop/restart. |
| NO-04 | CRUD API, validation, errors, pagination/filtering/sorting and stable contracts. | Move capstone repository adapter to API; invalid input receives predictable errors without corruption. |
| NO-05 | Server persistence, schema changes, initialization/seed and backup/restore. | Restart server without data loss; implement chosen storage, safe migration and recovery. DB is optional. |
| NO-06 | Client/server boundary, React + native integration, CORS/origins, credentials concepts. | Same selected domain connects web client and, when native tooling is available, native companion; distinguish client cache from server source of truth. Web integration suffices for learner Node completion; absent native integration remains explicitly unperformed, not passed. |
| NO-07 | Security basics: untrusted input, injection, safe paths, secrets, network exposure; tests/logging. | Reject invalid requests/path traversal; test API; avoid sensitive logs and bind to loopback by default. Production authentication is not a prerequisite. |
| NO-08 | Independent end-to-end capstone, troubleshooting and delayed cumulative assessment. | CP-NO real requests, persistence restart and client behavior; complete no-hint integration and explain tradeoffs. |

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
