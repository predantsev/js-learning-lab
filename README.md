# js-learning-lab

A planned desktop learning platform: **JavaScript → React → React Native → Node.js**, one continuous course with a chosen capstone.

**Current status: reviewed requirements, documentation and approved lesson design references only. There is no runnable application or hosted deployment yet.** Repository: [predantsev/js-learning-lab](https://github.com/predantsev/js-learning-lab), public, with canonical documentation on `main`. Accepted review corrections are incorporated in baseline 3, ready for development planning and early technical spikes. License, implementation stack, hosting and supported operating systems remain explicit open choices, not drafting blockers.

## Read the package

- [Requirements and acceptance criteria](docs/REQUIREMENTS.md)
- [Curriculum and capstone checkpoints](docs/CURRICULUM.md)
- [Lesson and learner-data contracts](docs/CONTENT-DATA.md)
- [Verification and release gates](docs/VERIFICATION.md)
- [Proposed decisions](docs/DECISIONS.md)
- [Implementation handoff](docs/IMPLEMENTATION-HANDOFF.md)
- [Approved lesson design and standalone preview](docs/design/LESSON-DESIGN.md)
- [Current state](docs/STATUS.md)
- [Independent review resolution](docs/reviews/REVIEW-RESOLUTION.md)

## Local use target

The finished platform must work from a clean clone with documented prerequisites and a short install/start procedure, without accounts, secrets, paid APIs or remote databases. Course content and required assets ship in the repository. Initial dependency downloads and optional native tooling may require internet. Runtime offline guarantees must be tested, not assumed.

Beginners receive required HTML/CSS context inside JavaScript. Learners without native tooling can continue to Node with web integration, retaining unperformed native tasks for revisit; full product native verification is still required. Capstone switching creates a separate project and preserves prior work.

Actual installation commands and supported versions will be documented when implementation exists. Do not interpret this README as a working quick-start. Native React Native projects and real Node.js servers require an explicitly guided local workflow; browser previews are not native-device or real-server verification.

## Contribution workflow

Read [AGENTS.md](AGENTS.md). Work uses GitHub Issues and branch → PR → applicable checks → review → squash merge. The initial documentation publication is tracked by [issue #1](https://github.com/predantsev/js-learning-lab/issues/1). Development remains a separate future task. The package contains no learner records or production project source.
