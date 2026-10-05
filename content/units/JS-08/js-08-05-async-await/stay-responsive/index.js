const status = document.querySelector("#status");
const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function load() {
  status.textContent = "%%loading%%";
  console.log("load: %%waiting%%");
  await delay(1000);
  status.textContent = "%%loaded%%";
  console.log("load: %%done%%");
}

document.querySelector("#load").addEventListener("click", async () => {
  console.log("%%before%%");
  load();
  console.log("%%after%%");
});
