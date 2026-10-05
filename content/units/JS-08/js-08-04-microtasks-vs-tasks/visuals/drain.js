console.log("start");
setTimeout(() => {
  console.log("timeout");
}, 0);
Promise.resolve().then(() => {
  console.log("then 1");
  queueMicrotask(() => {
    console.log("inner");
  });
});
queueMicrotask(() => {
  console.log("micro");
});
console.log("end");
