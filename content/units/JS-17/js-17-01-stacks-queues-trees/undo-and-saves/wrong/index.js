// Edits of one planner task. Every change records the title it had before the change.
const history = [];
const pending = [];

// 1. An undo stack: recordChange adds a snapshot; undo removes and returns the most recent
//    one, or null when there is nothing to undo.
function recordChange(history, snapshot) {
  history.push(snapshot);
}

function undo(history) {
  if (history.length === 0) {
    return null;
  }
  return history.shift(); // takes the oldest change, not the newest
}

// 2. A bounded queue of pending saves: enqueueSave adds a save at the end. When the queue
//    already holds `limit` saves, it first drops the oldest one and returns it; otherwise it
//    returns null. nextSave removes and returns the oldest save, or null when the queue is empty.
function enqueueSave(queue, save, limit) {
  let dropped = null;
  if (queue.length >= limit) {
    dropped = queue.shift();
  }
  queue.push(save);
  return dropped;
}

function nextSave(queue) {
  if (queue.length === 0) {
    return null;
  }
  return queue.shift();
}

recordChange(history, "%%v1%%");
recordChange(history, "%%v2%%");
recordChange(history, "%%v3%%");
console.log(undo(history), "|", undo(history));

for (let i = 1; i <= 5; i++) {
  enqueueSave(pending, { id: "save-" + i }, 3);
}
console.log(nextSave(pending)?.id, nextSave(pending)?.id);
