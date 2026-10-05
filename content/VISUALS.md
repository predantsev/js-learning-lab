# Visual step-throughs — authoring guide

This guide is for everyone who writes `kind: visual` blocks in a `lesson.yaml` — lesson authors and
LLM agents alike. It is exact on purpose: the compiler refuses a block that does not match it.

A visual is a **controllable step-through tied to real code or data** (REQ-006). Every visual has
steps; every step has a bilingual caption; the whole block has a bilingual `textEquivalent`. The
player gives the learner Previous / Next / Reset / Play, keyboard control, a live-announced caption,
reduced-motion support and a text version of the picture. You never write any of that — you write
the data below and the player renders it in all three application styles.

Implementation: `shared/visuals/` (validation + compilation), `shared/visuals/tracer.js` +
`sandbox/trace-runtime.js` (execution tracer), `app/src/visuals/` (players).

## 1. The block

```yaml
- id: scope-steps                      # stable block id (kebab-case)
  kind: visual
  visual: code-trace                   # one of the eight kinds below
  title: { uk: "…", en: "…" }
  textEquivalent:                      # REQUIRED: a complete prose alternative of the WHOLE visual
    uk: "…"
    en: "…"
  spec:                                # the kind-specific part, documented per kind
    …
```

Rules that apply to every kind:

- **Bilingual text** is always `{ uk: "…", en: "…" }`, both non-empty. Captions and `textEquivalent`
  are prose; Ukrainian keeps technical terms (call stack, heap, microtask, commit) in English.
- **Captions are inline Markdown**: `code`, **bold**, *italic*, links. No headings, lists or
  paragraphs. They are converted to HTML at build time.
- **Labels drawn inside pictures** (diagram nodes/edges/groups, sequence actors/messages/notes) are
  **plain text**: Markdown is not interpreted there. A label may be a plain string (used for both
  languages — identifiers, code) or a bilingual object.
- **Every step shown to the learner has a caption.** A caption is the per-step text equivalent; the
  block fails to compile when a visible step lacks one.
- **Nothing is faked.** `code-trace` steps come from running the code; `event-loop` console claims
  are checked against a real run; `pipeline` results are computed by running the stage functions;
  `git-graph` states come from a simulator. If your text disagrees with reality, the build says so.
- `file:` paths are relative to the lesson directory and may not leave it.
- `textEquivalent` describes the whole mechanism in prose (what changes, in which order, and why),
  not "a diagram of X".
- **Width:** pictures (`diagram`, `sequence`, `memory-graph`) must fit the lesson column — see
  section 6 before you draw anything wide.

### 1.1 Localized example text: `strings`

Example UI text inside a visual (a greeting, a product name, a reminder) follows the lesson
language, exactly like in `example`/`exercise` blocks: put a bilingual `strings` table on the block
and write `%%key%%` wherever the text appears. Identifiers and comments stay English.

```yaml
- id: greeting-strings
  kind: visual
  visual: code-trace
  strings:
    greeting: { uk: "Привіт", en: "Hello" }
  title: { uk: "…", en: "…" }
  textEquivalent: { uk: "… «%%greeting%%» …", en: "… \"%%greeting%%\" …" }
  spec:
    file: visuals/greeting.js          # contains: const greeting = "%%greeting%%";
    captions:
      - at: { line: 2 }
        text: { uk: "`greeting` — `\"%%greeting%%\"`.", en: "`greeting` is `\"%%greeting%%\"`." }
