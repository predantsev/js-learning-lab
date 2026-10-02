let ticks = 0;

function mountClock(root) {
  const clock = document.createElement("p");
  clock.textContent = "%%clock%%";
  root.append(clock);

  const id = setInterval(() => {
    ticks = ticks + 1;
  }, 300);
  window.addEventListener("resize", () => {
    console.log("%%resized%%");
  });

  return function teardown() {
    clock.remove();
  };
}

const teardown = mountClock(document.body);
teardown();

window.dispatchEvent(new Event("resize"));
setTimeout(() => {
  console.log("%%ticks%%", ticks);
}, 1050);
