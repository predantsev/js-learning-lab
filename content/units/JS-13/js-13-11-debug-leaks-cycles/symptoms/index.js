// Read-only driver. counter.js comes first, so it counts everything after it.
import { live } from "./counter.js";
import { mountPanel } from "./panel.js";
import { decodeChunks, fitPayload } from "./text.js";

const root = document.createElement("section");
document.body.append(root);

// 1. Five mount/teardown cycles must leave nothing live.
for (let i = 0; i < 5; i = i + 1) {
  const teardown = mountPanel(root, (element) => {
    element.textContent = "%%summary%%";
  });
  teardown();
}
console.log("%%live%%", live().listeners, live().timers);

// 2. "Київ" arrives in two chunks, cut in the middle of a letter.
const bytes = new TextEncoder().encode("Київ");
console.log(decodeChunks([bytes.slice(0, 3), bytes.slice(3)]));

// 3. 20 bytes do not fit into the limit.
console.log(fitPayload("Київ, Львів").problem);

// 4. A render that fails must be cleaned up and reported.
try {
  mountPanel(root, () => {
    throw new Error("%%broken%%");
  });
} catch (error) {
  console.log(error.message);
}
console.log("%%live%%", live().listeners, live().timers);