```

- `%%key%%` is resolved **in the code file, in every string of the spec** (labels, items, `fn`/`show`
  sources, `log` claims, captions) and in the block's `title` and `textEquivalent`; each language
  gets its own text.
- The visual is **compiled once per language**: the Ukrainian version really runs the Ukrainian
  text, the English version the English one. When the two differ, the compiled spec is
  `{ kind, byLang: { uk: spec, en: spec } }` (one JSON structure; the player picks the language);
  when they come out identical, it stays the plain spec.
- **Both languages must show the same steps** (same number of steps, and for `code-trace` the same
  line and kind at each step), so the learner keeps the step when switching language. A `%%key%%`
  that changes what the code does (`if (name.length > 4)`, a loop over the letters) is refused:
  `the uk and en versions have different numbers of steps …`. A caption that matches in only one
  language is reported with `(with the en strings)`.
- A `%%key%%` with no entry in `strings` fails the build (`placeholder %%name%% has no entry in
  strings`), with or without a table.

Sample: `content/_samples/visuals/code-trace-strings.yaml`.

## 2. Preview and check

```sh
# validate + compile every sample block (content/_samples/visuals) and write the demo data
node scripts/content/compile-visual-samples.mjs
# only check, write nothing
node scripts/content/compile-visual-samples.mjs --check
# print the steps the tracer generates for one file (what captions can bind to)
node scripts/content/compile-visual-samples.mjs --trace path/to/file.js
# see the result in the browser (after `npx vite build` + `node scripts/build-sandbox.mjs`)
npm start   # then open /visuals-demo.html on the app host (http://js-learning-lab.localhost:<port>/visuals-demo.html)
```

The demo page has language / style / appearance / column-width / reduced-motion switches and takes
query parameters (`?only=code-trace&lang=en&style=editorial&appearance=dark&width=420&reduced=1`;
`only` takes a kind or a sample id). The compile command prints the steps of every sample, whether it
has one version per language and the natural width of a diagram (with a warning above 450 px).

Programmatic use (the content build does exactly this):

```js
import { validateVisualSpec, compileVisual, specForLang } from './shared/visuals/index.js';
const issues = validateVisualSpec(block.visual, block.spec);          // static, sync, [{ path, message }]
const { spec, issues } = await compileVisual(block.visual, block.spec, {
  readFile: async (relative) => fs.readFile(path.join(lessonDir, relative), 'utf8'),
  mdInline: (md) => marked.parseInline(md),
  langs: ['uk', 'en'],
  strings: block.strings,                                             // optional, section 1.1
});
const shown = specForLang(spec, 'en');                                // the spec the player renders in English
```

`spec` (when `issues` is empty) is a self-contained JSON object; the player receives it unchanged.

## 3. Captions bound to generated steps (`code-trace`, `memory-graph` with `from: trace`)

When steps are generated by execution you bind captions to them:

```yaml
captions:
  - at: { line: 3 }              # the 1st time a step runs line 3
    text: { uk: "…", en: "…" }
  - at: { line: 3, hit: 2 }      # the 2nd time line 3 runs
    text: …
  - at: { line: 5, hit: every }  # every step on line 5 gets this caption (loops)
    text: …
  - at: { line: 7, kind: return }   # restrict to a step kind (see below), hits count within that kind
    text: …
  - at: { step: 12 }             # the 12th generated step, 1-based (fragile: prefer line/hit)
    text: …
```

Step kinds: `stmt` (a statement is about to run), `cond` (a loop/if condition is evaluated),
`iter` (a `for…of` / `for…in` iteration starts), `update` (a `for` update expression), `call`
(a function was entered, its parameters are bound), `return` (a function returns — the step
carries the value), `throw` (an exception leaves a function or the program), `await`, `resume`,
`end` (the program finished).

Each step is the state **before** the highlighted line runs. A `return` step is emitted after the
return value was computed; a `return` line therefore has no `stmt` step of its own. A `throw`
statement produces a `stmt` step and then a `throw` step.

What the steps show, exactly as the engine does it:

- **Per-iteration bindings:** every iteration of `for (let i …)` has its own `i`, and a closure
  created in an iteration keeps that iteration's binding — also when it is called after the loop
  (`f = () => j` created when `j` is 1 shows and returns 1, not the final value).
- **Waiting frames:** while a call inside `return a(b(x))` (or inside the collection of a
  `for…of`) runs, the waiting caller frame points at that `return` (or loop) line; a `return` step
  shows the scope of the `return` statement (a block or loop that already ended is gone).
- **Function names:** an anonymous function or arrow gets the name the engine infers from where it
  is written — `const double = (n) => …` is `ƒ double` in the heap and in the console, as is
  `{ greet: () => … }` → `greet`. Display names such as `map callback` appear only in the call stack.

`--trace file.js` prints every generated step with its line, kind, hit number, frame and
variables (`null` prints as `null`, `undefined` as `undefined`, objects as `#id`) — use it to pick
the moments worth a caption.

Compile errors you will see: `no step runs line N; lines with steps: …`, `line N runs 2 times,
hit 5 does not exist`, `step 99 does not exist`, `step 7 (line 4, stmt) has no caption` (only in
`steps: all` mode).

## 4. The eight kinds

### 4.1 `code-trace` — real execution, line by line

**Use for:** scope and closures, hoisting and the temporal dead zone, call stack and recursion,
loops and per-iteration bindings, reference vs value when the *flow* matters, exceptions, async
functions (`await` suspends and resumes the frame).
**Do not use for:** a static picture of memory (→ `memory-graph`), queue mechanics (→ `event-loop`),
code that needs the DOM, `fetch`, modules or packages (the trace runs in an isolated JavaScript
environment with `console`, timers and `Promise` only).

The player shows the code with the current line, variables grouped by scope (block → function →
**captured scopes** of a closure → module), the call stack, a heap of objects/arrays/functions with
stable `#ids` (two bindings to one object show the same id) and the console.

