# Verification and release plan

This is a planned test suite, not a passed-test report. Current documentation checks are recorded in STATUS.md. For implementation, record case ID, requirement IDs, commit/content version, OS/browser/native target, exact procedure, expected result, observed result and evidence path. Unsupported or unexecuted cases stay unconfirmed. Use synthetic learner data only.

## Traceable acceptance cases

| Case | Requirement coverage | Procedure and expected result |
|---|---|---|
| V-01 | REQ-001, REQ-002, REQ-008 | Inspect published inventory and navigate entire course; ordered four stages, beginner entry, one track, all unit outcomes/assets/assessments populated in both languages. Run content validators; inspect actual lessons, not only counts. Verify the small HTML/CSS bridge inside JavaScript covers markup/selectors/box-layout/forms/labels before dependent DOM/JSX, with no outside beginner study. |
| V-02 | REQ-003, REQ-010, REQ-033 | Skip a JS topic and its prerequisite work, optionally take self-check, enter next capstone step through separate starter; keep authored files, skipped evidence and passed evidence distinct; revisit later. Repeat boundary skips at each stage, including absent native tooling: continue to Node/web integration, keep native tasks unperformed/skipped, revisit without fake competence. Distinguish learner progression from full-product native verification. |
| V-03 | REQ-004, REQ-024 | Type unsubmitted code, move to a lesson step and restart; saved files/step/capstone/settings return. Simulate write failure and ensure honest unsaved status plus recovery/export. |
| V-04 | REQ-005, REQ-006, REQ-007 | Review each unit's teaching-loop inventory; sample and then execute all tagged difficult step-throughs against real code; prediction, independent task, analogy limitation, later retrieval and accessible equivalent present. |
| V-05 | REQ-009, REQ-010 | Run equivalent CRUD/filter/persistence rubric on all four capstones at each checkpoint; final completion needs only the chosen one. Inspect provenance and retained data/functions through stage changes. Change selected capstone by creating a separate workspace; old project files/progress remain, global learning remains accessible, and new-project transfers/checkpoints are not pre-passed. Check reusable contracts/components without requiring one universal generator. |
| V-06 | REQ-011, REQ-012, REQ-013 | Edit multiple files in side-by-side course workspace, export latest drafts at CP-JS, open in VS Code, install/run using documented commands; verify same domain/data/functionality. Continue capstone locally and small exercises in-course across all stages. Test post-export reference downloads/readable diffs/manual backup/merge with existing learner edits; optionally compare an explicitly selected snapshot. No automatic replacement/local inspection. Full export is an M2 gate, not a mandatory M1 check. |
| V-07 | REQ-014 | Check labels against actual capabilities; run native project on declared emulator/device and record target, then start Node process and send actual HTTP CRUD requests. Browser preview explicitly cannot count as native/server evidence. Before Node curriculum, run RN bundled fixtures/provided minimal mock-service using documented toolchain-specific networking; web-client Node completion works without native tooling, native evidence stays unperformed. Complete product still verifies its supported native workflow/integration. |
| V-08 | REQ-015, REQ-016, REQ-017 | Start fresh Ukrainian, change global language while editing; inspect alternate block language in both directions for explanation/task/hint/glossary. Draft, progress, focus and disclosures survive. Validator plus documented instructional/linguistic review covers all required strings; reviewer type and agent-only limitations are recorded. Check English canonical identifiers/comments and authored UI strings following lesson language, shared logic, and preservation of arbitrary learner comments/code during switches. |
| V-09 | REQ-018, REQ-019, REQ-033 | Fail an exercise and verify no hints/solution automatically appear; voluntarily reveal each level then solution separately. Retry with code untouched; inspect separate evidence for pass and assistance. |
| V-10 | REQ-020 | Bookmark specific explanation/example/exercise, restart and navigate from review collection to exact block; remove; simulate content redirect/missing ID and keep understandable recovery. |
| V-11 | REQ-021, REQ-022, REQ-023 | Run fixtures for real output changes, infinite loop, recursion, output flood, prohibited import/network, parent DOM/storage access and runner crash. Controller stays usable; stop/reset recovers, state preserved and restrictions explained. Include local-runtime boundary review. Explicit M1 spike: persistent learner-visible sandbox storage separated from profile/platform data, plus synchronous runaway DOM code with responsive controller/stop or enforced timeout and fresh rerun. A failed execution design cannot be exposed as verified; validate its replacement/contained fallback and state limitations. No simulated output counts as real execution. |
| V-12 | REQ-024, REQ-025, REQ-026, REQ-029, REQ-032 | Save/restart; backup/import round-trip including files/evidence/preferences; reject corruption, unsafe paths and unsupported schema; test quota and failed migration without destroying originals. Check tracked-file list against runtime paths and synthetic fixture inventory. If DB chosen, test auto-init/seed/restart/restore. Test saved-profile hostname/port changes and selected stable-origin/warning/recovery path; never silently imply data was deleted or promise unverified migration. Full-profile backup/import is conditional, while persistence/recovery checks are mandatory. |
| V-13 | REQ-027, REQ-030 | Clean-clone setup on each declared OS/browser with no existing project cache/config/secret; use only documented prerequisites and short procedure. Verify launch/content and explicit tooling failures. No sibling startup-rules clone, maintainer GitHub account or absolute workstation paths required to run; license/asset publication readiness is recorded separately, without silently choosing a license. |
| V-14 | REQ-023, REQ-028 | After documented install/preparation, disconnect internet and run core content, visuals, code, save/restart and review. Ensure external links/tool downloads are optional or clearly identified as local-task prerequisites. |
| V-15 | REQ-031, REQ-032 | Keyboard-only full lesson; focus/labels/status announcements/contrast/zoom/reduced-motion and text equivalents. Simulate missing content/assets, build failure, runner crash, storage corruption, import/export failure and absent local tools; clear distinct recovery, preserved work, no false success. |
| V-16 | REQ-008, REQ-034 | Trace every REQ ID and curriculum unit to passing evidence; verify no stubs or unavailable downstream sections. Record exclusions, failed/unexecuted checks and supported environment; label release partial until all required gates pass. |

