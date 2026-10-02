# Current project state

## Implementation state (2026-10-02): partial

The owner authorized implementation of the platform and the complete course on 2026-10-01. Work is tracked by epic [#13](https://github.com/predantsev/js-learning-lab/issues/13) with milestone issues #7 (M1 platform), #8 (M2 JavaScript), #9 (M3 React), #10 (M4 React Native), #11 (M5 Node.js) and #12 (M6 release verification). **The product is partial: the platform foundation runs, and 85 of 528 planned lessons are authored.** The sections after this one remain the pre-implementation record.

| Milestone | State | What exists |
|---|---|---|
| M1 platform (#7) | Implemented for the measured environment; open items below | Local server, learner store, sandboxed runners, lesson and project workspaces, export, backup, content pipeline and validators |
| M2 JavaScript (#8) | Partial: 7 of 18 units complete | JS-01…JS-07 complete with capstone steps (83 lessons); JS-08 has 2 of 13 lessons; JS-09…JS-18 and CP-JS not authored |
| M3 React (#9) | Not started | Lesson-level syllabus only (107 lessons planned) |
| M4 React Native (#10) | Not started | Lesson-level syllabus only (95 lessons planned) |
| M5 Node.js (#11) | Not started | Lesson-level syllabus only (122 lessons planned); the Node runtime itself is implemented and tested with fixture lessons |
| M6 release (#12) | Not started | `python3 scripts/validate_competencies.py --release` reports the release as not ready, as it must |

### M1 platform

Adopted decisions and their rationale are in [DECISIONS.md](DECISIONS.md) ("Adopted during M1 implementation"); measured evidence is indexed in [evidence/M1](evidence/M1/README.md). In short: a zero-dependency Node.js server on loopback (port 7300), a React and TypeScript application, learner data as JSON files under `.learner-data/`, learner code in an opaque-origin sandboxed frame on a separate host, a real Node.js child-process runner for Node lessons, three visual styles, Ukrainian and English everywhere, hints and solutions revealed only on request, bookmarks, skip and revisit, delayed review, glossary, eight kinds of step-through visuals including a tracer for the learner's own code, a project workspace with snapshots and capstone switching, export to a folder or zip, and full-profile backup and restore.

Checks run on the implementation branch on 2026-10-02 (macOS 26 arm64, Google Chrome 154, Node.js 25.2.1):

| Command | Observed result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm test` | 157 tests, 157 pass, 0 fail |
| `npm run test:e2e` | 135 tests; 135 pass in 3 of 4 consecutive full runs. One run failed 1 test ("a lost connection to the server is explained…"), which then passed 3 of 3 times alone. See the flaky-test note below |
| `npm run content:validate` | CONTENT VALID: 85 lessons, 147 example runs, 1044 exercise fixture runs, 222 verified predictions, 28 capstone step variants with 112 capstone runs, 0 errors |
| `npm run content:smoke` | SMOKE OK: 85 lessons, 488 page views, 0 problems |
| `node scripts/content/validate-syllabus.mjs` | OK: 528 lessons in 56 unit files, no errors |
| `python3 scripts/validate_competencies.py` | SPECIFICATION PASS (60 competencies, 56 units, 38 requirements, 19 cases) |
| clean clone → `npm ci` → `npm start` | builds and serves; index 200 on both hosts, API without token 401 (same machine only) |

Open M1 items, none hidden:

- **Security, owner decision needed.** The independent review ([security-review.md](evidence/M1/security-review.md)) fixed one critical defect (a Node run with loopback networking could reach the platform API and read the learner store) and four medium ones, each with a regression test. Two high findings stay open by design: the API token is served with the page, so any process on the computer that can open a loopback connection can read it; and the protection of the platform port from learner Node code is a guard inside the same process, not an operating-system barrier. The proposed fix (a one-time launch address exchanged for an HttpOnly cookie) changes how the application is opened and is therefore left to the owner.
- **Checks are self-assessment.** Deliberate learner code can forge a passing check in both runners; evidence badges are not proof against cheating.
- **Environment.** Only macOS with Google Chrome was run. Windows, Linux, Firefox, Safari, screen readers and a run with the network disconnected are unverified. The Node runner has no operating-system isolation layer outside macOS.
- **Embedded browsers.** In one browser embedded in another application, lessons rendered but code did not run: requests for the sandbox frame failed on both sandbox addresses (observed 2026-10-02: `net::ERR_BLOCKED_BY_CLIENT` for `jsll-run-0.localhost` and `127.0.0.1`). Whether that browser blocks such frames always or only until the address is allowed is unconfirmed. The application reports the failure and keeps the code. A same-address sandbox fallback would avoid the second address but gives up the separate site that keeps the application responsive during a runaway program; it was not implemented.
- **Not performed.** Opening and running an exported project in VS Code (V-06), any native device or emulator run (V-07: no native toolchain on the build machine), V-14 offline run, a clean clone on a second machine (V-13).
- **Known runner limits that lessons describe honestly:** Stop discards console output printed before it; a literal dynamic import of a missing file fails before the run starts; the console is output-only. In the browser runner `console.trace` output is shown but is not part of what checks read, while the Node runner includes it.
- **Flaky end-to-end tests under machine load.** Three tests have failed intermittently in full runs while passing alone: "a lost connection to the server is explained…" and "busy…" in `app-node-runtime.test.mjs`, and a rare "application shell did not render" page error. The causes are unconfirmed; the build machine was under heavy unrelated load (load average 20–50) during these runs.
- **Local registry.** The optional shared port registry on the maintainer workstation was not updated with port 7300 (outside this repository).

### M2 JavaScript

| Unit | Lessons authored / planned | Independent review | Capstone step ×4 |
|---|---|---|---|
| JS-01 First code and a first page | 10 / 10 | merged | yes |
| JS-02 Names, comparisons and branching | 12 / 12 | merged | yes |
| JS-03 Functions, scope and closures | 11 / 11 | merged | yes |
| JS-04 Arrays, objects, loops and references | 13 / 13 | merged | yes |
| JS-05 Transforming lists | 10 / 10 | merged | yes |
| JS-06 Forms, layout, the DOM and events | 16 / 16 | merged | yes |
| JS-07 Errors, modules and saved data | 11 / 11 | merged | yes |
| JS-08 Asynchronous code | 2 / 13 | not reviewed | no |
| JS-09…JS-18, CP-JS export | 0 | — | — |

Every authored lesson is bilingual and passes the content validator, which executes every example, every exercise fixture (starter, solution, alternative and deliberately wrong solutions) and every verified prediction in a real browser, and the smoke test, which opens every lesson page in both languages. Each of JS-01…JS-07 was then reviewed by an independent reviewer who had not written it; the recurring defects became the 32 rules in the [authoring guide](../content/README.md). Seven competency families (J-01, J-02, J-03, J-05, W-01, W-02, W-03) have every subskill assessed in those units and are recorded as authored and implemented in [competencies.json](competencies.json); no family is recorded as verified.

What this does not establish: all authoring and review was done by AI agents. No human teacher, no native-speaker editor and no real learner has read the lessons; the Ukrainian was judged natural by the reviewers but has not had a human linguistic review. Reviewer notes list remaining unverified items per unit (screen-reader behaviour, DevTools panels, some claims about Chrome outside the sandbox). JS-06 coverage gaps noted by its reviewer: tables and images are practised less deeply than the syllabus depth states.

### Next steps

1. Owner decisions: the launch-address security change, and whether later runs continue with JS-08…JS-18 before React. The license was decided on 2026-10-02: MIT for code, course content and documentation.
2. Author JS-08 (11 lessons left; measured sandbox facts for timers, promises and `fetch` are in the authoring guide), then JS-09, JS-15 and JS-10 so that the CP-JS export checkpoint becomes reachable.
3. Human review of a sample of lessons in both languages before more content is produced at scale.

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