A panel that stays **empty in every shown step is not drawn**, and one line under the code names
it instead (`Not shown, empty in every step: call stack (no function is called), heap (no
objects).`), so the picture and its text version say the same. Empty means: Variables — no scope
has a variable; Call stack — nothing but the program (module) frame is ever on it, i.e. no function
is called; Heap — no object, array or function exists. If a caption talks about the call stack or
the heap, the example must actually call a function or create an object.

```yaml
spec:
  file: visuals/counter.js       # or  code: |  (inline source; one of the two)
  steps: captioned               # default: only captioned steps are shown.  all: every step is shown
  maxSteps: 400                  # optional cap (2–2000); the trace is refused when cut unless allowTruncated: true
  allowError: true               # default true: a program that throws is fine (the throw is a step)
  captions: […]                  # section 3
```

Traced file rules: plain `.js`/`.mjs`, no `import`/`export` (keep the example self-contained), no
`document`/`fetch`. Timers and promises work (`setTimeout` fires in virtual time, deterministic).
Loops are guarded (2 s budget) and the whole trace is capped at `maxSteps`.

Complete example — `content/_samples/visuals/code-trace.yaml` with `closure-counter.js`:

```yaml
spec:
  file: closure-counter.js
  captions:
    - at: { line: 10 }
      text:
        uk: "Програма починається з рядка 10: `makeCounter` вже існує (оголошення функцій піднімаються), а `clicks` і `views` ще **uninitialized**."
        en: "The program starts at line 10: `makeCounter` already exists (function declarations are hoisted); `clicks` and `views` are still **uninitialized**."
    - at: { line: 1, hit: 1 }
      text: { uk: "Виклик `makeCounter(0)` створює новий scope…", en: "Calling `makeCounter(0)` creates a new scope…" }
    - at: { line: 7, hit: 1 }
      text: { uk: "Повертається функція `increment` (#2 у heap) …", en: "The function `increment` is returned (#2 in the heap) …" }
    - at: { line: 3, hit: 1 }
      text: { uk: "Серед змінних видно **захоплений scope** …", en: "Among the variables you see the **captured scope** …" }
    - at: { line: 18, kind: end }
      text: { uk: "Програма завершилася …", en: "The program finished …" }
```

Common mistakes: captioning a line that never runs (`no step runs line N`); forgetting that a
`for` line produces several `cond`/`update` hits per iteration; captioning `return` lines by
`hit` without `kind` (the hit numbers mix `stmt` steps of other statements on that line only when
several statements share a line — keep one statement per line); an inline `code:` with
`import`; a long loop without `maxSteps` thought (the default 400 is per *step*, not per line).

**Run time (learner code) — "Step through":** every `browser-js` workspace has a **Step through**
button next to Run. It runs the learner's current files off screen with the same tracer and opens
the **Steps** result tab: the trace in the code-trace player, in the learner's language, starting
at step 1 (captions are `null`; the player names the line, "Line N"). The tab says so clearly when
the code has a syntax error (with the diagnostic), when the trace was cut at 400 steps, when the
program stopped with an uncaught error (the last step shows where) and when no steps were recorded.
Tracing never changes the learner's files. Under the hood: `useRunner().start({ …, trace: true })`
→ `prepareRun({ …, options: { trace: true, extraPlugins: [traceBabelPlugin] } })` → `trace` event →
`traceToSpec(trace, files, entry)`. With a map of files, each step shows the file it runs in
(an imported module runs before the module that imports it; an inline `<script type="module">` of
an HTML page appears as `index.html.inline-N.js` with its own code — `prepareRun` returns those
sources as `meta.inlineModules`; classic, non-module scripts are not traced). Both functions are
exported from `shared/visuals/index.js`.

### 4.2 `memory-graph` — bindings, values and references

**Use for:** identity vs copy, shallow vs deep copy, mutation through a shared reference,
`const` with a mutable object, arrays of objects, `Map`/`Set` contents.
**Do not use for:** execution order (→ `code-trace`), class hierarchies (→ `diagram`).

The player draws bindings on the left, heap objects on the right and arrows for every reference;
objects referenced twice visibly share one box. Changed items are marked; a text version lists the
same state.

Two ways to author it:

**A. Authored states** (full control, no execution):

