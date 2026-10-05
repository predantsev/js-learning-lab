console.log("%%start%%");

setTimeout(() => console.log("%%timerA%%"), 0);
setTimeout(() => console.log("%%timerB%%"), 0);

Promise.resolve()
  .then(() => console.log("%%thenOne%%"))
  .then(() => console.log("%%thenTwo%%"));

console.log("%%end%%");