REQ-025 export/import round-trip checks are conditional on adopting that recommendation. Otherwise document and verify the selected portable recovery alternative. Automated scheduling and separate profiles are not mandatory gates.

## Mandatory clean-clone scenario

For every declared supported desktop environment, use a clean clone and synthetic fresh profile. Record prerequisites and commands verbatim in the test report:

1. Install and launch by README; initial seeded course is usable without accounts/secrets/services.
2. Select one capstone, edit/run a real exercise, inspect meaningful live changes and errors/retry.
3. Use both global and per-block languages; reveal nudge/explanation/solution voluntarily; favorite a specific block.
4. Skip prerequisite work, receive a suitable checkpoint and revisit; inspect distinct skipped/passed/assisted evidence.
5. Save/restart, verify code/preferences/progress/bookmarks; verify the adopted portable recovery workflow and its documented limits.
6. Export the same current project, open/run in VS Code and continue the documented checkpoint.
7. Disconnect network after preparation and repeat core content/run/save functions; record optional tooling limitations.
8. Run native and real-server gates only on their declared tooling/target matrix and record actual evidence.

Automated integration/content tests can cover repeatable invariants; instructional/linguistic review, native checks and keyboard usability need explicit evidence. Record agent vs human review; human review is recommended rather than mandatory. Do not add brittle source-shape tests as substitutes for behavior.

## Increment gates

- M0: documentation package consistency and exact scope; no application readiness claim.
- M1: verified architecture slice with real isolated multi-file execution, local persistence, two-language/block switching, hint/bookmark/skip behaviors and one vertical lesson path, plus DEC-02/03/12 feasibility evidence appropriate to that slice. Include representative RN/Node browser-compatible concepts/preview capability labeling without calling native/server stages complete. Only implemented parts of V-02/03/08–15 apply. Full export V-06 belongs to M2; optional full-profile backup is not mandatory M1. Report remaining curriculum absent.
- M2: complete JavaScript curriculum and all four JS capstone starters/checkpoints; same-project VS Code export.
- M3: complete React curriculum and checkpoints; retained domain/data/work.
- M4: complete React Native curriculum and verified native target workflow; browser limitations explicit.
- M5: complete Node.js curriculum, real local API/persistence and integrated selected-domain web/native clients on the product-supported matrix; learner completion can use web only, retaining unperformed native evidence.
- M6: full content/localization/accessibility/offline/recovery/clean-clone matrix and all requirement evidence. Only this gate supports a full-product completion claim.

Ordering increments this way is proposed, not an approved time estimate. Architecture decisions may require an early native/server spike without changing the course teaching order.