```yaml
spec:
  code: |                        # optional: shown above the graph; a state may highlight a line
    const wish = { name: "Lamp", price: 45, tags: ["home"] };
    const same = wish;
    same.price = 60;
  states:
    - caption: { uk: "…", en: "…" }
      line: 1                    # optional highlighted line of `code`
      bindings:                  # at least one; names unique; kind is let|const|var|param|function|class|import (default let)
        - { name: wish, kind: const, value: { ref: obj1 } }
      heap:                      # id → entry; ids: letters, digits, "-", "_"
        obj1: { kind: object, props: { name: "Lamp", price: 45, tags: { ref: tags } } }
        tags: { kind: array, items: ["home"] }
    - caption: …
      line: 3
      bindings:
        - { name: wish, kind: const, value: { ref: obj1 } }
        - { name: same, kind: const, value: { ref: obj1 } }
      heap:
        obj1: { kind: object, props: { name: "Lamp", price: 60, tags: { ref: tags } } }
        tags: { kind: array, items: ["home"] }
      changed: [obj1]            # optional: what to mark; default = diff against the previous state
```

Values: YAML literals (`5`, `"text"`, `true`, `null`), the strings `"undefined"` and
`"uninitialized"`, or `{ ref: heapId }`. **Objects and arrays never appear inline** — they live in
`heap` with an id, because identity is the whole point. Heap entry kinds: `object` (`props`, optional
`ctor`), `array` (`items`), `function`/`class` (`name`), `map` (`entries: [[k, v], …]`), `set` (`items`).
Every state repeats the full picture (bindings + heap); the compiler does not carry anything over.

**Holes of a sparse array:** `{ empty: true }` among an array's `items` is an index that was never
assigned — not `undefined` (`1 in list` is `false`). It is drawn as `<empty>`, the same way a real
trace shows `[1, , 3]`, and it is accepted only among array items:

```yaml
heap:
  r1: { kind: array, items: ["water", { empty: true }, "stretch"] }   # const list = ["water", , "stretch"];
```

**Widths follow the content:** the variable and heap columns are as wide as their longest text in
any step and either language (so the picture never changes size while stepping), up to what the
panel can show at the legible minimum scale (section 6). Long identifiers are never shortened; when
the column is too narrow for a long *value*, only the value is cut with `…` — the full text stays in
a tooltip and in the text version. The code panel above the graph behaves the same way: its font
shrinks to fit the longest line (not below 0.72 rem), then long lines wrap under their line number
instead of scrolling sideways. So keep the names your lesson uses; there is no need to shorten them.
Sample: `content/_samples/visuals/memory-graph-sparse.yaml`.

**B. From a trace** — the states are the captioned steps of a real run:

```yaml
spec:
  from: trace
  file: visuals/copy.js          # the code-trace fields: file|code, captions, steps, maxSteps
  captions:
    - at: { line: 2 }
      text: …
```

Common mistakes: an inline object in `value` (error: *put the object in "heap"*); a `ref` to an id
that is not in this state's `heap`; forgetting to repeat unchanged bindings in the next state
(they would disappear from the picture); `changed` naming something that is not in the state.

### 4.3 `pipeline` — a collection through array stages

**Use for:** `filter`, `map`, `flatMap`, `reduce`, `find`, `some`, `every`, `sort`, `toSorted`
and chains of them: what each stage receives, what its function answers for every item, what
comes out — including where a stage stops early, which comparisons a sort makes and how a stage
fails. This is the kind used by the approved `filter` reference design.
**Do not use for:** loops with side effects (→ `code-trace`), nested data transformations that
are not an array method.

Results are **computed by running your functions** on your input (in an isolated environment),
so the per-item answers are never wrong — but the captions still are your words: say *why*.

```yaml
spec:
  code: |                        # optional: the chained expression as the learner would write it
    const names = wishes
      .filter((item) => item.price <= 100)
      .map((item) => item.name);
  input:
    label: { uk: "Твій wishlist", en: "Your wishlist" }
    items:                       # JSON values (objects, numbers, strings…)
      - { name: "Lamp", price: 45 }
      - { name: "Monitor", price: 240 }
    show: "item => `${item.name} €${item.price}`"   # optional: how an item is labelled (function source)
    caption: { uk: "…", en: "…" }                   # the first step shows the input
  stages:
    - op: filter                 # filter | map | flatMap | reduce | find | some | every | sort | toSorted
      fn: "(item) => item.price <= 100"             # function source, exactly what the learner writes
      label: "item.price <= 100"                    # optional short display of fn (default: fn)
      perItem: true                                 # optional: one step per item, then a summary step
      caption:                                      # with perItem: a template, placeholders {item} {result} {index} {count} {acc} {error}
        uk: "`filter` перевіряє елемент {index} з {count}: `{item}` → **{result}**."
        en: "`filter` tests item {index} of {count}: `{item}` → **{result}**."
      summary: { uk: "…", en: "…" }                 # required with perItem: caption of the stage-result step
    - op: map
      fn: "(item) => item.name"
      show: "name => name"                          # optional label function for this stage's outputs
      caption: { uk: "…", en: "…" }
    - op: reduce
      fn: "(sum, item) => sum + item.price"
      initial: 0                                    # required for reduce
      caption: …
  result:
    label: { uk: "Залишилося {count} назви", en: "{count} names remain" }   # optional, {count} = items in the final output
```

