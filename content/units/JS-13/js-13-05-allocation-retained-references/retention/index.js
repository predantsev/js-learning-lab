// Two roots this page keeps: a module-level cache and the window's listeners.
const cache = new Map();
const liveListeners = new Map(); // handler → how many records its closure holds (for the report)

function makeRecords(count) {
  return Array.from({ length: count }, (_, i) => ({ id: "e-" + (i + 1), amountMinor: 1000 }));
}

function openPanel(name) {
  const records = makeRecords(10000);
  const panel = document.createElement("section");
  panel.textContent = name + ": " + records.length;
  document.body.append(panel);
  cache.set(name, records);
  const onResize = () => console.log(name, records.length);
  window.addEventListener("resize", onResize);
  liveListeners.set(onResize, records.length);
  return { name, panel, onResize };
}

function closePanel(handle) {
  handle.panel.remove();
}

function report(label) {
  let held = 0;
  for (const count of liveListeners.values()) {
    held = held + count;
  }
  console.log(label, "%%sections%%", document.querySelectorAll("section").length, "%%cache%%", cache.size, "%%listeners%%", liveListeners.size, "%%held%%", held);
}

const food = openPanel("%%food%%");
const fun = openPanel("%%fun%%");
report("%%opened%%");

closePanel(food);
closePanel(fun);
report("%%closed%%");
