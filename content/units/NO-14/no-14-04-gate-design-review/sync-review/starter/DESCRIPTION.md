# PR: Offline sync for the planner

**What.** While the planner is offline, the client queues every edit of a task. When it is back
online it sends the queue in one request, `POST /sync`, and shows the server's answer per change.

**How.** `sync.js` applies the changes in order. Each change is
`{ changeId, taskId, baseVersion, editedAt, fields }`: `baseVersion` is the task version the
device last saw, `editedAt` the device's clock at the moment of the edit. Conflicts are resolved by
last write wins: the edit with the later `editedAt` wins. A `changeId` that was already applied
is skipped, because a device resends its queue when an answer gets lost.

**Tests.** `sync.test.js`: an edit is applied, an older edit loses, a resent change is skipped,
an unknown task is reported. All green.

**Rollout.** Merge and deploy; every client gets sync on its next start.
