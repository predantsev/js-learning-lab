# M1 evidence index

Milestone M1 (issue #7) is the platform foundation: architecture decisions, content validators, editor, runner and controller, persistence and recovery, the bilingual lesson slice, and a clean local setup. This folder holds what was actually run. Every file names its environment and ends with a "not covered / unverified" section; read those before treating anything as proven.

Measured environment for everything here: macOS 26 (arm64), Google Chrome 154 (headless through playwright-core), Node.js 25.2.1, with the Node executor unit tests also run on Node.js 22 and 24. No other operating system or browser was run.

## Files

| File | What it records |
|---|---|
| [spike-runner-isolation.json](spike-runner-isolation.json) | Sandbox isolation spike: what learner code can and cannot reach from the opaque-origin frame. |
| [spike-runner-stop-rerun.json](spike-runner-stop-rerun.json) | Stop and rerun after a synchronous runaway loop. |
| [spike-runner-kill.json](spike-runner-kill.json) | Killing a stuck run by navigating the frame away. |
| [app-e2e.md](app-e2e.md) | Application end-to-end suite in a real browser, with a table mapping each test to verification cases and requirements. |
| [server-runtime.md](server-runtime.md) | Isolated Node executor, type checking, export and backup APIs; Node version matrix; what each isolation layer enforces. |
| [node-runtime-ui.md](node-runtime-ui.md) | The Node runtime inside lessons and the content validator; what learners are told about its limits. |
| [capstone-workspace.md](capstone-workspace.md) | Project workspace, snapshots, capstone switching and export. |
| [security-review.md](security-review.md) | Independent security and correctness review of the server, sandbox and Node runner. |

## How to rerun

```
npm install
npm run typecheck
npm test
npm run test:e2e
npm run content:validate
npm run content:smoke
python3 scripts/validate_competencies.py
```

The end-to-end suite and the content validator need Google Chrome installed; they start their own servers on ephemeral ports. The latest observed results are in [STATUS.md](../../STATUS.md).

## Verification cases at M1

The handoff expects "implemented portions of V-02/03/08–15". Status per case, for the platform only; course content beyond the authored JavaScript units is out of scope for every row.

| Case | Status at M1 | Where |
|---|---|---|
| V-02 skip and revisit | Partial: skip within the JavaScript slice and capstone step skip. Stage-boundary skips need later stages. | app-e2e.md, capstone-workspace.md |
| V-03 save and restart | Covered for the measured environment, including failed write and full disk. | app-e2e.md |
| V-08 language | Covered for the measured environment. | app-e2e.md |
| V-09 hints and solutions | Covered. | app-e2e.md |
| V-10 bookmarks | Covered. | app-e2e.md |
| V-11 runner fixtures | Covered for browser runtimes and the Node executor. | spikes, app-e2e.md, server-runtime.md, security-review.md |
| V-12 backup and migration | Covered by unit tests; the backup user interface was not exercised end to end. | server-runtime.md |
| V-13 clean clone | One clean clone on the build machine only (see STATUS.md). No second machine or operating system. | STATUS.md |
| V-14 offline | Not performed. The application loads nothing from other hosts (inferred from its content security policy and the absence of external URLs in the build), but no run with the network disconnected was made. | — |
| V-15 accessibility and failures | Partial: keyboard path, accessibility tree checks, contrast and failure states are automated; no screen reader was used. | app-e2e.md |
| V-17 styles | Covered for the measured environment. | app-e2e.md |
| V-06 export | Partial: export is implemented and unit-tested; opening and running the exported project in VS Code was not performed. | capstone-workspace.md |
| V-07 native and server | Not performed: no native toolchain on the build machine. | — |
