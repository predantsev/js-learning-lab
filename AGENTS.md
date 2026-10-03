# Project instructions

## Scope and sources

Read README.md, docs/STATUS.md, docs/REQUIREMENTS.md, docs/CURRICULUM.md, docs/CONTENT-DATA.md, docs/VERIFICATION.md, docs/DECISIONS.md and docs/COMPETENCY-MATRIX.md before implementation. Markdown is canonical. Stable requirement and curriculum IDs must survive edits; retire IDs explicitly rather than reuse them.

The owner explicitly authorized public documentation publication after requirements and review corrections. On 2026-10-01 the owner separately authorized implementation of the complete platform and course from this plan ("this is only a plan; I want you to implement it … make it the best learning material on the listed topics", translated from the Ukrainian request). Implementation is tracked by epic #13 and milestone issues #7–#12 and follows docs/IMPLEMENTATION-HANDOFF.md. Hosted deployment remains unauthorized. The public repository is predantsev/js-learning-lab; public visibility overrides the usual private Startups default. The project is licensed under MIT (LICENSE), chosen by the owner on 2026-10-02.

## Hard product invariants

- One course, exactly JavaScript → React → React Native → Node.js. No separate expert track.
- Desktop platform; mobile apps are a curriculum subject, not a platform layout requirement.
- Exactly four initial capstones: wishlist, planner, habit tracker, simple expense tracker. Shared objectives, one learner project at a time; changing capstone creates a separate workspace preserving prior work and global learning. Do not copy proprietary ProjectWishList source or assets.
- Ukrainian default and complete Ukrainian/English content, UI and feedback; per-block alternate viewing must preserve editor and progress state.
- Offer Calm Studio (fresh-data default), Editorial and Dev workspace with stable local style preference, non-destructive fallback and full functional/content/i18n/accessibility parity; style switches preserve all learner state.
- Real code execution with isolation and interruption; never present browser previews as full native/server runtimes.
- Core local use needs no cloud account, secret, paid API, remote database or service. Do not introduce an unnecessary database.
- Preserve learner files across checkpoints, skips, language changes and VS Code export. After export, local files are authoritative; guide reference-download/diff/manual backup/merge, no automatic local replacement/sync. Never overwrite code to give feedback or reveal a solution.
- Native tooling absence does not block later learning/Node web integration. Native practical evidence remains unperformed/skipped; full-product native workflow verification is still required.
- Teach contextual HTML/CSS inside JavaScript. Canonical example identifiers/comments are English; authored example UI is localized; preserve arbitrary learner code/comments.
- Validate sandbox persistent storage and responsive runaway DOM stop/recovery in early spikes; origin-change recovery and stage runtimes remain explicit engineering checks, not already proven facts.
- Public tracked files must contain no personal learner details or runtime learner data.
- Required professional competencies/subskills and cumulative gates are normative; no fixed count/deadline reduces foundations. TypeScript/SQL/auth/delivery labs are course skills, not mandatory platform stack/DB/login/cloud/store choices. JS-10 export is foundational, not full JS completion.
- Partial milestones must be reported as partial. Empty downstream course sections do not meet release criteria.

## Workflow

When available on this workstation, read sibling ../startup-rules/CONVENTIONS.md, TRACKING.md and PORTS.md. This optional machine-local canon is not required to clone or run the public project.

Standalone digest: English tracked docs/code/comments; no AI attribution; GitHub Issues as tracker; issue branches feat/<issue#>-slug or bug/<issue#>-slug; Conventional Commits with #N; one logical PR with Fixes #N; main uses PR protection; validate and review before squash merge. Recheck live remote/protection state rather than infer settings from documentation. Never invent issue numbers or push without a remote and applicable authorization.

No substantive commits directly to main. The initial content-free ancestor was committed on chore/requirements-bootstrap and pushed as main solely to establish a PR base; all substantive documents land through the issue-linked feature PR. Subsequent branches use real issue numbers. Canonical remote: git@github.com:predantsev/js-learning-lab.git.

## Optional maintainer-local context

This section applies only on the original maintainer workstation and is not required for public clone/run. For its Startups GitHub workflow, `gh auth switch -u predantsev` selects the correct personal account before gh commands. Sibling startup-rules documents remain optional machine-local canon; their private default is overridden by this project's approved public intent. Contributors use their own authorized account/environment. The future agent name and historical local registry observations are coordination context, not runtime prerequisites.

## Ports

The platform server uses port 7300 by default (`JSLL_PORT` overrides it) and binds only to `127.0.0.1` and `::1`. Application host: `js-learning-lab.localhost`, fallback `localhost`; sandbox hosts: `jsll-run-N.localhost`, fallback `127.0.0.1`. Tests use ephemeral ports and never 7300. The learner-run mock service of lesson rn-06-01 (`mock-service.mjs`) uses port 7310, bound to 127.0.0.1 by default (`--port`/`--host` override it). The optional shared registry on the maintainer workstation has not been updated with this allocation; its suggested 7xxxx block exceeds 65535 and its prose cites an older free block, so resolve that conflict there rather than copying an invalid default. Public installation must work on machines without the sibling registry.

## Docs localization

None for repository documentation companions at this stage. Product localization remains mandatory in both languages.

## Continuity and evidence

The primary Codex agent maintains docs/STATUS.md at meaningful milestones. This does not impose a session-memory ritual on other workers. Keep proposals separate from approved intent and measured behavior. Report validation commands and observed results; label unsupported conclusions unconfirmed and explain where checked.
