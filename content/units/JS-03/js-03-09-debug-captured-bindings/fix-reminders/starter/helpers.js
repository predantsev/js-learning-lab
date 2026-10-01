// Ready-made helpers for this exercise (do not change this file).

// later(callback) puts a callback aside; runLater() calls everything put aside, in order.
const waiting = [];

export function later(callback) {
  waiting.push(callback);
}

export function runLater() {
  for (const callback of waiting) {
    callback();
  }
}

// taskAt(index) returns one task of the planner: index 0, 1 or 2.
const tasks = [
  { id: "t-01", title: "%%task1%%", done: false },
  { id: "t-02", title: "%%task2%%", done: false },
  { id: "t-03", title: "%%task3%%", done: false },
];

export function taskAt(index) {
  return tasks[index];
}
