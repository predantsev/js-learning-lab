# js-learning-lab

A local-first desktop learning platform: **JavaScript → React → React Native → Node.js**, one continuous course with a chosen capstone, in Ukrainian and English.

**Current status: partial.** The platform foundation (milestone M1) runs locally, and the first JavaScript units are authored and validated. The remaining JavaScript units and the whole React, React Native and Node.js stages are planned in the syllabus but not authored; the application shows them as not published yet. [Current state](docs/STATUS.md) lists exactly what exists, what was measured and what was not. There is no hosted deployment, and no license has been selected: public visibility alone is not a reuse license.

## Quick start

Prerequisites: Node.js 22.13 or newer, npm, and a current desktop Google Chrome. Internet access is needed once, for `npm install`.

```
git clone https://github.com/predantsev/js-learning-lab.git
cd js-learning-lab
npm install
npm start
```

`npm start` builds the application and the course content on the first run (and again when sources change), then prints the address to open:

- http://js-learning-lab.localhost:7300
- fallback: http://localhost:7300

Stop with Ctrl+C. No account, secret, paid API, database or cloud service is involved.

| Setting | Default | Change with |
|---|---|---|
| Port | 7300 | `JSLL_PORT=7310 npm start` |
| Learner data folder | `.learner-data/` in the repository | `JSLL_DATA_DIR=/path npm start` |
| Export folder | `exports/` in the repository | `JSLL_EXPORTS_DIR=/path npm start` |

Your code, progress and settings are plain JSON files in the learner data folder. They are ignored by git and never leave the computer. Copy that folder, or use the backup in Settings, to keep a copy.

## Supported environment

Verified: macOS 26 on Apple silicon, Google Chrome 154, Node.js 22, 24 and 25, viewport 1280×800 or larger.

Not verified: Windows, Linux, Firefox, Safari, screen readers, and running with the network disconnected. They may work; nothing here claims that they do.

Known not to work: browsers built into other applications that block frames from another local address. Learner code runs in a frame served from a separate sandbox address (`jsll-run-N.localhost`, fallback `127.0.0.1`); the browser pane of the Claude desktop application blocks both (`net::ERR_BLOCKED_BY_CLIENT`), so lessons open there but code does not run. Use Google Chrome.

## How code runs

| Runtime | What it is | What it is not |
|---|---|---|
| Browser JavaScript and React | Your code in an isolated browser sandbox with a real DOM, with stop and rerun. | — |
| React Native preview | React Native components rendered in the browser, labeled as a preview. | Not a device or an emulator. |
| Node.js | A real Node.js process on your computer, limited to a temporary folder, with time, output and network limits. | Not a hardened sandbox against malicious code. |
| Local tasks | Projects you run yourself in VS Code and a terminal, with guided steps. | Not checked automatically. |

Native React Native builds need a native toolchain that the platform does not install. Learners without it can continue to the Node.js stage; native tasks stay recorded as not performed.

## Development

```
npm run typecheck        # TypeScript
npm test                 # unit tests (server, store, Node executor, content compiler, visuals)
npm run test:e2e         # real-browser tests; needs Google Chrome
npm run content:validate # runs every example, exercise fixture and prediction of the course
npm run content:smoke    # opens every authored lesson page in both languages
python3 scripts/validate_competencies.py
```

Course content lives in `content/` and follows the [authoring guide](content/README.md). The local API and its security model are described in [docs/platform/SERVER-API.md](docs/platform/SERVER-API.md); measured evidence is under [docs/evidence](docs/evidence/M1/README.md).

## Read the package

- [Current state](docs/STATUS.md)
- [Requirements and acceptance criteria](docs/REQUIREMENTS.md)
- [Curriculum and capstone checkpoints](docs/CURRICULUM.md)
- [Professional competency matrix](docs/COMPETENCY-MATRIX.md)
- [Source-grounded completeness audit](docs/audits/2026-10-01-COMPLETENESS.md)
- [Lesson and learner-data contracts](docs/CONTENT-DATA.md)
- [Verification and release gates](docs/VERIFICATION.md)
- [Decisions](docs/DECISIONS.md)
- [Implementation handoff](docs/IMPLEMENTATION-HANDOFF.md)
- [Approved lesson design and standalone preview](docs/design/LESSON-DESIGN.md)
- [Independent review resolution](docs/reviews/REVIEW-RESOLUTION.md)

## Contribution workflow

Read [AGENTS.md](AGENTS.md). Work uses GitHub Issues and branch → PR → applicable checks → review → squash merge. Implementation is tracked by epic [#13](https://github.com/predantsev/js-learning-lab/issues/13). The repository contains no learner records and no production project source.

## Full-course scope

The program targets independent professional ability to build, debug, test, secure, deliver and maintain web React apps, native apps and Node services. Required TypeScript, web foundations, Git, tooling, SQL, auth, security, testing, delivery and recovery are course skills, not platform account or database requirements. Completion depends on assessed competency evidence, not a short calendar or a fixed lesson count; a year or longer is acceptable. The competency matrix is a specification: a unit counts only when its lessons are authored, validated and reviewed, and the full course is not complete until every stage passes its cumulative gate. Native skips allow continuation but cannot certify native competence.
