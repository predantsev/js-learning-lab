# js-learning-lab

A local-first desktop learning platform: **JavaScript → React → React Native → Node.js**, one continuous course with a chosen capstone, in Ukrainian and English.

**What it contains:** 528 lessons in 56 units — JavaScript (18 units, with the HTML and CSS a page needs), React (12), React Native (12) and Node.js (14) — each with explanations, step-through visuals, predictions, exercises that run real code, assessments and delayed review, in Ukrainian and English. A capstone project of your choice (wishlist, planner, habit tracker or simple expense tracker) grows step by step through all four stages: inside the platform at first, then as your own local project.

**Current status: course authored, release partial.** Every lesson is validated and independently reviewed. Not done yet: any run on a native device or emulator, Windows and Linux, human or native-speaker review, independent review of the capstone steps, and the final release verification. [Current state](docs/STATUS.md) lists exactly what was measured and what was not. There is no hosted deployment.

## Quick start

Requirements: Node.js 22.13 or newer, npm, and a current desktop Chromium-based browser (verified with Google Chrome). Internet access is needed once, for `npm install`; later local projects install their own packages.

```
git clone https://github.com/predantsev/js-learning-lab.git
cd js-learning-lab
npm install
npm start
```

`npm start` builds the application and the course content on the first run (and again when sources change), then prints the address to open in the browser:

- http://js-learning-lab.localhost:7300
- fallback: http://localhost:7300

Stop with Ctrl+C. No account, secret, paid API, database or cloud service is involved.

| Setting | Default | Change with |
|---|---|---|
| Port | 7300 | `JSLL_PORT=7301 npm start` |
| Learner data folder | `.learner-data/` in the repository | `JSLL_DATA_DIR=/path npm start` |
| Export folder | `exports/` in the repository | `JSLL_EXPORTS_DIR=/path npm start` |

Your code, progress and settings are plain JSON files in the learner data folder. They are ignored by git and never leave the computer. Copy that folder, or use the backup in Settings, to keep a copy.

## Supported environment

Verified: macOS 26 on Apple silicon, Google Chrome 154, Node.js 25 (the Node executor tests also on Node.js 22 and 24; some Node.js lessons and steps also on Node.js 22.13.1), viewport 1280×800 or larger.

Not verified: Windows, Linux, Firefox, Safari, screen readers, and running with the network disconnected. They may work; nothing here claims that they do.

Known limit: a browser embedded in another application may show lessons but refuse to run code. Learner code runs in a frame served from a separate sandbox address (`jsll-run-N.localhost`, fallback `127.0.0.1`), and an embedded browser that blocks frames from a second local address stops it (observed once as `net::ERR_BLOCKED_BY_CLIENT`; whether that browser can be configured to allow the address is unconfirmed). The application reports the failure and keeps the code. Use Google Chrome.

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

Course content lives in `content/` and follows the [authoring guide](content/README.md). The local API and its security model are described in [docs/platform/SERVER-API.md](docs/platform/SERVER-API.md); measured evidence is under [docs/evidence](docs/evidence/M2-M5/README.md) (platform: [M1](docs/evidence/M1/README.md)).

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

## License

[MIT](LICENSE). The code, the course content and the documentation may be used, copied, changed and redistributed by anyone, provided the copyright and permission notice is kept. Dependencies installed by `npm install` keep their own licenses.
