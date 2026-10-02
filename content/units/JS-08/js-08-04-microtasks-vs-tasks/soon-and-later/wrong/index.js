// Prints `text` as a microtask: after the code that is running now,
// but before any timer.
function logSoon(text) {
  // Mistake: a 0 ms timer is a task, not a microtask.
  setTimeout(() => {
    console.log(text);
  }, 0);
}

// Prints `text` as a task: only after every waiting microtask.
function logLater(text) {
  setTimeout(() => {
    console.log(text);
  }, 0);
}

// When both functions work, the console shows: sync, micro, task.
logLater("task");
logSoon("micro");
console.log("sync");
