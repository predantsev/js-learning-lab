function settleAfter(ms, ok, value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (ok) resolve(value);
      else reject(new Error(value));
    }, ms);
  });
}

const a = settleAfter(300, true, "a");
const b = settleAfter(100, false, "b failed");
const c = settleAfter(200, true, "c");

Promise.all([a, b, c])
  .catch((e) => console.log("all:", e.message));
Promise.race([a, b, c])
  .catch((e) => console.log("race:", e.message));
Promise.any([a, b, c])
  .then((v) => console.log("any:", v));
Promise.allSettled([a, b, c])
  .then((r) => console.log("allSettled:", r.length));
