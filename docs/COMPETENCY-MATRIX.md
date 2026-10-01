# Professional competency matrix

Normative specification baseline 4, checked 2026-10-01. Machine-readable source: [competencies.json](competencies.json). [Curriculum](CURRICULUM.md) supplies stable units; [audit](audits/2026-10-01-COMPLETENESS.md) distinguishes previous explicit/partial/missing coverage. This is outcome scope, not authored or passed teaching.

## Scope, depth and boundaries

Target: beginner through independent professional ability to build, debug, test, secure, deliver and maintain React web apps, React Native apps and Node services. Complete means demonstrated selected-stack competencies, not every possible API/framework/speciality, seniority or employment guarantee. A year or longer is acceptable; enough explanation, repeated practice, retrieval and independent debugging takes precedence over counts/deadlines. Suggested 5–15 minute sessions are pacing only.

Depths: **explain-read** requires accurate explanation, tracing and boundary diagnosis; **implement-debug** requires working code and independent defect repair; **design-test-operate** adds justified design, tests, delivery/measurement/recovery. Foundation is a subset of required core. **required-awareness** is assessed at its stated depth, not optional navigation. Specialized choices have rationale below. Writing native modules, implementing an RSC framework, deep compiler/metaprogramming/lock-free design, distributed cloud infrastructure and legacy ecosystem mastery are extensions; required boundary literacy remains assessed. No blanket demotion of fundamental skills to awareness.

New/experimental/runtime-specific APIs (including resource syntax, modern React features and native architecture tooling) need selected-version support/stability checks during authoring. Teach legacy var/CJS/old framework patterns as reading/migration context, not modern defaults. Current reference versions are not chosen supported runtimes. TypeScript is course knowledge, not a mandated platform implementation language; SQL/auth labs do not mandate platform DB/login or remote identity.

## Prerequisites and teaching placement

Two dependency layers are explicit in each inventory record. `intro_prerequisite_units` are earlier minimum introductions, with `intro_same_unit_foundations` placed earlier within the same unit. `prerequisites` are final independent assessment dependencies; they do **not** require every mapped unit/family pass before first introduction. Multi-unit families spiral from foundations to later closure. `intro_bridge` names the placement rule, with specific function/reducer/native-release/Node-entry bridges. Authoring must resolve every subskill into actual lesson prerequisites and check that graph; the specification is not a lesson schedule or executable prerequisite lock. Supplied/skipped bridge material supports pacing, never evidence of independent competence.

Stage entry follows JS → React → RN → Node. Native practical passes are not Node-entry prerequisites. Full-course native competence remains incomplete for a learner without observed native work; the product still needs native-target evidence.

## Current state and evidence closure

Every family below is now explicitly specified; `baseline_spec` describes only baseline-3 wording (explicit/partial/missing), not taught knowledge. All are **not-authored / not-implemented / not-verified**. Lesson/assessment/evidence arrays are empty deliberately. Future release requires existing bilingual lesson IDs and per-subskill practice/oracles, independently inspected runnable artifacts and observed evidence, including delayed retrieval, debugging and transfer. Family/count/checkpoint presence cannot pass that gate. Any newly discovered core gap expands this scope.

Practice applies the explanation → prediction → run/change → independent task → transfer/retrieval contract, with meaningful code-linked visuals/text equivalents and bounded analogies where useful. Native/server APIs use actual local tasks; concept previews are labeled. Each focused lab uses synthetic data and complements the chosen capstone when the domain feature would be unnatural. All four capstones retain equivalent objectives and original export/workspace continuity.

## JavaScript, web and professional foundations

### J-01 — Values and operators

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-01, JS-02.

**Subskills:** primitive/reference values; typeof and null/undefined; Symbol and BigInt read/use boundaries; equality/coercion/truthiness; nullish coalescing/optional chaining; arithmetic/logical/assignment/ternary precedence; unary operators/in/instanceof and bitwise reading boundaries.

**Placement:** minimum prior introduction units none; earlier same-unit foundations none; final assessment dependencies none. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Predict a truth/type table then modify real expressions; visualize coercion paths.

**Independent evidence:** No-hint validation function with null/empty/zero/NaN cases; diagnose == and || default bugs. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-02 — Bindings and scope

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-02, JS-03.

**Subskills:** const/let and mutation distinction; legacy var reading; lexical/function/block scope; hoisting and TDZ; shadowing and strict mode.

**Placement:** minimum prior introduction units JS-01; earlier same-unit foundations none; final assessment dependencies J-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Scope/call-frame step-through; run declarations before/after initialization.

**Independent evidence:** Explain TDZ vs undefined; repair captured loop binding and shadowed variable without changing intended output. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-03 — Control flow and loops

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-02, JS-04.

**Subskills:** if/else and switch fallthrough; for/while/do-while; for-of values vs for-in enumerable keys/ownership pitfalls; break/continue; nested/empty loops; termination and off-by-one.

**Placement:** minimum prior introduction units JS-01; earlier same-unit foundations J-02; final assessment dependencies J-01, J-02. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Animated iteration table linked to actual output, including zero/one/many iterations.

