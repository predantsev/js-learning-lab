// Read-only helper (the same as in the lesson on loading and error states).
// Settles the same way as `promise`, or rejects with an Error named "TimeoutError"
// if `promise` takes longer than `ms`. It only stops waiting: the request itself goes on.
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
