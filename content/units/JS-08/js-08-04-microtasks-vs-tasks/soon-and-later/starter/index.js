// Prints `text` as a microtask: after the code that is running now,
// but before any timer.
function logSoon(text) {
  // your code here
}

// Prints `text` as a task: only after every waiting microtask.
function logLater(text) {
  // your code here
}

// When both functions work, the console shows: sync, micro, task.
logLater("task");
logSoon("micro");
console.log("sync");
