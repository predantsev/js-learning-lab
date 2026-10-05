// Prints `text` as a microtask: after the code that is running now,
// but before any timer.
function logSoon(text) {
  // A .then callback of an already fulfilled promise is a microtask too.
  Promise.resolve().then(() => console.log(text));
}

// Prints `text` as a task: only after every waiting microtask.
function logLater(text) {
  setTimeout(() => console.log(text));
}

// When both functions work, the console shows: sync, micro, task.
logLater("task");
logSoon("micro");
console.log("sync");
