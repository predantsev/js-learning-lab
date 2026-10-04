# Habit service — runbook entry: error rate above 5 % for 2 minutes

**Signal.** Alert: `errors / requests` of a one-minute window is above 0.05 for 2 windows in a row
(and the window has at least 20 requests).

**Checks, in order.**
1. `GET /readyz` — 503 means storage or startup trouble: follow the storage entry instead.
2. Error log lines of the last window: which route, which request ids, which message.
3. The latest release record: what was deployed, when, which sha256; is the previous artifact kept?

**Decision.** The errors started with the latest release and the previous artifact is kept →
roll back. Otherwise, or if the previous release cannot read today's data → fix forward.

**Data check before rollback.** Compare the data's `schemaVersion` with what the previous release
supports. If the data is newer: restore the backup taken right before the upgrade — only if no
writes happened since (otherwise they would be lost: fix forward or write a down-migration instead).

**Rollback.** Stop the current release, verify the previous artifact's sha256, restore data if the
check said so, start the previous release.

**Confirm recovery.** `/readyz` is 200 with the previous version, and the error rate of the next
full window is below 0.05.
