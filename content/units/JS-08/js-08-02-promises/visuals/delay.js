function delay(ms, value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

console.log("start");
const wish = delay(500, "w-02");
wish.then((id) => {
  console.log("then:", id);
});
console.log("end");