Steps: input → (per item when `perItem`, per comparison when `perComparison`) → one result step per
stage. After `reduce`/`find`/`some`/`every` the output is a single value; another stage may follow
only when that value is an array. The stage caption (or the `summary`) may use `{count}` (items the
stage received), `{tested}` (items its function was called for), `{skipped}` (items never
checked), `{comparisons}` (sort/toSorted), `{result}` (the output, or the number of output items)
and `{error}`.

**Stopping early — `find`, `some`, `every`.** These stop at the deciding item, like the real
methods: `find` at the first `true` (its output is that item, or `undefined`), `some` at the first
`true` (output `true`), `every` at the first `false` (output `false`). With `perItem` there is one
step per item *actually tested*; on the deciding step the items after it are marked *not checked*
and the output appears (before that it reads *not decided yet*).

```yaml
    - op: some
      fn: "(habit) => habit.missed > 2"
      perItem: true
      caption: { uk: "`some` перевіряє {item} → **{result}**.", en: "`some` checks {item} → **{result}**." }
      summary: { uk: "Перевірено {tested} з {count}, {skipped} — ні.", en: "{tested} of {count} checked, {skipped} never." }
```

**Every comparison of a sort — `perComparison`.** `sort` (sorts the array in place) and `toSorted`
(returns a sorted copy; the stage is shown under its own name) can show one step per call of the
comparator — the real calls the engine makes (V8, as in Chrome and Node; another engine may compare
other pairs, with the same result for a consistent comparator). Each step marks the two items `a`
and `b`, the value returned and what it means (below zero: `a` first; above zero: `b` first; zero:
keep their order). Placeholders: `{a}` `{b}` `{result}` `{index}` `{count}`; `summary` is required;
at most 40 comparisons (use few items). A sort cannot use `perItem`.

```yaml
    - op: toSorted
      fn: "(a, b) => a - b"
      perComparison: true
      caption: { uk: "Порівняння {index} з {count}: `a = {a}`, `b = {b}` → **{result}**.", en: "Comparison {index} of {count}: `a = {a}`, `b = {b}` → **{result}**." }
      summary: { uk: "Усього порівнянь: {comparisons}.", en: "Comparisons in total: {comparisons}." }
```

**Bilingual item labels.** `show` (of the input or of a stage) may be `{ uk, en }` — one label
function per language; `{item}`/`{result}` in captions then take the label of their language.
(Data inside the items can also be localized with `strings` and `%%key%%`, section 1.1.)

```yaml
    show:
      uk: "habit => `${habit.id} · пропущено ${habit.missed}`"
      en: "habit => `${habit.id} · missed ${habit.missed}`"
```

**A stage that throws — `throws: true`.** When the error is the point of the example, mark the
stage: the step of the item that failed and the result step show the **real** error name and
message of the run (`TypeError: Cannot read properties of undefined (reading 'trim')`), the items
after it are *not checked*, and the chain ends there (no stage may follow). A stage marked
`throws: true` that does not throw is a build error, and so is a stage that throws without it.

```yaml
    - op: map
      fn: "(wish) => wish.note.trim()"
      throws: true
      perItem: true
      caption: { uk: "`map` для `{item}` → **{result}**.", en: "`map` for `{item}` → **{result}**." }
      summary: { uk: "Ланцюжок зупинився: **{error}**.", en: "The chain stopped: **{error}**." }
```

Samples: `pipeline.yaml`, `pipeline-some.yaml`, `pipeline-tosorted.yaml`, `pipeline-throws.yaml` in
`content/_samples/visuals/`.

