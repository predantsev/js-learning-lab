// later(callback) puts a callback aside; runLater() calls everything put aside, in order.
// (It keeps them in an array — arrays are the topic of JS-04.)
const waiting = [];

export function later(callback) {
  waiting.push(callback);
}

export function runLater() {
  for (const callback of waiting) {
    callback();
  }
}
