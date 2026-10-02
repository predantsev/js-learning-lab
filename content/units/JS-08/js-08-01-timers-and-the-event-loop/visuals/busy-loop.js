console.log("start");

const startedAt = Date.now();
while (Date.now() - startedAt < 1000) {
  // one second of busy waiting
}

setTimeout(() => {
  console.log("timer");
}, 0);

console.log("end");
