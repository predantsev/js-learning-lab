// Prints `text` as a microtask: after the code that is running now,
// but before any timer.
function logSoon(text) {
  // Mistake: the two queues are swapped.
  setTimeout(() => {
    console.log(text);
  }, 0);
}

// Prints `text` as a task: only after every waiting microtask.
function logLater(text) {
  queueMicrotask(() => {
    console.log(text);
  });
}

// When both functions work, the console shows: sync, micro, task.
logLater("task");
logSoon("micro");
console.log("sync");