**Independent evidence:** Implement equivalent traversals; debug infinite/off-by-one/nested exits; reject inherited-property enumeration bug. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-LOOPS](#source-mdn-loops).

### J-04 — Functions and closures

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-03, JS-11.

**Subskills:** parameters/default/rest/arguments; return and arrow syntax; pure/side effects; closures and higher-order functions; recursion/base case; callbacks; lexical vs dynamic this; call/apply/bind.

**Placement:** minimum prior introduction units JS-02; earlier same-unit foundations none; final assessment dependencies J-02, J-03. Basic function introduction follows values/bindings and conditional reasoning. Loop traversal precedes higher-order/recursive practice; this/prototype depth closes at JS-11. No completed JS-11 prerequisite for JS-03.

**Practice:** Call-stack/captured-binding diagram; invoke detached methods and bind handlers.

**Independent evidence:** Build reusable transforms and a recursive bounded tree walk; fix lost-this and stale captured-value defects. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js), [MDN-CLASS](#source-mdn-class).

### J-05 — Arrays and object data

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-04, JS-05.

**Subskills:** property access and ownership; destructuring/spread; shallow vs deep copying; reference identity/mutation; sparse/empty cases; map/filter/find/some/every/reduce; sorting comparator and stable ordering; search and complexity.

**Placement:** minimum prior introduction units JS-02, JS-03; earlier same-unit foundations none; final assessment dependencies J-03, J-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Reference graph and before/after lists tied to executed CRUD/filter/sort code.

**Independent evidence:** No-hint transformations preserve unrelated fields; test comparator and missing/duplicate records, explain time/space costs. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-06 — Objects and class models

**Depth:** implement-debug; **scope:** core; **units:** JS-11.

**Subskills:** prototype chain and own properties; methods/getters/setters/property descriptors reading; constructor/new; classes/private/static fields; inheritance vs composition; object model tradeoffs.

**Placement:** minimum prior introduction units JS-03, JS-04; earlier same-unit foundations none; final assessment dependencies J-04, J-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Prototype lookup visual; implement a small class and equivalent compositional adapter.

**Independent evidence:** Repair inherited-property/lost-this bugs; justify composition or inheritance for a synthetic model and test behavior. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-CLASS](#source-mdn-class).

### J-07 — Text and numeric semantics

**Depth:** implement-debug; **scope:** core; **units:** JS-12.

**Subskills:** string immutability and Unicode code units/code points; normalization awareness; numeric precision/NaN/Infinity; Math and parsing; integer minor units; regex groups/flags/escaping and input limits; regex character classes/anchors/quantifiers and backtracking risk.

**Placement:** minimum prior introduction units JS-01, JS-04; earlier same-unit foundations none; final assessment dependencies J-01, J-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Run Unicode length/iteration and rounding counterexamples; trace regex matching without decorative visuals.

**Independent evidence:** Implement safe labels/search and minor-unit totals; debug malformed numeric input and bounded validation regex. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-08 — Dates and localization

**Depth:** implement-debug; **scope:** core; **units:** JS-12.

**Subskills:** Date parsing/storage vs presentation; timestamps/calendar dates; timezone/DST pitfalls; Intl date/number/collation; locale vs stored canonical values.

**Placement:** minimum prior introduction units none; earlier same-unit foundations J-07; final assessment dependencies J-07. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Timestamp/calendar/timezone timeline with actual formatted output and fixed test clock.

**Independent evidence:** Test date rollover and locale display without corrupting stored values; state simple capstone date assumptions. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-09 — Collection choices

**Depth:** implement-debug; **scope:** core; **units:** JS-12.

**Subskills:** Map/Set key/equality/iteration semantics; object vs Map; dedup/indexing; WeakMap/WeakSet lifecycle limits; no deterministic weak enumeration/GC assumptions.

**Placement:** minimum prior introduction units JS-04, JS-11; earlier same-unit foundations none; final assessment dependencies J-05, J-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Implement membership and indexing; show identity keys and collection lifetimes.

**Independent evidence:** Choose/test a collection for lookups and duplicate removal; explain why weak collections cannot store counted progress. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### J-10 — Errors and modules

**Depth:** implement-debug; **scope:** core; **units:** JS-07, JS-13.

**Subskills:** Error types/cause and throw; try/catch/finally; cleanup and propagation; JSON parse/serialize limitations; ESM imports/exports/live bindings; dynamic import; CommonJS interoperability context; module load/circular dependency diagnosis.

**Placement:** minimum prior introduction units JS-03, JS-04; earlier same-unit foundations none; final assessment dependencies J-04, J-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real multi-file failures and stack traces; module dependency diagram.

**Independent evidence:** Fix swallowed errors and finally-return defect; split domain modules, validate malformed JSON and explain ESM/CJS boundary. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js), [NODE-API](#source-node-api).

### J-11 — Asynchronous reasoning

**Depth:** implement-debug; **scope:** core; **units:** JS-08.

**Subskills:** call stack/tasks/microtasks; promise chaining and rejection; all/allSettled/race/any selection; async/await; cancellation/AbortController; races/retry/timeouts; cleanup and sequential vs concurrent requests.

**Placement:** minimum prior introduction units JS-03, JS-07; earlier same-unit foundations none; final assessment dependencies J-04, J-10. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Controllable actual promise timeline and delayed local fixtures.

**Independent evidence:** Repair stale response/unhandled rejection; test partial failures, cancel/retry and bounded concurrency. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js), [MDN-FETCH](#source-mdn-fetch).

### J-12 — Iteration, bytes and resources

**Depth:** implement-debug; **scope:** core; **units:** JS-13.

**Subskills:** iterable/iterator protocol; generators and for-await awareness; ArrayBuffer/typed arrays vs arrays; encoding boundaries; allocation/retained references; listeners/timers/handles cleanup; memory leak diagnosis.

**Placement:** minimum prior introduction units JS-12, JS-07, JS-08; earlier same-unit foundations none; final assessment dependencies J-09, J-10, J-11. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Small working generator and byte conversion; inspect retained listener/timer behavior.

**Independent evidence:** Implement lazy traversal and cleanup; debug leaked listener and byte/text mismatch; explain allocation limits. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js), [NODE-STREAM](#source-node-stream).

### J-13 — Application algorithm reasoning

**Depth:** design-test-operate; **scope:** core; **units:** JS-17.

**Subskills:** lists/maps/sets/stacks/queues/tree traversal; Big-O time/space; bounded recursion; sorting/search decisions; data size measurement; invariants and boundary cases.

**Placement:** minimum prior introduction units JS-04, JS-12, JS-13; earlier same-unit foundations none; final assessment dependencies J-05, J-09, J-12. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Compare actual timings at increasing input sizes with operation counts; no benchmark folklore.

**Independent evidence:** Select/test an index or queue; explain tradeoffs and prevent quadratic accidental work in a realistic transform. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js), [NODE-STREAM](#source-node-stream).

### J-14 — Specialized language boundaries

**Depth:** explain-read; **scope:** required-awareness; **units:** JS-13.

**Subskills:** Proxy/Reflect/metaprogramming awareness; shared memory/Atomics/workers concurrency concepts; WeakRef/finalizers nondeterminism; explicit resource-management syntax support; legacy patterns vs current standards.

**Placement:** minimum prior introduction units JS-11, JS-08; earlier same-unit foundations J-12; final assessment dependencies J-06, J-11, J-12. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Read a bounded example and capability/version table; compare explicit cleanup to nondeterministic GC.

**Independent evidence:** Identify unsafe finalizer assumptions and unsupported syntax; explain when a specialized API requires a separate spike. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Specialized mechanisms need recognition and safe boundaries, not mastery of every niche API. Workers/Atomics and using syntax depend on runtime support; never a default without verification. Runtime: browser-js.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-JS](#source-mdn-js).

### W-01 — Semantic HTML and forms

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-01, JS-06.

**Subskills:** document structure/headings/landmarks; links/buttons; inputs/labels/validation; keyboard focus; tables/images/alt; safe accessible form semantics.

**Placement:** minimum prior introduction units none; earlier same-unit foundations J-01; final assessment dependencies J-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Construct and inspect a semantic synthetic page with keyboard and accessibility tree.

**Independent evidence:** Build a labeled CRUD form; debug missing name/label and wrong button/link semantics; test keyboard submit. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web).

### W-02 — CSS and responsive websites

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-06.

