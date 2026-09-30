# Approved lesson design reference

Owner-approved design direction, 2026-09-30. This documents presentation intent; it is not a working learning platform. REQUIREMENTS.md remains normative. Other product screens have not been designed.

## Retained styles and layout

| Display name | Stable preference ID | Role |
|---|---|---|
| Calm Studio / Спокійна студія | calm-studio | Default for fresh data; calm spacing and green accents. |
| Editorial / Редакційний | editorial | Editorial typography and composition. |
| Dev workspace | dev-workspace | Denser developer workspace presentation. |

All three are approved application styles; the selection is an application-wide local preference. This reference demonstrates the lesson screen; other screens remain undesigned. Explanation and practice beside each other (the “Поруч” direction) form the provisional lesson layout foundation; other layout explorations were not explicitly rejected. Implement style as presentation over the same lesson/content/runtime/state. REQ-035 requires local stable-ID persistence, restart restoration, non-destructive unknown/retired-ID fallback/migration, and complete functionality/content/Ukrainian/English/accessibility parity. Style switches preserve drafts, progress, hints, bookmarks, active context and global language. Visual style is distinct from light/dark appearance; this approval adds no appearance-mode requirement.

The compact EN/UA block toolbar translates the same canonical explanation in place: heading, body, diagram labels and analogy. Global language and surrounding blocks remain unchanged; retain focus/context and learner state. REQ-016 applies the alternate-language behavior to the relevant task/hint/glossary blocks as well. Exact prototype markup is not a mandatory application architecture.

## Login-free local data flow

Open the local platform, restore local preferences and saved work, resume or select a lesson/project, then save with accurate pending/saved/failed status. No login or cloud identity is required. Keep global course evidence distinct from project-specific files/transfers/checkpoints; switching capstone retains the old workspace. Store selectedStyleId as a versioned preference, separate from content IDs and assessment results.

Storage technology remains DEC-02 feasibility work. For browser storage, explain browser/profile/origin boundaries, clearing and quota risk; hostname/port changes need the verified warning/recovery behavior. For file-backed storage, explain location and permissions. Moving between computers requires an explicitly supported manual transfer workflow. Full-profile backup/import is the REQ-025 recommendation; it is not implemented or newly mandatory. Convenience preview storage below proves none of these product contracts.

## Files and opening the reference

- [Standalone preview](lesson-styles.html): download/save this HTML file, then open it locally in a desktop browser. GitHub displays source rather than hosting the application. The exported file is self-contained and makes no required network request.
- [Original source fragment](lesson-styles.source.html): byte-preserved approved visual source; depends on its original visualization host and is not standalone.
- [Adapted offline fragment](lesson-styles.offline-fragment.html): the reference with embedded local controls/runtime; its standalone wrapper is the file above.
- Screenshots: [Calm Studio](calm-studio.png), [Editorial](editorial.png), [Dev workspace](dev-workspace.png).
- [Observed reference-check result](preview-check.json).

The preview demonstrates a single illustrative Ukrainian lesson, English alternate explanation, navigation among styles, bookmark/hint controls and a restricted numeric price predicate. It does not execute arbitrary JavaScript; sample data/output and mock actions do not establish course completion. It is not full product localization, supported-browser coverage, accessibility certification, learner-storage architecture or a native/server runner. No application scaffold, package dependency or deployment is included.

## Evidence and remaining verification

The local reference interaction script opened the exported file with installed Chrome/Playwright in offline mode at 1440×1100. preview-check.json records the observed checks: default Calm Studio, three styles/navigation, same-block English toggle, numeric-only predicate guard, code/bookmark preservation, keyboard tooltip and selected style/draft reload. It records no page errors or HTTP requests. This is a reference check; production V-08/V-12/V-15/V-17 remain unexecuted. No browser dependencies were installed for this task.

Visual inspection of the Calm Studio screenshot confirmed the side-by-side composition at that viewport. Editorial/Dev workspace screenshots are captured evidence; comprehensive visual, contrast, zoom and bilingual review across all styles remains unconfirmed. Screenshot sample state is synthetic and is not learner data.
