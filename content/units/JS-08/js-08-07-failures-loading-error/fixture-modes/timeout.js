// Read-only helper of this lesson.
// Settles the same way as `promise`, or rejects with an Error named "TimeoutError"
// if `promise` takes longer than `ms`. The request itself keeps going: a later lesson
// shows how to really cancel it.
export function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("No answer within " + ms + " ms");
      error.name = "TimeoutError";
      reject(error);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
