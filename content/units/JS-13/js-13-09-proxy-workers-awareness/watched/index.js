const settings = {
  currency: "UAH",
  pageSize: 5,
  get summary() {
    return this.currency + " / " + this.pageSize;
  },
};

const reads = [];
const watched = new Proxy(settings, {
  get(target, key, receiver) {
    reads.push(String(key));
    return Reflect.get(target, key, receiver);
  },
});

console.log(watched.summary);
console.log("%%reads%%", reads.join(", "));

// What does this sandbox support? Check instead of assuming.
console.log("Worker:", typeof Worker);
console.log("SharedArrayBuffer:", typeof SharedArrayBuffer);
console.log("crossOriginIsolated:", globalThis.crossOriginIsolated);
