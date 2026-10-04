// POST /sync — applies the edits a device queued while it was offline (added in this PR).
// Body: { deviceId, changes: [{ changeId, taskId, baseVersion, editedAt, fields }] }
import { readJson, sendJson } from './http-helpers.js';

// changeIds already applied: a device resends its queue when an answer gets lost.
const seen = new Set();

export function applyChanges(store, changes) {
  const results = [];
  for (const change of changes) {
    if (seen.has(change.changeId)) {
      results.push({ changeId: change.changeId, status: 'duplicate' });
      continue;
    }
    const task = store.get(change.taskId);
    if (!task) {
      results.push({ changeId: change.changeId, status: 'not-found' });
      continue;
    }
    // Last write wins: the edit made later wins.
    if (change.editedAt >= task.editedAt) {
      Object.assign(task, change.fields);
      task.editedAt = change.editedAt;
      task.version += 1;
      store.put(task);
      results.push({ changeId: change.changeId, status: 'applied', version: task.version });
    } else {
      results.push({ changeId: change.changeId, status: 'older' });
    }
    seen.add(change.changeId);
  }
  return results;
}

export function createSyncRoute(store) {
  return async (request, response) => {
    const body = await readJson(request);
    sendJson(response, 200, { results: applyChanges(store, body.changes) });
  };
}
