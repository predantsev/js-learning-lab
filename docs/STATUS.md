# Current project state

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
