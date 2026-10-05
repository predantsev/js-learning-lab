# Current project state

## Implementation state (2026-10-05): course authored, release partial

The owner authorized implementation of the platform and the complete course on 2026-10-01. Work is tracked by epic [#13](https://github.com/predantsev/js-learning-lab/issues/13) with milestone issues #7 (M1 platform), #8 (M2 JavaScript), #9 (M3 React), #10 (M4 React Native), #11 (M5 Node.js) and #12 (M6 release verification). **All 528 planned lessons in 56 units are authored, validated and independently reviewed, with capstone steps for all four stages. The release is still partial:** native device and emulator evidence, Windows and Linux, human review and the M6 release verification are not done (listed below). The sections after "Next steps" remain the pre-implementation record.

| Milestone | State | What exists |
|---|---|---|
| M1 platform (#7) | Implemented for the measured environment; open items below | Local server, learner store, sandboxed runners, lesson and project workspaces, export, backup, content pipeline and validators |
| M2 JavaScript (#8) | Authored and reviewed | 18 units, 204 lessons, capstone steps JS-01…JS-17 (JS-10 export checkpoint CP-JS) |
| M3 React (#9) | Authored and reviewed | 12 units, 107 lessons, capstone steps RE-01…RE-12 (CP-RE is step RE-08) |
| M4 React Native (#10) | Authored and reviewed; native runs not performed | 12 units, 95 lessons, capstone steps RN-01…RN-08, RN-10, RN-11 (CP-RN is step RN-08; its native-target part not performed) |
| M5 Node.js (#11) | Authored and reviewed | 14 units, 122 lessons, capstone steps NO-01…NO-08, NO-11…NO-13 (CP-NO is step NO-08) |
| M6 release (#12) | Not started | `python3 scripts/validate_competencies.py --release` reports `RELEASE NOT READY: 120 issue(s)`, as it must until the V-18 review |

Lesson counts come from the compiled content (`dist/content/lessons`, after `node scripts/build.mjs`): 376 instructional lessons, 60 assessments, 50 capstone steps, 35 local tasks and 7 review lessons. Units JS-18, RN-09, RN-12, NO-09, NO-10 and NO-14 have no capstone step by design (gates and focused labs).

### Capstone steps

Every step exists in four variants (wishlist, planner, habit tracker, simple expense tracker) with a reference project and tests that the content validator runs.

| Stage | Where the learner works |
|---|---|
| JavaScript | In the platform's project workspace for JS-01…JS-17, except JS-10 (export to a local folder, CP-JS) and JS-15 (local tooling), which are local tasks |
| React | Local: the exported project becomes an esbuild project (`npm start` on `127.0.0.1:4310`) |
| React Native | Local: a separate Expo project `<capstone>-native`; device and emulator steps are recorded as not performed |
| Node.js | Local: a server in `server/` inside the web project (port 4311) |

The project layout decisions are DEC-13…DEC-16 in [DECISIONS.md](DECISIONS.md).

### Verification

Whole-corpus suites, run on commit d5d0636a on 2026-10-05 (macOS 26 arm64, Google Chrome 154, Node.js 25.2.1):

| Command | Last line |
|---|---|
| `node scripts/content/validate.mjs` | `CONTENT VALID: 528 lesson(s), 570 example run(s), 4664 exercise fixture run(s), 483 verified prediction(s), 2193 isolated-node run(s), 200 capstone step variant(s) with 240 capstone run(s), 0 error(s), 8 warning(s)` |
| `node scripts/content/smoke.mjs` | `SMOKE OK: 528 lesson(s), 2768 page view(s), 0 problem(s)` |
| `npm run test:e2e` | `ℹ tests 146` · `ℹ pass 146` · `ℹ fail 0` |

Seven content follow-up commits after d5d0636a (up to d9caec8a) were checked with `validate.mjs --since d5d0636a` (0 errors), unit smoke runs for NO-01…NO-07 and NO-11…NO-14 (`SMOKE OK`) and the end-to-end project tests (17 of 17); the three whole-corpus suites above were not rerun on d9caec8a.

Rerun on 2026-10-05 on the documentation branch (content unchanged since d9caec8a):

| Command | Last line |
|---|---|
| `node scripts/build.mjs` | `content: 528/528 lessons, 1001 glossary terms, version 4594403455aa, 0 issue(s), 8 warning(s)` |
| `npx tsc --noEmit -p app/tsconfig.json` | exit 0 |
| `npm test` | `ℹ tests 182` · `ℹ pass 182` · `ℹ fail 0` |
| `node scripts/content/validate-syllabus.mjs` | `OK: 528 lessons in 56 unit file(s), no errors.` |
| `node scripts/content/validate.mjs --static` | `CONTENT VALID: 528 lesson(s), … 200 capstone step variant(s) with 0 capstone run(s), 0 error(s), 8 warning(s)` |
| `python3 scripts/validate_competencies.py` | `SPECIFICATION PASS: {"competencies": 60, "units": 56, "requirements": 38, "cases": 19}` |

The eight warnings are heuristic checks that were inspected and kept on purpose. Details and verification cases: [evidence/M2-M5](evidence/M2-M5/README.md).

### Competencies

All 60 competency families have every subskill assessed in validated, independently reviewed lessons of all mapped units, and are recorded as authored and implemented in [competencies.json](competencies.json) with their `lesson_ids` and `assessment_ids`. **No family is verified**: evidence paths stay empty until the V-18 review (issue #12).

### Partial and unverified — stated plainly

- **Native evidence: not performed anywhere.** No device or emulator was available; every native task in lessons and steps is recorded as not performed. The supported native workflow still needs an actual run before release.
- **Windows and Linux: unverified.** Where lessons and steps give Windows or Linux variants of commands, none was run. Only macOS with Google Chrome was used.
- **Node.js 22: partly measured.** The executor here was Node.js 25.2.1. Node 22 behaviour was run on official Node.js 22.13.1 or 22.23.3 binaries in the reviews of JS-13, NO-06, NO-07, NO-08, NO-10, NO-11, NO-12, NO-13 and NO-14, while authoring NO-12 and NO-14, and for capstone steps NO-05…NO-08 and NO-11…NO-13. In the other units, and steps NO-01…NO-04, Node 22 behaviour is taken from the Node.js 22 documentation (unconfirmed by a run).
- **No human review.** No teacher, native-speaker editor or real learner has read the lessons; the Ukrainian has had no human linguistic review.
- **Capstone steps were authored and self-tested, not independently reviewed.** Only the lessons had an independent review.
- **Checks are self-assessment.** Deliberate learner code can forge a passing check in both runners; evidence badges are not proof against cheating.
- **Open issues:** #12 (M6 release verification) and #17 (platform follow-ups found while authoring) remain open.
- **No hosted deployment;** it is not authorized.

### M1 platform

Adopted decisions and their rationale are in [DECISIONS.md](DECISIONS.md) ("Adopted during M1 implementation"); measured evidence is indexed in [evidence/M1](evidence/M1/README.md). In short: a zero-dependency Node.js server on loopback (port 7300), a React and TypeScript application, learner data as JSON files under `.learner-data/`, learner code in an opaque-origin sandboxed frame on a separate host, a real Node.js child-process runner for Node lessons, three visual styles, Ukrainian and English everywhere, hints and solutions revealed only on request, bookmarks, skip and revisit, delayed review, glossary, step-through visuals including a tracer for the learner's own code, a project workspace with snapshots and capstone switching, export to a folder or zip, and full-profile backup and restore.

Open M1 items:

- **Security, accepted.** The independent review ([security-review.md](evidence/M1/security-review.md)) fixed one critical and four medium defects, each with a regression test. The two high findings (H-1: the API token is served with the page; H-2: the protection of the platform port from learner Node code is a guard inside the same process) were accepted by the owner on 2026-10-05 because the platform is local-only, bound to loopback and single-user (DEC-19).
- **Environment.** Windows, Linux, Firefox, Safari, screen readers and a run with the network disconnected are unverified. The Node runner has no operating-system isolation layer outside macOS.
- **Embedded browsers.** In one browser embedded in another application, lessons rendered but code did not run: requests for the sandbox frame failed on both sandbox addresses (observed 2026-10-02: `net::ERR_BLOCKED_BY_CLIENT`). Whether that browser can be configured to allow the address is unconfirmed. The application reports the failure and keeps the code.
- **Not performed.** Opening and running an exported project in VS Code (V-06), any native device or emulator run (V-07), V-14 offline run, a clean clone on a second machine (V-13).
- **Known runner limits that lessons describe honestly:** Stop discards console output printed before it; a literal dynamic import of a missing file fails before the run starts; the console is output-only; the inspector is not available in the isolated Node runner.
- **Flaky end-to-end tests under machine load.** Earlier runs had intermittent failures that passed alone; the last whole run on d5d0636a passed 146 of 146. Causes remain unconfirmed.
- **Local registry.** The optional shared port registry on the maintainer workstation was not updated (outside this repository). Port 7300 was confirmed by the owner on 2026-10-05.

### Next steps

1. Open one pull request for the four course stages (`Fixes #8`, `#9`, `#10`, `#11`; refs #12, #13).
2. Platform follow-ups in issue #17.
3. Independent review of the capstone steps; human review of a sample of lessons in both languages; native device or emulator runs; Windows and Linux runs.
4. M6 release verification (issue #12), including V-18 per-subskill evidence.

## Documentation baseline

Updated 2026-10-01 by the primary Codex agent. Requirements baseline 4 is ready to start development in a new authorized session. Current task is public documentation publication only; approved lesson design references are included; application implementation and deployment are deferred.

## Canonical repository and publication

- Public repository: https://github.com/predantsev/js-learning-lab
- Default branch: main; canonical remote: git@github.com:predantsev/js-learning-lab.git.
- Documentation publication tracker: [issue #1](https://github.com/predantsev/js-learning-lab/issues/1). Documentation PR: [#2](https://github.com/predantsev/js-learning-lab/pull/2); GitHub records its review/merge state.
- GitHub main protection requires a PR, resolves conversations, enforces administrators, and disallows force push/deletion; no approval-count or fictitious CI requirement was added. Delete-branch-on-merge is enabled. Reverify live settings before future work.
- License remains undecided; no license/reuse permission was invented. There is no runnable application or hosted deployment.

## Completed package

38 stable requirements and acceptance criteria, 56 currently specified curriculum units in JavaScript → React → React Native → Node.js order, four equivalent capstones/checkpoints, bilingual content/data/runtime contracts, 19 verification cases, proposed technical decisions and milestone implementation handoff. README, AGENTS.md and thin CLAUDE.md provide portable entry points. Required course lesson bodies and app/native/server implementation do not yet exist.

Accepted review corrections: contextual HTML/CSS inside JavaScript; stage practice/runtime boundaries; post-export local authority and reference-download/diff/manual backup/merge; M1 slice vs M2 export; base lesson states vs independent evidence; origin-change risk; native fixtures/mock-service before Node; sandbox persistence/runaway DOM spike checks; capstone reuse without universal-generator mandate; optional maintainer context. [Review resolution](reviews/REVIEW-RESOLUTION.md) preserves accepted/qualified/rejected findings and baseline provenance. F9's unauthorized-visual/review/accessibility claim was rejected.

Owner-approved decisions: continue without native tooling while native tasks remain unperformed/skipped; change capstone through a separate project preserving old work/global learning without passing new transfers; canonical example identifiers/comments English, authored UI localized, learner code preserved. Full-product RN/native verification is still required.

## Verification and evidence

- Before publication, `git status --short --branch` showed unborn chore/requirements-bootstrap and only the documentation package; `git remote -v` was empty. GitHub REST/GraphQL checks found no existing predantsev/js-learning-lab; `gh api user --jq .login` returned predantsev after account selection.
- User explicitly authorized PUBLIC publication. The content-free ancestor 456d968 was created on chore/requirements-bootstrap and pushed as main as the safe empty-remote bootstrap. Substantive docs use the real issue/feature-branch/PR flow; no force push or direct substantive main commit.
- Repository creation returned its public URL; REST main-protection update returned enforce_admins=true, approval count=0, force push/deletion=false and conversation resolution=true. Actual merge state is available through the issue-linked PR.
- Local documentation validator checked 34 stable REQ IDs, explicit coverage across 16 cases, 34 unchanged curriculum IDs and all relative Markdown links. Full document content/diff review and exact twelve-file allowlist inspection excluded scratch/output files, transcripts, launch IDs, learner records and token/private-key patterns. Optional maintainer context is not a runtime prerequisite.
- No app tests, native/device runs, server checks, offline checks or runtime feasibility checks have passed: no implementation exists. No CI workflow was fabricated for this documentation-only publication.

## Open decisions and next step

Read DECISIONS.md and IMPLEMENTATION-HANDOFF.md in a new development session. Resolve stack/storage/editor choices through early spikes and evidence: isolated learner persistence, responsive runaway DOM stop/recovery, stage runtimes, origin-change warning/recovery and toolchain-specific native networking. Failed spikes block the failed design/claimed milestone rather than justify fake previews or missing stages. Supported OS/browser/native matrix, license/asset rights and valid port allocation remain explicit choices. Optional profiles/full-profile backup/scheduling are not mandatory invented dependencies.

No application implementation task has been launched. The approved lesson design reference is included; other product screens remain undesigned. Complete-course release still requires all stages and full verification; M1 alone is partial. On the original workstation only, the optional sibling port registry has an invalid 7xxxx next-block proposal and conflicting older prose; resolve that local allocation issue before claiming a service port. Public clone/run must not depend on that registry, a maintainer account or machine paths.

## Approved design delivery

All three styles are accepted, with Calm Studio default and side-by-side explanation/practice as a provisional foundation. REQ-035/V-17 cover saved style IDs, state preservation, fallback/migration and full parity; REQ-016 specifies same-block EN/UA translation. Local login-free flow is documented while storage selection remains open. [Design reference](design/LESSON-DESIGN.md) distinguishes raw source, standalone offline preview and product requirements.

Reference evidence: `work/test_style_preview.cjs` was run against the exported file using installed Chrome/Playwright, file URL, offline context, 1440×1100. The public [preview check](design/preview-check.json) records default/three styles, numeric-only interaction, same-block translation, code/bookmark preservation, keyboard tooltip and style/draft reload; pageErrors and networkRequests were empty. This passes reference checks only, not V-17 product gates. No dependencies were installed. Visual review of the Calm Studio screenshot showed a readable side-by-side lesson; other style screenshots require inspection before claiming visual review. No full bilingual/accessibility or learner-storage product verification is claimed.

Design publication tracker: [issue #3](https://github.com/predantsev/js-learning-lab/issues/3). Its linked PR records actual review/merge state. Documentation validator checked 35 stable REQ IDs, coverage across 17 verification cases, 34 unchanged curriculum IDs and all relative Markdown links. Raw reference bytes match the approved source; standalone export has no external script dependencies.

## Professional completeness audit and baseline 4

Owner-approved scope prioritizes complete selected-stack professional competencies over short duration/counts; a year or longer is acceptable. [Source-grounded audit](audits/2026-10-01-COMPLETENESS.md) inspected baseline commit 22abc2b and the six canonical specifications. JS-04 already says loops; the finding is unspecified forms/outcomes, not wholesale absence. TypeScript appeared only as a platform candidate, SQL/auth/professional delivery lacked assessed curricular depth, and broad framework rows did not establish full competency coverage.

[Competency matrix](COMPETENCY-MATRIX.md) and [inventory](competencies.json) now specify 60 families with subskills, depth/rationale, foundation/core/required-awareness boundaries, sources, intro/closure prerequisites, units, actual practice and independent evidence requirements. Added JS-11–18, RE-09–12, RN-09–12 and NO-09–14, preserving all previous unit/checkpoint IDs. REQ-036–038/V-18–19 cover closure, professional local labs and cumulative gates. JS-10/CP-JS export remains foundational; later stage gates cover expanded scope. Node entry requires no native practical pass. TypeScript/SQL/auth/recovery course labs do not mandate platform TypeScript/DB/login/full-profile backup or paid external deployment/store accounts.

All 60 families remain not-authored/not-implemented/not-verified. Empty lesson/assessment/evidence arrays are honest pending implementation, not release-ready coverage. Version/toolchain/security/bilingual/native/production evidence remains unconfirmed. Sources were opened live on 2026-10-01 and recorded by URL/section; they establish breadth, not prove learning or approve libraries. Claude was attempted at the exact repository but stopped at folder trust before auditing; Codex performed this audit without bypassing trust or claiming a Claude review.

Validation: `python3 scripts/validate_competencies.py` passed with 60 competency families, 56 unique/mapped units, 38 requirements and 19 cases; it checks stable IDs, coverage, two-layer prerequisite integrity, cycles/intro order, stage mappings, links and non-placeholder scope. Eight seeded invalid cases (duplicates, missing/cyclic dependency, future intro, unmapped unit, native entry blocker, placeholder and invalid state) were rejected. `--release` correctly returned RELEASE NOT READY with 240 missing-evidence issues. This is specification validation only; future V-18 semantic/subskill/content/runtime review remains mandatory. Tracker: [issue #5](https://github.com/predantsev/js-learning-lab/issues/5); linked PR records actual publication state. No app/lesson/deployment implementation was launched.

Independent root checks reran the actual repository validator and expected failing release gate, and checked introductory/final prerequisite semantics. Its Date/Intl grounding finding was corrected: J-08 is missing assessed coverage in baseline 3, not partial based on a strings/numbers passage. Inventory, matrix and audit classifications now agree.