Common mistakes: `fn` that is not a function expression (write `item => …` or `function (item) {…}`);
a `show` for the input that is then reused on `map` outputs (it is not — map/flatMap/reduce outputs
use the stage's own `show` or a generic format); `perItem`/`perComparison` without `summary`;
`reduce` without `initial`; a function that throws for some item without `throws: true` (the build
reports *the function threw while running*); `perItem` on a sort (use `perComparison`).

### 4.4 `event-loop` — stack, queues and the order of output

**Use for:** `setTimeout` vs promise ordering, microtask draining, "0 ms is not now",
`async`/`await` as promise continuations, event handlers as tasks.
**Do not use for:** anything whose *output order* you cannot state exactly — the build verifies it.

You author the step sequence (what is on the stack and in each queue, what line is highlighted,
what the console printed during the step). The compiler **runs the code** and refuses the block if
the console lines claimed by your steps, in order, differ from the real output.

```yaml
spec:
  file: visuals/order.js         # or code: |
  steps:
    - line: 1                    # optional highlighted line
      caption: { uk: "…", en: "…" }
      stack: ["script"]          # REQUIRED on every step, bottom → top; [] when empty
      webApis: []                # optional: timers, fetches… waiting outside the engine
      microtasks: []             # optional, front → back
      tasks: []                  # optional, front → back
      log: "start"               # optional: console text produced during THIS step (string or list)
    - …
    - stack: []                  # the last step must show an empty stack and empty queues
      caption: …
```

Console text rules (what `log` must match): `console.log` arguments joined by one space; strings
raw (no quotes), numbers as JavaScript prints them, `true`/`false`/`null`/`undefined`, arrays as
`[1, "a"]`, objects as `{ a: 1, b: "s" }`, functions as `ƒ name`. Nested strings inside arrays and
objects are quoted. `console.error`/`warn` lines count too.

The player highlights what entered a region since the previous step. The code runs with
`console`, timers and promises; timers fire in virtual time in the order a browser would fire them.

Common mistakes: claiming `promise` before `end` (synchronous code always finishes first); listing
a timer callback in `tasks` while it is still waiting in `webApis`; a `log` with quotes around a
string; leaving the stack non-empty on the last step; code that never finishes (timers limited to
200 callbacks).

### 4.5 `diagram` — boxes, groups and labelled edges

**Use for:** architecture and boundaries (client/server/database, native/web, same-origin),
state machines, prototype chains, component trees, ownership and data flow.
**Do not use for:** ordered message exchanges (→ `sequence`), anything with a time axis.

```yaml
spec:
  layout: lr                     # lr (default): groups become columns left→right · tb: rows · grid: every node sets col/row
  groups:                        # optional frames
    - { id: client, label: { uk: "Браузер", en: "Browser" } }
  nodes:
    - { id: ui, group: client, label: { uk: "React-компонент", en: "React component" } }
    - { id: fetch, group: client, label: "fetch(\"/api/wishes\")", shape: round }   # shapes: box round pill cylinder note
    - { id: db, group: data, label: "wishes", shape: cylinder, w: 120 }           # w: width override in px
  edges:
    - { id: http, from: fetch, to: route, label: "HTTP", kind: both }   # kinds: arrow (default) both line dashed; id defaults to "from->to"
  hidden: [db]                   # optional: ids that appear only from a step that lists them in "show"
  steps:
    - caption: { uk: "…", en: "…" }
    - caption: …
      highlight: [ui, fetch, ui->fetch]   # node and edge ids
      dim: [route, db]
      show: [db]
      annotate:
        - { id: http, text: { uk: "інша машина", en: "another machine" } }
```

Layout is computed at build time: ungrouped nodes are layered by their edges, grouped nodes sit in
their group's column, nodes in one column stack in order. Give long labels a `w` or shorten them;
labels are single-line plain text. Edge labels and every step's annotations (in both languages)
are kept inside the picture: an annotation under the bottom row makes it taller, a label that would
cross the left or right edge is moved inward, and only a label wider than the whole picture makes
it wider (`shared/visuals/kinds/diagram-geometry.js`). Groups stacked on top of each other (`layout: tb`, or a `grid`
that puts groups in rows) get room for both frames and the lower group's heading.

Width (section 6): every column costs its widest node (96–240 px, about 8 px per label character)
plus 96 px of gap, so three groups side by side (`layout: lr`) are usually too wide for the lesson
column — `layout: tb` or a `grid` that stacks the groups keeps the picture narrow; the sample
`diagram.yaml` stacks browser / server / database at 444 px.

Common mistakes: `show` for an id that is not in `hidden`; a hidden id that no step ever shows;
Markdown in node labels (it is printed literally); two edges between the same nodes without
explicit `id`s.

### 4.6 `sequence` — actors, lifelines, one message per step

**Use for:** HTTP request/response, CORS preflight, an auth session flow, SSR + hydration, the
React Native bridge, any protocol where *who talks to whom, in which order* is the lesson.
**Do not use for:** static structure (→ `diagram`), a single function's control flow (→ `code-trace`).

```yaml
spec:
  actors:                        # left → right, at least two
    - { id: page, label: { uk: "Код сторінки", en: "Page code" } }
    - { id: browser, label: { uk: "Браузер", en: "Browser" } }
    - { id: api, label: "api.example" }
  intro: { uk: "…", en: "…" }    # optional: a first step that shows only the actors
  messages:                      # one step per message, in time order
    - from: page
      to: browser
      label: "fetch(\"https://api.example/wishes/7\", { method: \"PUT\" })"   # plain text, keep it short
      kind: sync                 # sync (default, solid) · async (open arrow) · return (dashed) · note (box on the "from" lifeline)
      caption: { uk: "…", en: "…" }
      note: { uk: "…", en: "…" } # optional small box under the arrow (details, headers)
```

Labels wrap automatically but long labels make tall rows: put details in `note`, keep the label
to the message name. A `note` kind message must have `to` equal to `from`.

Width (section 6): actor labels wrap to two lines of about 14 characters (20 when a label needs
it), and every actor column is as wide as the longest of those lines in either language (96–150 px)
plus 40 px between actors: 40 + n × (actor width) + (n − 1) × 40 px. Three actors fit 450 px only
while every wrapped actor line has at most 13 characters (actor width ≤ 110 px); a 15-character line
makes three actors 465 px, a fourth actor or long actor labels make it wider still. The compiled
spec records `layout.width` and the content validator warns above 450 px (a warning also with
`--release`, for now).

### 4.7 `git-graph` — commits, branches, HEAD and the working tree

**Use for:** commit/branch/merge (fast-forward or merge commit), conflicts and their resolution,
rebase, reset, restore, reading a history.
**Do not use for:** remote/push/pull flows (not simulated; use `sequence` for the network part).

You write git operations; the simulator produces every state and refuses impossible ones.

```yaml
spec:
  steps:
    - op: init                   # always first; { branch: main } optional; args: "-b main" shows
                                 #   `git init -b main` (a -b name also names the branch)
      caption: { uk: "…", en: "…" }
    - op: commit
      message: "add wishlist page"
      files: [index.html, wishes.js]     # optional: files in the commit (added to whatever is staged)
      id: c1                             # optional: default c1, c2, …
      caption: …
    - op: modify   { files: [wishes.js] }        # working tree change
    - op: stage    { files: [wishes.js] }        # git add (files must be modified)
    - op: branch   { name: feature/filter }      # creates at HEAD and checks out (checkout: false to stay)
    - op: checkout { name: main }                # or { commit: c2 } → detached HEAD
    - op: merge    { from: feature/filter, conflict: [wishes.js] }   # fast-forward when possible (noFastForward: true to force a merge commit); conflict pauses the merge
    - op: resolve  { files: [wishes.js] }        # conflicted → staged; the next commit becomes the merge commit
    - op: rebase   { onto: main }                # replays the branch commits as c3′, c4′…; old ones are shown orphaned
    - op: reset    { to: c1, mode: hard }        # soft | mixed (default) | hard
    - op: restore  { files: [a.js] }             # discard a working tree change; staged: true unstages
    - op: note                                   # no change, caption only
```

(Each op is a list item with its own `caption`; the inline `{ … }` above only abbreviates the fields.)
The player shows the command for each step (`git switch -c …`, `git merge … # CONFLICT`), the graph
with lanes per branch, branch pointers with `HEAD → name`, and the working tree in three columns
(modified / staged / conflicted).

Common mistakes: `stage` of a file that was never `modify`-ed; `merge` of a branch already merged;
`commit` while files are conflicted; the first step not being `init`.

### 4.8 `render-timeline` — React renders as snapshots

**Use for:** "state is a snapshot", stale closures in handlers and effects, batching of several
`setState` calls, effect run/cleanup order, why a render happens (props, state, parent).
**Do not use for:** DOM event mechanics (→ `event-loop`), component tree structure (→ `diagram`).

```yaml
spec:
  component: Counter
  screen: dom                    # optional: dom | native — the commit panel is "Screen (DOM)" or
                                 #   "Screen (native views)"; default native in React Native lessons
                                 #   (stage RN or a concept-preview block), dom elsewhere
  code: |                        # the component source (JSX), shown with the current line
    function Counter() {
      const [count, setCount] = useState(0);
      …
    }
  steps:
    - phase: render              # render | commit | effect | event | idle
      render: 1                  # render number (1, 2, …, consecutive); commit/effect carry the number of the last render
      line: 2
      reason: { uk: "перший показ", en: "first display" }
      snapshot: { props: {}, state: { count: 0 } }    # values THIS render sees (JSON)
      caption: { uk: "…", en: "…" }
    - phase: commit
      render: 1
      dom: "<button>Clicked 0</button>"                # what the screen shows after the commit
      caption: …
    - phase: effect
      render: 1
      cleanup: []                                      # previous render's cleanups (run first)
      run: ["document.title = `Clicked 0`"]
      caption: …
    - phase: event
      name: click
      line: 4
      sees: { count: 0 }                               # the handler closure's snapshot
      actions: ["setCount(0 + 1)", "setCount(0 + 1)"]
      queued: { count: 1 }                             # what React will apply (optional)
      caption: …
    - phase: render
      render: 2
      reason: { uk: "…", en: "…" }
      snapshot: { state: { count: 1 } }
      caption: …
```

The player shows a timeline of phases, the snapshot the current render sees, the handler's view
and queued updates on an event step, the effects on an effect step, and the screen as of the last commit
(the DOM, or native views in a React Native lesson; `dom` is the text of that panel either way).

Common mistakes: render numbers out of order; `commit`/`effect` with a render number that is not
the last `render` step; an `effect` step with neither `run` nor `cleanup`; `sees` values that
contradict the snapshot of the render the handler was created in.

## 5. Accessibility and UI (what the player guarantees)

- All controls are real buttons; with the player focused, `←`/`→` step, `Home` resets, `End` jumps
  to the last step. Previous is disabled on the first step, Next on the last. Play advances every
  1.6 s; any manual action pauses it.
- The caption region is `aria-live="polite"`; the step counter is text. Pictures (SVG) carry a
  text summary and a "Text version" disclosure with the same state as a list/table; the variables
  of a `code-trace` are real tables.
- No information is given by color alone (markers, text, strikethrough) or by hover alone.
- `prefers-reduced-motion` (and the app's `reducedMotion` flag) disables every animation; changes
  are still marked. Otherwise a change gets a single 0.45 s highlight, never an infinite pulse.
- Everything is styled through the design tokens, so the three application styles and light/dark
  appearance apply automatically; layouts work from 420 px to 760 px of column width (section 6).
- Panels that stay empty for a whole `code-trace` are not drawn and are named in one line instead;
  code panels never scroll sideways (smaller font, then wrapped lines under their number).

UI strings live in `app/src/visuals/labels.ts` (`VISUAL_LABELS.uk` / `.en`).

## 6. Width: the lesson column

A visual usually sits in the lesson column next to the workspace. In the narrowest two-column
layout (a 1100 px window) that column is **about 420 px** in every style, which leaves **about
340 px** for a picture inside the player (measured in the app: Calm Studio 339 px, Editorial
370 px, Dev workspace 344 px at 1100 px; 384 / 420 / 347 px at 1280 px; it only grows in wider
windows, and below 1100 px the lesson column takes the whole width). Keep the **natural width** of
`diagram`, `sequence` and `memory-graph` pictures within **about 420–450 px**:

- The player draws a picture at its natural width when the column allows it and otherwise **scales
  it down to the available width — but never below 75 %** (the legible minimum: 13 px labels render
  at ~9.8 px, the smallest 11 px labels at ~8.3 px). 450 px × 75 % ≈ 338 px still fits the ~340 px;
  `tests/e2e/app-layout.test.mjs` checks that room in all three styles from 1100 px up.
- Only a picture whose 75 % is wider than the panel makes the panel scroll sideways — avoid that:
  the learner then sees part of the picture at a time.
- Natural widths: `diagram` — `compile-visual-samples.mjs` prints it and warns above 450 px, and the
  content validator warns about every lesson diagram whose compiled `layout.width` is above 450 px
  (an error with `--release`); the compiled spec has `layout.width` (section 4.5 has the rules of thumb). `sequence` —
  40 + n × (actor width) + (n − 1) × 40 px, actor width 96–150 px (section 4.6); the compiled spec has `layout.width`
  and the validator warns above 450 px. `memory-graph` —
  the columns follow their texts and never get wider than the panel allows at 75 % (section 4.2).
- Code panels (in every kind) need no width planning: they shrink the font and wrap long lines.
- Check the result in the demo page at `?width=420`; the end-to-end test
  `tests/e2e/visuals.test.mjs` checks the samples there.

## 7. Choosing a kind — quick table

| Concept | Kind |
|---|---|
| scope, closure, TDZ, call stack, recursion, loops | `code-trace` |
| reference vs copy, mutation, shallow/deep, sparse arrays | `memory-graph` |
| filter / map / reduce / find / some / every / sort chains | `pipeline` |
| setTimeout vs promise, microtasks, async order | `event-loop` |
| client/server/DB, same-origin, native vs web, trees, state machines | `diagram` |
| request/response, CORS preflight, auth, SSR + hydration, RN bridge | `sequence` |
| commit, branch, merge, conflict, rebase, reset | `git-graph` |
| React render snapshot, batching, effects/cleanup, stale closure | `render-timeline` |
