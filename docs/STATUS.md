# Current project state

Updated 2026-09-30 by the primary Codex agent. Requirements baseline 2 is ready to start development in a new authorized session. Current task is public documentation publication only; implementation, exploratory designs and app deployment are deferred.

## Canonical repository and publication

- Public repository: https://github.com/predantsev/js-learning-lab
- Default branch: main; canonical remote: git@github.com:predantsev/js-learning-lab.git.
- Documentation publication tracker: [issue #1](https://github.com/predantsev/js-learning-lab/issues/1). Documentation PR: [#2](https://github.com/predantsev/js-learning-lab/pull/2); GitHub records its review/merge state.
- GitHub main protection requires a PR, resolves conversations, enforces administrators, and disallows force push/deletion; no approval-count or fictitious CI requirement was added. Delete-branch-on-merge is enabled. Reverify live settings before future work.
- License remains undecided; no license/reuse permission was invented. There is no runnable application or hosted deployment.

## Completed package

34 stable requirements and acceptance criteria, 34 minimum curriculum units in JavaScript → React → React Native → Node.js order, four equivalent capstones/checkpoints, bilingual content/data/runtime contracts, 16 verification cases, proposed technical decisions and milestone implementation handoff. README, AGENTS.md and thin CLAUDE.md provide portable entry points. Required course lesson bodies and app/native/server implementation do not yet exist.

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

No implementation or design task has been launched. Complete-course release still requires all stages and full verification; M1 alone is partial. On the original workstation only, the optional sibling port registry has an invalid 7xxxx next-block proposal and conflicting older prose; resolve that local allocation issue before claiming a service port. Public clone/run must not depend on that registry, a maintainer account or machine paths.