**Subskills:** cascade/inheritance/specificity; box model/sizing; Flexbox/Grid; spacing/typography; responsive media queries; overflow and zoom; reduced motion; maintainable styles.

**Placement:** minimum prior introduction units JS-01; earlier same-unit foundations none; final assessment dependencies W-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Layout/box diagrams linked to live CSS edits and desktop/narrow learner-site viewports.

**Independent evidence:** Implement flexible card/form layout; fix overflow and specificity conflict; verify zoom/keyboard visibility. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web).

### W-03 — DOM and event behavior

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-06.

**Subskills:** query/create/update/remove nodes; safe text vs HTML; bubbling/capture/delegation; default behavior; focus management; forms and event cleanup.

**Placement:** minimum prior introduction units JS-04, JS-01; earlier same-unit foundations W-02; final assessment dependencies J-05, W-01, W-02. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Event-path/focus visual with actual DOM interaction.

**Independent evidence:** Independent CRUD UI with delegation; repair duplicate listeners and lost-focus rerender; prevent unsafe sink. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web), [OWASP-XSS](#source-owasp-xss).

### W-04 — HTTP and browser data boundaries

**Depth:** implement-debug; **scope:** core; **units:** JS-08, JS-16.

**Subskills:** URL/query/encoding; HTTP methods/status/headers; JSON content types; fetch response checks; cookies/storage/origins; same-origin/CORS/preflight/credentials; network/offline failures.

**Placement:** minimum prior introduction units JS-07, JS-06; earlier same-unit foundations J-11; final assessment dependencies J-10, J-11, W-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** DevTools network inspection and controlled loopback fixture failures; request/response diagram.

**Independent evidence:** Diagnose HTTP error vs rejected fetch vs CORS; implement cancel/retry and safe query encoding; distinguish cookie/storage scope. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-FETCH](#source-mdn-fetch), [MDN-CORS](#source-mdn-cors).

### W-05 — Browser safety, accessibility and performance

**Depth:** design-test-operate; **scope:** core; **units:** JS-16, JS-17.

**Subskills:** untrusted input and safe output; XSS threat/safe sinks; no secret in client bundle; storage/privacy; semantic/keyboard/screen reader basics; DevTools performance/network/memory; measured improvements.

**Placement:** minimum prior introduction units JS-06, JS-08, JS-13; earlier same-unit foundations none; final assessment dependencies W-03, W-04, J-12. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Synthetic malicious text, keyboard audit and measured render/network profile.

**Independent evidence:** Repair XSS unsafe interpolation; document threat boundaries; improve one measured bottleneck without losing accessibility. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web), [OWASP-XSS](#source-owasp-xss).

### P-01 — Terminal, packages and build tooling

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-10, JS-15.

**Subskills:** files/paths and shell navigation; safe commands; package scripts/manifest; package manager/lockfile; dependency/semver/security basics; lint/format; build/env/config; source maps.

**Placement:** minimum prior introduction units JS-07, JS-06; earlier same-unit foundations none; final assessment dependencies J-10, W-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Guided local terminal and clean install/build; inspect dependency/lockfile diffs.

**Independent evidence:** Reproduce setup from clean files, diagnose script/config/version failure, review dependency change without exposing secrets. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-web.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web), [NODE-LEARN](#source-node-learn).

### P-02 — Git and collaborative review

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-15.

**Subskills:** status/diff/stage/commit; branch/history; local merge/rebase reading; resolve conflicts; undo safely; remotes/PR review concepts; review rationale.

**Placement:** minimum prior introduction units none; earlier same-unit foundations P-01; final assessment dependencies P-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Local synthetic repository, divergent branches and readable merge conflict; no account prerequisite.

**Independent evidence:** Commit coherent change, resolve/test conflict, review a seeded diff and explain safe recovery. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-web.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [GIT](#source-git).

### P-03 — TypeScript language foundation

**Depth:** implement-debug; **scope:** core (foundation); **units:** JS-14.

**Subskills:** type annotations/inference; models/interfaces/type aliases; unions/narrowing/discriminants; functions/generics; nullability/strict checks; unknown vs any; modules/type-only imports; runtime validation distinction.

**Placement:** minimum prior introduction units JS-11, JS-07; earlier same-unit foundations none; final assessment dependencies J-06, J-10. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Compile local typed model and visualize narrowing flow with runtime counterexamples.

**Independent evidence:** Model/test domain and generic helper; fix null/union errors; validate untrusted JSON instead of trusting a cast. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-web.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [TS](#source-ts), [TS-NARROW](#source-ts-narrow), [TS-GENERIC](#source-ts-generic).

### P-04 — Testing, debugging and maintainability

**Depth:** design-test-operate; **scope:** core (foundation); **units:** JS-09, JS-17, JS-18.

**Subskills:** unit/integration/user/E2E purposes; assertions/boundaries; mocks vs actual evidence; deterministic fixtures; breakpoints/source maps; refactor/clean interfaces; documentation and code review.

**Placement:** minimum prior introduction units JS-04, JS-07, JS-06; earlier same-unit foundations none; final assessment dependencies J-05, J-10, W-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Seeded bugs, debugger trace, failing/passing/alternate-solution fixtures and refactor.

**Independent evidence:** Diagnose new defect no hints; write tests that catch it and retain behavior; explain mock limits and document decisions. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-js.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [MDN-WEB](#source-mdn-web), [NODE-TEST](#source-node-test).

## React

### P-05 — Typed UI and reusable contracts

**Depth:** implement-debug; **scope:** core; **units:** RE-01, RE-02, RE-04, RE-09.

**Subskills:** typed props/state/events/hooks; typed reducers/context; API models and runtime schemas; native/server reuse boundaries; accessible error models.

**Placement:** minimum prior introduction units JS-14; earlier same-unit foundations none; final assessment dependencies P-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Typecheck a real React form/reducer; share pure domain types, not platform views.

**Independent evidence:** Repair invalid union/state transition and unchecked response; test model/UI behavior with strict types. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [TS](#source-ts), [TS-NARROW](#source-ts-narrow), [REACT-LEARN](#source-react-learn).

### P-06 — Client delivery and continuous checks

**Depth:** design-test-operate; **scope:** core; **units:** RE-12.

**Subskills:** production bundle/assets/env boundaries; lint/type/unit/user checks; CI pipeline reading/design; artifact/release version; dependency updates; static delivery/cache/rollback; docs and review.

**Placement:** minimum prior introduction units JS-15, JS-09; earlier same-unit foundations none; final assessment dependencies P-01, P-02, P-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Local production build/serve and run equivalent CI steps locally; inspect sample workflow.

**Independent evidence:** Diagnose build/env failure, test production artifact and plan reversible client release/rollback; no paid hosting/account. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-web.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [CI](#source-ci), [MDN-WEB](#source-mdn-web), [NODE-PROD](#source-node-prod).

### R-01 — Components and rendering

**Depth:** implement-debug; **scope:** core; **units:** RE-01.

**Subskills:** JSX rules; function components/purity; props/composition/children; conditional/list rendering; stable keys and identity; render/commit distinction.

**Placement:** minimum prior introduction units JS-04, JS-06, JS-14; earlier same-unit foundations none; final assessment dependencies J-05, W-03, P-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Component tree and real JSX output; compare key identity on list editing.

**Independent evidence:** Migrate domain UI, preserve functions; debug bad keys and accidental render side effects. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-LEARN](#source-react-learn).

### R-02 — State and events

**Depth:** implement-debug; **scope:** core; **units:** RE-02.

**Subskills:** state snapshots; updater queues/batching; immutable updates; derived state; controlled inputs; event vs render behavior; reset/preserve identity.

**Placement:** minimum prior introduction units RE-01; earlier same-unit foundations none; final assessment dependencies R-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Snapshot/update timeline with actual clicks and controlled form.

**Independent evidence:** Repair stale setter/duplicated derived state; test rapid updates and reset behavior. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-LEARN](#source-react-learn).

### R-03 — Reducers, context and ownership

**Depth:** design-test-operate; **scope:** core; **units:** RE-04, RE-09.

**Subskills:** lifting state; local/shared placement; reducer state transitions; context boundaries; composition vs prop drilling; avoid needless global state.

**Placement:** minimum prior introduction units RE-02, RE-01; earlier same-unit foundations none; final assessment dependencies R-02, P-05. RE-04 introduces ownership/reducers/context after RE-02 and foundational TS at JS-14; typed props/events are introduced at RE-01/02. Advanced P-05/R-03 checks close in RE-09; RE-09 completion is not needed before RE-04.

**Practice:** State ownership graph and real reducer/context example.

**Independent evidence:** Design/test multi-step state transitions and limited shared state; explain tradeoffs without adopting every state library. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-LEARN](#source-react-learn).

### R-04 — Effects, refs and custom hooks

**Depth:** implement-debug; **scope:** core; **units:** RE-03, RE-04.

**Subskills:** rules of hooks; synchronization vs events/derived values; dependencies/cleanup; stale closure; development rechecks; refs/DOM focus; custom hook contracts.

**Placement:** minimum prior introduction units RE-02, JS-08; earlier same-unit foundations none; final assessment dependencies R-02, J-11. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Render/effect/ref timeline linked to cleanup and focus behavior.

**Independent evidence:** Remove unnecessary effect; fix subscription leak/stale closure; test reusable hook and keyboard focus. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-EFFECT](#source-react-effect).

### R-05 — Forms, routes and accessible flows

**Depth:** implement-debug; **scope:** core; **units:** RE-05, RE-09.

**Subskills:** controlled/uncontrolled boundaries; validation/errors; nested routes/params/history; focus/navigation/unsaved edits; loading/empty/error states; error boundaries and their limits.

**Placement:** minimum prior introduction units RE-02, RE-03, JS-16; earlier same-unit foundations none; final assessment dependencies R-02, R-04, W-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real routed CRUD/form and accessible status/error recovery.

**Independent evidence:** Build no-hint route/form flow; test back/focus/invalid input; distinguish render boundary from async/event error handling. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-LEARN](#source-react-learn), [REACT-API](#source-react-api).

### R-06 — Async data and optimistic behavior

**Depth:** implement-debug; **scope:** core; **units:** RE-06, RE-09.

**Subskills:** fetch lifecycle/cancellation/races; cache/invalidation principles; loading/retry; optimistic update and rollback; mutations vs queries; stale data and consistency.

**Placement:** minimum prior introduction units RE-03, JS-08; earlier same-unit foundations none; final assessment dependencies R-04, W-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Controlled fixture delays/failures and optimistic state timeline.

**Independent evidence:** Fix race and failed optimistic mutation; independently test cache invalidation/retry without exact-library mandate. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-EFFECT](#source-react-effect), [REACT-API](#source-react-api).

### R-07 — Measured UI performance

**Depth:** design-test-operate; **scope:** core; **units:** RE-07.

**Subskills:** profiling/render causes; stable identity; memo/useMemo/useCallback when measured; list/windowing awareness; accessibility during optimization.

**Placement:** minimum prior introduction units RE-04, RE-06; earlier same-unit foundations none; final assessment dependencies R-03, R-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Profiler before/after, real slow fixture and render graph.

**Independent evidence:** Explain bottleneck evidence, improve it, rerun behavior/a11y checks; no blanket memoization. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-API](#source-react-api), [MDN-WEB](#source-mdn-web).

### R-08 — Concurrent and modern React boundaries

**Depth:** implement-debug; **scope:** core; **units:** RE-10.

**Subskills:** Suspense supported data/code patterns; transitions/urgent vs nonurgent state; concurrent rendering mental model; modern form/action/optimistic APIs awareness; compiler and legacy API distinctions.

**Placement:** minimum prior introduction units RE-06, RE-07; earlier same-unit foundations none; final assessment dependencies R-06, R-07. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Small supported lazy/Suspense/transition example with visible fallback and version notes.

**Independent evidence:** Debug misplaced Suspense/transition assumptions; test responsive pending/error flow; justify modern API only on verified toolchain. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: browser-react.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-API](#source-react-api).

### R-09 — Server rendering boundary literacy

**Depth:** explain-read; **scope:** required-awareness; **units:** RE-11.

**Subskills:** CSR vs SSR/static rendering; hydration and mismatch causes; server/client components and serialization; secrets/server-only code; RSC framework/stability awareness.

**Placement:** minimum prior introduction units RE-01, RE-03; earlier same-unit foundations none; final assessment dependencies R-01, R-04, P-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Architecture and hydration trace from supplied output; executable client example, actual server lab later in NO-13.

**Independent evidence:** Identify server-only leakage/hydration mismatch and choose client/server boundary in design review; no browser SSR verification claim. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** React stage assesses boundary literacy; actual Node-backed SSR/hydration practice is required in B-11 after server foundations. RSC implementation is ecosystem-specific awareness, not a forced Next.js architecture. Runtime: concept-preview.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-HYDRATE](#source-react-hydrate), [REACT-RSC](#source-react-rsc).

### R-10 — React independent quality closure

**Depth:** design-test-operate; **scope:** core; **units:** RE-08, RE-12.

**Subskills:** behavioral component/integration/user tests; typed UI; effect cleanup; accessible routes; fixture vs browser E2E limits; production artifact verification; cumulative explanation.

**Placement:** minimum prior introduction units RE-04, RE-05, RE-06, RE-07, RE-10, RE-11; earlier same-unit foundations none; final assessment dependencies R-03, R-05, R-06, R-07, R-08, R-09, P-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** New enhancement plus seeded regression and local production build.

**Independent evidence:** Independent build/debug/test/review of selected capstone plus focused modern-boundary lab; CP-RE CRUD alone insufficient. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-web.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-LEARN](#source-react-learn), [REACT-API](#source-react-api), [CI](#source-ci).

## React Native

### N-01 — Native runtime and shared types

**Depth:** implement-debug; **scope:** core; **units:** RN-01, RN-03.

**Subskills:** native vs DOM; toolchain/emulator/device; TS/domain reuse; platform adapters; environment/version support and debug vs release.

**Placement:** minimum prior introduction units RE-08; earlier same-unit foundations none; final assessment dependencies R-10. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Boundary visual, shared pure transform in-course, actual native hello screen locally.

**Independent evidence:** Run declared native target; typecheck shared model and explain why browser layout cannot verify native APIs. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [TS](#source-ts), [RN-CORE](#source-rn-core).

### N-02 — Native components and layout

**Depth:** implement-debug; **scope:** core; **units:** RN-02, RN-03.

**Subskills:** View/Text/Image/input; styling/Flexbox/density; safe areas; touch targets; keyboard avoidance; accessibility labels/focus; platform differences.

**Placement:** minimum prior introduction units RN-01; earlier same-unit foundations none; final assessment dependencies N-01. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Native layout and interaction on emulator/device with in-course concept equivalent.

**Independent evidence:** Build/test readable labeled CRUD form on declared target; fix clipped keyboard input and inaccessible touch control. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [RN-CORE](#source-rn-core).

### N-03 — Screen and app lifecycle

**Depth:** implement-debug; **scope:** core; **units:** RN-04.

**Subskills:** navigation/routes/params; back/unsaved edits; deep links; app foreground/background; screen focus vs mount; subscription cleanup.

**Placement:** minimum prior introduction units RN-02, RE-03; earlier same-unit foundations none; final assessment dependencies N-02, R-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Screen/app-state trace, native back and synthetic deep-link interaction.

**Independent evidence:** Debug duplicate subscriptions/wrong route input; validate deep-link params and preserve unsaved work through lifecycle. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [RN-SEC](#source-rn-sec), [RN-CORE](#source-rn-core).

### N-04 — Native lists and performance

**Depth:** implement-debug; **scope:** core; **units:** RN-03, RN-10.

**Subskills:** virtualized lists/keys; frame budget; JS vs UI work; images/assets; profiling release vs debug; measured render/memory improvements.

**Placement:** minimum prior introduction units RN-02, RE-07; earlier same-unit foundations none; final assessment dependencies N-02, R-07. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Long synthetic list, JS/UI-frame visual and actual release-mode profiling.

**Independent evidence:** Repair dropped-frame/list-identity issue and compare measurements; preserve accessibility and item state. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-PERF](#source-rn-perf).

### N-05 — Native persistence and offline state

**Depth:** implement-debug; **scope:** core; **units:** RN-05.

**Subskills:** storage adapter limits; async loading/failure; schema migration; offline/cache vs authority; restart/recovery; shared TS models.

**Placement:** minimum prior introduction units RN-01, JS-07; earlier same-unit foundations none; final assessment dependencies N-01, J-10. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Native save/restart/migrate synthetic records; data ownership diagram.

**Independent evidence:** Reject corrupt schema safely; test migration and offline edits/recovery without fabricated server sync. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-SEC](#source-rn-sec), [RN-INTRO](#source-rn-intro).

### N-06 — Native networking and retry

**Depth:** implement-debug; **scope:** core; **units:** RN-06.

**Subskills:** fixture/mock-service before Node; emulator/device addressing; fetch/cancellation/timeouts/retry; offline/error state; transport/TLS context; platform network configuration.

**Placement:** minimum prior introduction units RN-05, JS-08, RE-06; earlier same-unit foundations none; final assessment dependencies N-05, W-04, R-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Actual minimal supplied mock-service and declared device/emulator; no learner Node prerequisite.

**Independent evidence:** Diagnose host-address/network failure, bounded retry and cancellation; integrate real backend later in NO-06. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [RN-SEC](#source-rn-sec).

### N-07 — Permissions, device capabilities and secure data

**Depth:** implement-debug; **scope:** core; **units:** RN-06, RN-09.

**Subskills:** permission request/deny/revoke; capability/platform checks; secure credential storage vs ordinary storage; no embedded secrets; privacy/minimum data; safe auth/deep-link boundaries.

**Placement:** minimum prior introduction units RN-04, RN-05; earlier same-unit foundations N-06; final assessment dependencies N-03, N-05, N-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Focused synthetic device capability/permission lab; threat/data-flow diagram.

**Independent evidence:** Handle denied/revoked permission and unavailable device; test protected-storage adapter behavior and explain platform/library limits. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-SEC](#source-rn-sec), [RN-PERM](#source-rn-perm).

### N-08 — Gestures, animation and assets

**Depth:** implement-debug; **scope:** core; **units:** RN-10.

**Subskills:** gesture/touch coordination; animation fundamentals; UI/JS work limits; cancellation/lifecycle; reduced motion; asset/image sizing and font/loading.

**Placement:** minimum prior introduction units RN-02, RN-04, RN-03; earlier same-unit foundations none; final assessment dependencies N-02, N-03, N-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Native bounded gesture/animation with reduced-motion alternative and actual output.

**Independent evidence:** Implement/test dismissible interaction; fix stuck gesture or interrupted animation without hurting keyboard/a11y. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [RN-PERF](#source-rn-perf), [RN-ANIM](#source-rn-anim).

### N-09 — Native architecture awareness

**Depth:** explain-read; **scope:** required-awareness; **units:** RN-12.

**Subskills:** new architecture/Fabric/TurboModules concepts; native module/codegen interop; JS/native boundary costs; platform dependencies/compatibility; legacy migration reading.

**Placement:** minimum prior introduction units RN-01, RN-03; earlier same-unit foundations none; final assessment dependencies N-01, N-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Version-labelled architecture diagram and small supplied interop trace.

**Independent evidence:** Explain when platform capability requires native interop and a compatibility spike; distinguish old/new architecture instructions. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Writing custom native modules is a specialized extension; recognition and safe integration boundaries are required before shipping native dependencies. Runtime: concept-preview.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-INTRO](#source-rn-intro), [RN-ARCH](#source-rn-arch).

### N-10 — Native testing and debugging

**Depth:** design-test-operate; **scope:** core; **units:** RN-07, RN-12.

**Subskills:** native logs/build errors; unit/typed-domain/component/integration tests; mocks vs target/device checks; crash diagnosis; E2E and platform difference coverage.

**Placement:** minimum prior introduction units RN-04, RN-05, RN-06, RN-10; earlier same-unit foundations none; final assessment dependencies N-03, N-05, N-06, N-07, N-08. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Seeded actual native build/runtime defect and passing/failing synthetic tests.

**Independent evidence:** Diagnose defect independently, prove fix on declared emulator/device and document mock-only gaps. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-TEST](#source-rn-test).

### N-11 — Native build and distribution

**Depth:** design-test-operate; **scope:** core; **units:** RN-11.

**Subskills:** Android/iOS config/package ids/versions; debug/release; signing/key hygiene; build artifacts; distribution/store/update/privacy basics; compatibility and rollback limitations.

**Placement:** minimum prior introduction units RN-06, RN-07, RE-12; earlier same-unit foundations none; final assessment dependencies N-07, N-10, P-06. Native test/debug basics are introduced in RN-07 before RN-11 release practice. RN-12 closes cumulative N-10/N-11 evidence afterward; no RN-12 pass is required to enter RN-11.

**Practice:** Local release build/install on supported target; inspect both platforms signing/distribution flow with supplied artifacts.

**Independent evidence:** Build/test declared native release artifact and document release/update recovery; explain other-platform constraints; no paid account or actual store upload. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-IOS](#source-rn-ios), [RN-ANDROID](#source-rn-android), [RN-SEC](#source-rn-sec).

### N-12 — Native cumulative gate

**Depth:** design-test-operate; **scope:** core; **units:** RN-08, RN-12.

**Subskills:** independent native enhancement; restart/offline/lifecycle/security/a11y/performance; signed/build provenance; unsupported target and skip evidence.

**Placement:** minimum prior introduction units RN-07, RN-11; earlier same-unit foundations none; final assessment dependencies N-09, N-10, N-11. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Chosen native companion plus focused capability/release labs; retained web project.

**Independent evidence:** Pass observed declared-target checks and explain platform distinctions; no-hint debug task; skipped native evidence never becomes competency pass. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-native.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [RN-TEST](#source-rn-test), [RN-PERF](#source-rn-perf).

## Node.js and cumulative professional work

### B-01 — Node runtime and modules

**Depth:** implement-debug; **scope:** core; **units:** NO-01.

**Subskills:** process/env/config; Node vs browser APIs; ESM/CJS/package resolution; async event loop phases awareness; events/EventEmitter error lifecycle; TS build/runtime distinction.

**Placement:** minimum prior introduction units JS-14, JS-08, RE-08; earlier same-unit foundations none; final assessment dependencies P-03, J-11, R-10. Minimum prior knowledge is JS/TypeScript and React async/model work. Native practical pass is never a Node-entry prerequisite; skipped native knowledge may be introduced through supplied concept/reference bridges while native competence stays unperformed.

**Practice:** Actual Node script and module/event failures; process/API boundary visual.

**Independent evidence:** Run/debug typed local script, validate config and clean listeners; distinguish skipped native learner progression from prerequisites supplied. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-LEARN](#source-node-learn), [NODE-API](#source-node-api).

### B-02 — I/O, paths and binary data

**Depth:** implement-debug; **scope:** core; **units:** NO-02.

**Subskills:** fs/path and safe paths; asynchronous I/O; Buffer/encoding; bounded reads/writes; atomic/recoverable updates; errors and handle cleanup.

**Placement:** minimum prior introduction units NO-01, JS-13; earlier same-unit foundations none; final assessment dependencies B-01, J-12. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real synthetic files/buffers and injected failures with trace.

**Independent evidence:** Repair path traversal/encoding/partial-write bug; test cleanup and restart without data loss. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-API](#source-node-api), [NODE-SEC](#source-node-sec).

### B-03 — HTTP and API contracts

**Depth:** implement-debug; **scope:** core; **units:** NO-03, NO-04.

**Subskills:** request/response lifecycle; methods/status/headers; REST boundaries; JSON/schema validation; error model; pagination/filter/sort; idempotency; cancellation; versioned contracts.

**Placement:** minimum prior introduction units NO-01, JS-08, RE-01; earlier same-unit foundations none; final assessment dependencies B-01, W-04, P-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Actual loopback HTTP requests and contract/error-flow visual.

**Independent evidence:** Independent typed CRUD API tests with malformed/oversized input, pagination and duplicate retries; no simulated server evidence. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-LEARN](#source-node-learn), [NODE-API](#source-node-api).

### B-04 — Relational design and SQL

**Depth:** design-test-operate; **scope:** core; **units:** NO-09.

**Subskills:** tables/keys/relationships; SELECT/join/group/aggregate; CRUD/constraints/nulls; transactions/isolation awareness; indexes/query plans; migrations/seed; parameterized queries.

**Placement:** minimum prior introduction units NO-02, NO-03; earlier same-unit foundations none; final assessment dependencies B-02, B-03. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Required local SQL lab with synthetic related tables; relation/transaction/index visual.

**Independent evidence:** Design schema, write joins/transaction and migration; demonstrate rollback and injection-safe query; inspect index tradeoff. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [SQLITE](#source-sqlite), [PG](#source-pg), [OWASP-SQL](#source-owasp-sql).

### B-05 — Persistence and recovery

**Depth:** design-test-operate; **scope:** core; **units:** NO-05, NO-09.

**Subskills:** file vs relational repository tradeoffs; migration/versioning; initialization; concurrency/transactions; backup/restore verification; corruption/recovery; schema contract.

**Placement:** minimum prior introduction units NO-02; earlier same-unit foundations B-04; final assessment dependencies B-02, B-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real restart, migration failure and backup/restore of local dataset.

**Independent evidence:** Recover tested synthetic data and compare invariants; selected capstone storage may differ but SQL lab remains required. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-API](#source-node-api), [SQLITE](#source-sqlite), [PG](#source-pg).

### B-06 — Authentication and authorization

**Depth:** design-test-operate; **scope:** core; **units:** NO-10.

**Subskills:** authn vs authz; local synthetic identity; vetted password hashing; sessions/cookies vs tokens; expiry/revocation; least privilege/ownership; secrets and secure config; login abuse controls/CSRF context.

**Placement:** minimum prior introduction units NO-03, NO-09, JS-16; earlier same-unit foundations none; final assessment dependencies B-03, B-04, W-05. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Focused local auth/session/ownership lab and threat flow; no production account/cloud prerequisite.

**Independent evidence:** Reject cross-user access, expired/revoked credentials and unsafe requests; test hashing/session controls; explain token tradeoffs and no homebrew crypto. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [OWASP-AUTH](#source-owasp-auth), [OWASP-PASS](#source-owasp-pass), [OWASP-SESSION](#source-owasp-session).

### B-07 — Backend security and resource limits

**Depth:** design-test-operate; **scope:** core; **units:** NO-07, NO-10.

**Subskills:** input validation/query/path safety; rate/size/time limits; dependency risks; secret redaction; CORS not auth; safe errors; TLS/proxy trust/context; threat model.

**Placement:** minimum prior introduction units NO-03, NO-09; earlier same-unit foundations B-06; final assessment dependencies B-03, B-04, B-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Synthetic adversarial requests and resource exhaustion with safe bounded limits.

**Independent evidence:** Fix ownership/injection/DoS/logging defect; verify rejection and preserved service; explain deployment TLS boundary. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-SEC](#source-node-sec), [OWASP-SQL](#source-owasp-sql), [OWASP-SESSION](#source-owasp-session).

### B-08 — Streams, jobs and concurrency

**Depth:** implement-debug; **scope:** core; **units:** NO-11.

**Subskills:** read/write streams and backpressure; pipeline/error/abort/cleanup; bounded queues/jobs; retries/idempotency; event loop blocking; workers/processes awareness; graceful resource use.

**Placement:** minimum prior introduction units NO-02, NO-03, JS-17; earlier same-unit foundations none; final assessment dependencies B-02, B-03, J-13. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real streaming fixture and slow consumer, queue/backpressure visual.

**Independent evidence:** Repair memory growth or leaked handle; implement bounded retry job and test cancellation/shutdown; justify worker boundary. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-STREAM](#source-node-stream), [NODE-API](#source-node-api).

### B-09 — Service testing and observability

**Depth:** design-test-operate; **scope:** core; **units:** NO-07, NO-12.

**Subskills:** unit/integration/realHTTP/DB tests; fixture/mocks limits; structured logs/redaction/request IDs; metrics and basic traces; profiling/debugging; typed contracts.

**Placement:** minimum prior introduction units NO-09, NO-10, JS-09; earlier same-unit foundations none; final assessment dependencies B-05, B-07, B-08, P-04. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Real API/database failure injection, correlated log/metric trace.

**Independent evidence:** Diagnose latency or data defect; tests reproduce it; log/metrics prove fix without leaking identities/secrets. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-TEST](#source-node-test), [NODE-SEC](#source-node-sec), [NODE-API](#source-node-api).

### B-10 — Service delivery and operation

**Depth:** design-test-operate; **scope:** core; **units:** NO-12.

**Subskills:** production build/config/env; CI checks/artifacts; loopback production-mode rehearsal; process lifecycle/health; graceful shutdown; deployment/monitoring/rollback/runbook; backup/restore; dependency upgrades.

**Placement:** minimum prior introduction units NO-07, RE-12; earlier same-unit foundations none; final assessment dependencies B-09, P-06. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Local production-mode start/stop/update/failure/recovery; diagram optional reverse proxy/TLS/cloud boundaries.

**Independent evidence:** Operate/recover service from documented runbook, verify artifact/health/restore and rollback plan; external hosting not required. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-PROD](#source-node-prod), [NODE-SEC](#source-node-sec), [CI](#source-ci).

### B-11 — Actual server-rendered React lab

**Depth:** implement-debug; **scope:** core; **units:** NO-13.

**Subskills:** server rendering/static output; hydration; server/client data/secret boundary; mismatch/error handling; RSC integration constraints literacy.

**Placement:** minimum prior introduction units NO-03, NO-10, RE-11; earlier same-unit foundations none; final assessment dependencies B-03, B-07, R-09. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Actual local Node rendering plus browser hydration; requests/output compared; RSC optional ecosystem exercise.

**Independent evidence:** Build/debug/test SSR/hydration mismatch and safe data serialization with real local server; no forced Next.js or RSC framework. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** missing; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [REACT-HYDRATE](#source-react-hydrate), [REACT-RSC](#source-react-rsc), [NODE-API](#source-node-api).

### B-12 — Integrated clients and backend

**Depth:** implement-debug; **scope:** core; **units:** NO-06.

**Subskills:** web/native adapters; server source of truth vs cache; CORS/credentials; versioned TS contracts; offline/errors/retry; local fixture replacement.

**Placement:** minimum prior introduction units NO-03, NO-05, NO-10, JS-08, RE-06; earlier same-unit foundations none; final assessment dependencies B-03, B-05, B-06, W-04, R-06. Web/backend integration can be independently passed with shared web/HTTP knowledge. Native integration is additional actual-target evidence when tooling is present; N-06 practical pass is never required to complete Node web scope. Native competence stays unperformed when skipped.

**Practice:** Actual server + web and supported-native client; data ownership/request sequence visual.

**Independent evidence:** Test integration/restart/contract failure; web-only learner can pass assessed Node scope with native checks explicitly unperformed. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-API](#source-node-api), [MDN-CORS](#source-mdn-cors), [RN-SEC](#source-rn-sec).

### B-13 — Cumulative independent professional assessment

**Depth:** design-test-operate; **scope:** core; **units:** NO-08, NO-14.

**Subskills:** design/build/debug/test/secure/deliver/maintain; requirements/tradeoffs; no-hint defect; PR/review/docs/runbook; SQL/auth/SSR focused labs; retained domain/workspaces.

**Placement:** minimum prior introduction units NO-12, NO-13, NO-06; earlier same-unit foundations none; final assessment dependencies B-10, B-11, B-12. Teach only necessary earlier subskills first; deeper mapped units and final family evidence are revisited later. Author actual lesson/subskill prerequisite edges before publication; unit/family declarations alone cannot pass release.

**Practice:** Selected capstone plus required focused labs and later unseen cumulative challenge.

**Independent evidence:** Demonstrate all core and required-awareness skills with assessed evidence; checkpoints/counts/navigation cannot substitute. Apply to the chosen capstone where natural; otherwise retain the focused synthetic lab and explain the boundary.

**Boundary/rationale:** Required for independent application work in the selected stack. Runtime: local-node.

**Baseline coverage:** partial; now explicitly specified. Authored / implemented / verified: not-authored / not-implemented / not-verified.

**Sources:** [NODE-TEST](#source-node-test), [GIT](#source-git), [CI](#source-ci).

## Source baselines

Official/primary pages opened live by Codex on 2026-10-01; named sections delimit breadth. These sources do not prove project coverage, approve a library/version or replace independent authoring/toolchain review. References are concise topic mappings, not copied textbooks.

<a id="source-mdn-js"></a>

- **MDN-JS**: [Guide chapter map: grammar/types, control flow, loops, functions, operators, collections, objects/classes, async, iteration and resources](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide). Checked 2026-10-01.

<a id="source-mdn-loops"></a>

- **MDN-LOOPS**: [for, while, do...while, break, continue, for...in and for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration). Checked 2026-10-01.

<a id="source-mdn-class"></a>

- **MDN-CLASS**: [Declaring a class, class features, extends/inheritance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes). Checked 2026-10-01.

<a id="source-mdn-web"></a>

- **MDN-WEB**: [Semantic HTML, CSS styling/layout, JavaScript, accessibility, frameworks and version control](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core). Checked 2026-10-01.

<a id="source-mdn-fetch"></a>

- **MDN-FETCH**: [Making requests, checking responses, canceling requests, credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). Checked 2026-10-01.

<a id="source-mdn-cors"></a>

- **MDN-CORS**: [Origin boundaries, preflight and credentialed requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS). Checked 2026-10-01.

<a id="source-react-learn"></a>

- **REACT-LEARN**: [Describing UI, Adding Interactivity, Managing State](https://react.dev/learn). Checked 2026-10-01.

<a id="source-react-effect"></a>

- **REACT-EFFECT**: [Refs, effects, cleanup, unnecessary effects, dependencies and custom hooks](https://react.dev/learn/escape-hatches). Checked 2026-10-01.

<a id="source-react-api"></a>

- **REACT-API**: [Hooks, components and APIs; modern and legacy distinctions](https://react.dev/reference/react). Checked 2026-10-01.

<a id="source-react-hydrate"></a>

- **REACT-HYDRATE**: [Hydrating server-rendered HTML and mismatch handling](https://react.dev/reference/react-dom/client/hydrateRoot). Checked 2026-10-01.

<a id="source-react-rsc"></a>

- **REACT-RSC**: [Server Components, server/client boundaries and framework integration stability](https://react.dev/reference/rsc/server-components). Checked 2026-10-01.

<a id="source-rn-intro"></a>

- **RN-INTRO**: [Introduction and linked core components/platform guides](https://reactnative.dev/docs/getting-started). Checked 2026-10-01.

<a id="source-rn-perf"></a>

- **RN-PERF**: [JS/UI frame rates, release mode and list/render performance](https://reactnative.dev/docs/performance). Checked 2026-10-01.

<a id="source-rn-test"></a>

- **RN-TEST**: [Static analysis, unit/integration/component and end-to-end testing](https://reactnative.dev/docs/testing-overview). Checked 2026-10-01.

<a id="source-rn-sec"></a>

- **RN-SEC**: [Storage, authentication/deep links, networking and platform-sensitive security](https://reactnative.dev/docs/security). Checked 2026-10-01.

<a id="source-rn-ios"></a>

- **RN-IOS**: [Release build, configuration and distribution prerequisites](https://reactnative.dev/docs/publishing-to-app-store). Checked 2026-10-01.

<a id="source-rn-android"></a>

- **RN-ANDROID**: [Signing key, release build and distribution](https://reactnative.dev/docs/signed-apk-android). Checked 2026-10-01.

<a id="source-node-learn"></a>

- **NODE-LEARN**: [Getting started, asynchronous work, files, HTTP, testing and diagnostics](https://nodejs.org/learn). Checked 2026-10-01.

<a id="source-node-api"></a>

- **NODE-API**: [Process, modules, events, fs/path/buffer, HTTP and diagnostics API map](https://nodejs.org/api/). Checked 2026-10-01.

<a id="source-node-stream"></a>

- **NODE-STREAM**: [Backpressure, pipeline, errors and cleanup](https://nodejs.org/api/stream.html). Checked 2026-10-01.

<a id="source-node-test"></a>

- **NODE-TEST**: [Test runner, assertions, mocking and coverage](https://nodejs.org/api/test.html). Checked 2026-10-01.

<a id="source-node-sec"></a>

- **NODE-SEC**: [Threats, resource exhaustion, dependencies and production safeguards](https://nodejs.org/learn/getting-started/security-best-practices). Checked 2026-10-01.

<a id="source-node-prod"></a>

- **NODE-PROD**: [Development/production environment distinction](https://nodejs.org/learn/getting-started/nodejs-the-difference-between-development-and-production). Checked 2026-10-01.

<a id="source-ts"></a>

- **TS**: [Handbook map: everyday types, functions/objects, generics, classes and modules](https://www.typescriptlang.org/docs/handbook/intro.html). Checked 2026-10-01.

<a id="source-ts-narrow"></a>

- **TS-NARROW**: [Control flow narrowing, type guards, discriminated unions and exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html). Checked 2026-10-01.

<a id="source-git"></a>

- **GIT**: [Git Basics, Branching, Distributed Git and Git Tools](https://git-scm.com/book/en/v2). Checked 2026-10-01.

<a id="source-sqlite"></a>

- **SQLITE**: [SQL syntax: SELECT, joins, constraints, indexes and transactions](https://www.sqlite.org/lang.html). Checked 2026-10-01.

<a id="source-pg"></a>

- **PG**: [SQL Language and Advanced Features tutorial](https://www.postgresql.org/docs/current/tutorial.html). Checked 2026-10-01.

<a id="source-owasp-auth"></a>

- **OWASP-AUTH**: [Authentication responses, controls and recovery considerations](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Checked 2026-10-01.

<a id="source-owasp-pass"></a>

- **OWASP-PASS**: [Vetted password hashing and storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Checked 2026-10-01.

<a id="source-owasp-session"></a>

- **OWASP-SESSION**: [Session lifecycle, cookies and session security](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Checked 2026-10-01.

<a id="source-owasp-sql"></a>

- **OWASP-SQL**: [Parameterized queries and safe input handling](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html). Checked 2026-10-01.

<a id="source-owasp-xss"></a>

- **OWASP-XSS**: [Context-sensitive output encoding and safe sinks](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html). Checked 2026-10-01.

<a id="source-ci"></a>

- **CI**: [Continuous integration purpose and build/test workflow](https://docs.github.com/en/actions/get-started/continuous-integration). Checked 2026-10-01.

<a id="source-rn-core"></a>

- **RN-CORE**: [Core components, list views, platform APIs and linked capabilities](https://reactnative.dev/docs/components-and-apis). Checked 2026-10-01.

<a id="source-rn-arch"></a>

- **RN-ARCH**: [New Architecture overview and native interop boundaries](https://reactnative.dev/architecture/landing-page). Checked 2026-10-01.

<a id="source-rn-anim"></a>

- **RN-ANIM**: [Animation composition, native driver and lifecycle](https://reactnative.dev/docs/animated). Checked 2026-10-01.

<a id="source-rn-perm"></a>

- **RN-PERM**: [Permission request/deny results and platform-version context](https://reactnative.dev/docs/permissionsandroid). Checked 2026-10-01.

<a id="source-ts-generic"></a>

- **TS-GENERIC**: [Generic type parameters and constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html). Checked 2026-10-01.

