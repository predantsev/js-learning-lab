# Content and learner-data contracts

Proposed logical contracts; serialization and storage engine are undecided. Mandatory acceptance criteria in REQUIREMENTS.md apply regardless of implementation; REQ-025 and explicitly optional designs remain conditional recommendations. Version each contract and validate it before loading. Do not confuse example records with an implemented schema.

## Lesson content

Each Lesson contains stable id, stage, curriculumUnitIds, prerequisites, concepts, estimated duration, lesson kind, ordered blocks, runtime kind, exercise ids, capstone transfers, checkpoint references, review links and content version. Each localized object requires uk and en; canonical example names/identifiers and comments are English, while instructional explanations and authored example/capstone UI text follow the lesson language. Share code logic and use localized string resources where appropriate. Switching language never forcibly rewrites arbitrary learner code/comments. Keep translations attached to semantic IDs rather than duplicating entire lesson structures.

Block kinds: concise explanation, meaningful visual step-through, analogy/limitations, prediction, executable example, exercise, capstone transfer, assessment, local instructions, review. A block has stable id, localization, glossary refs, accessibility text, related code/files, alternate-language support and optional bookmark target. Visual definitions include controllable states, data/code relationships, reduced-motion behavior and a text equivalent. Do not require graphics merely to decorate every block.

Each Exercise has stable id, objectives, instructions in both languages, starter file tree, editable/protected files, runtime capability declaration, test/oracle definition, expected observable behavior, allowed alternate solutions, fixtures, error feedback, reset policy, and hint ladder. Hint fields are nudge, explanation and separately accessed full solution. Include a no-hint independent task at each curriculum unit/checkpoint. Evaluate behavior rather than exact source matching. Prediction answers remain hidden until submission. Hidden tests must not read private platform/profile state through learner code.

LocalTask includes prerequisite/tool versions, OS/target applicability, files/checkpoint, ordered actions, expected commands/output/UI behavior, verification steps, common failure causes, troubleshooting and recovery. Commands must be verified on the supported environment before release. No invented “works everywhere” command.

GlossaryTerm has stable id, canonical English technical name, uk/en definitions, aliases, cross-links, concise context and optional visual example. Tooltips are keyboard/focus accessible, dismissible and do not trap focus.

CapstoneTemplate contains option id, shared-objective mapping, domain model, synthetic fixtures, checkpoints, starter manifests, migration notes, expected outcomes and equivalent assessment rubric. Checkpoint manifests include content/schema version, files/hashes and provenance. Source data must not contain private production records. Reuse domain-independent components/contracts with small domain variants where feasible; universal generation from a single template is a recommendation to evaluate, not a required architecture.

## Minimum authoring and completeness gate

For each unit in CURRICULUM.md:

1. Cover every named outcome with one or more published lessons, prerequisites and observable assessment.
2. Every instructional lesson follows explanation → prediction → run/change → independent exercise → transfer (or a specific next checkpoint link). First explanations do not assume unknown concepts.
3. Every executable example and starter actually runs under its declared runtime; every assessment has passing and deliberately failing fixtures, and accepts at least one valid variant when meaningful.
4. Difficult concepts (minimum scope/closure, reference identity/mutation, event loop/async, render/state snapshot, effect/cleanup, client/server and native/web boundary) get code-linked step-through, text equivalent and bounded analogy.
5. Both languages have documented instructional and linguistic review for natural meaning and glossary consistency. Record whether the reviewer was an agent or a human and the limitations of agent-only review. Human review is recommended, not a mandatory external dependency. Missing strings are release failures, not silent English fallbacks presented as full localization.
6. Provide quizzes, coding, debugging, optional hints, independent no-hint work and a later retrieval exercise. Every capstone has complete starters, checkpoint tests and local instructions where required.
7. Validate internal links, bookmarks, runtime labels, accessible visual controls and all necessary bundled assets. Record reviewer/check results and content version.

A content inventory must map unit → lesson IDs → objective IDs → assessment IDs → checkpoint IDs → uk/en review → runtime verification. No fixed lesson count implies completion; all listed outcomes and these quality gates must pass. Stubs, TODO pages and quiz-only treatments fail the gate.

## Local learner data

