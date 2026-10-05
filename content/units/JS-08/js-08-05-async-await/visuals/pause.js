function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function load() {
  const count = 3;
  console.log("load: wait");
  await delay(100);
  console.log("load: back", count);
}

console.log("main: start");
load();
console.log("main: end");