| Entity | Required logical fields / boundaries |
|---|---|
| Profile | Local opaque id, language/preferences, active project id and schema version; separate profiles recommended, no cloud identity required. |
| Workspace | Project id, capstone id, versioned files (path/content), project-specific transfer/checkpoint progress, checkpoint base/provenance, last saved revision and recovery snapshots; changing capstone creates a new workspace, never overwrites the old. After export, platform copies/snapshots are not the authoritative local files. Reject unsafe paths on export/import. |
| Progress | Global lesson/active block/step and knowledge evidence, separately scoped projectId transfer/checkpoint evidence; status, skip events/reason (including unavailable native tooling), assessment attempts/content version, completion time and verification source. General learning persists across project changes, but new-project transfer work is not pre-passed. |
| Assistance | Exercise id, hint levels viewed, solution viewed and relevant attempt id; reading a solution never fabricates passing evidence. |
| Bookmark | Stable block/exercise target, creation time and optional private label; unresolved target retains entry and recovery guidance. |
| Review | Concept/lesson target, last attempt and proposed next-review date; schedule algorithm is a proposal, not surveillance. |
| Execution | Ephemeral run id/status, bounded console/errors, capability policy; executable source saved separately, no automatic indefinite log retention. |
| Backup | Format/schema/content versions, profile/workspace/progress/preferences/bookmarks, integrity metadata and creation time; preview import scope before mutating. |

Approved base lesson-state semantics: unseen, in-progress, skipped, completed. Independent evidence (presentation remains a design choice): self-check passed, exercise passed, transfer verified, hint assisted, solution viewed. Present these plainly; do not claim psychological mastery based on navigation. A skipped topic can later have demonstrated evidence; keep both history and current assessment visible.

## Persistence and migration behavior

Debounced saves may be used, with visible pending/saved/failed status and flush at safe boundaries. Never claim saved before durable write succeeds. Revisioned transactions or recoverable journal prevent partial file/progress updates. If full-profile import is adopted, it validates version/paths/size before apply, offers backup and preserves originals on failure. Data schema migrations are versioned, tested, non-destructive or recoverable; create snapshot before risky upgrade. Content updates do not invalidate old files, silently mark new objectives passed or lose bookmark targets. Browser storage is origin-bound and subject to clearing/quotas: explain this and document the selected portable recovery design; full-profile backup/import remains the REQ-025 recommendation. No platform code may assume Git tracks browser data.

After export, VS Code files are authoritative. Follow the concrete post-export starter/reference, backup, comparison and manual-merge protocol in CURRICULUM.md; optional user-selected snapshot comparison is not bidirectional sync. Automatic replacement applies only to platform-managed copies after preview/consent/snapshot. Small in-course exercise workspaces stay separate and named. Local task evidence records explicit learner confirmation plus any actual check source; no secret local-file inspection is implied. Unavailable native tooling does not prevent Node progression or web integration, and native results remain unperformed/skipped.

## Execution isolation contract

Implementation must choose and document an isolation design before accepting untrusted code. A worker alone does not establish a secure DOM sandbox. Use a capability-limited execution context suitable for each exercise, explicit message schemas and source/origin checks, separated learner and platform storage, and resettable instances. UI code may need sandboxed frames; compute-only code may use workers; these are options, not approved architecture. Do not promise browser sandboxing provides operating-system process isolation.

Define timeout, stop mechanism, maximum output, asset/memory/file limits, import allowlist and network defaults. Proposed baseline: deny network for core exercises, finite execution budgets with configurable values and bounded logs. Test infinite loops, recursion, output flood, prohibited imports, parent-state access, crash and rerun. The controller must remain usable when execution fails. Browser and native/local tooling capability restrictions must be stated separately; local project instructions warn before a command accesses files/network and never run arbitrary learner commands with platform privileges automatically.

Feedback separates syntax/build/runtime/assertion/environment errors. Show original diagnostics verbatim beside localized instructional guidance. Expected success describes observable behavior, not an animation that substitutes for execution. Native/device and server success require the explicit local checks in their task definitions.

## Runtime metadata and early feasibility gates

Runtime kinds: browser-js, browser-react, concept-preview, local-native and local-node; isolated-node is a candidate only after its spike passes. Every Exercise/LocalTask declares runtime kind, API capabilities, actual engine when executable, output/evidence source and unsupported capabilities. Concept-preview exposes its limits beside the result. Native rendering/device APIs and Node-only filesystem/server behavior cannot be marked verified by browser-compatible domain exercises. Real in-course practice remains available in every stage as mapped in CURRICULUM.md.

Before accepting arbitrary learner code or finalizing runner architecture, test real modified multi-file code, learner-visible persistent storage isolated from parent/profile storage, a synchronous runaway DOM example, stop/timeout with a responsive controller, state recovery and clean rerun. Also test parent-state access, output floods and denied capabilities. Spike failure blocks use of that execution design, not all documentation/other safe implementation. Replace the isolation approach or use an explicitly labeled capability-restricted verified execution path with guided local tasks where necessary; do not call a visual simulation a working native/Node runtime or silently turn later practice into reading-only. Record any product limitation and unresolved coverage openly.

For origin-bound storage, decide stable-origin/warning/recovery behavior before writing launch/fallback instructions. Exercise hostname and port changes with saved synthetic files/progress; explain that data may remain at the original origin, not be deleted. Pinning a tested origin and warning before change is a valid candidate; migration/export is another, requiring actual evidence. No unverified cross-origin migration guarantee and no mandatory DB.
