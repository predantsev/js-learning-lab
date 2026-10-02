import { requestWishes } from "./lab-modes.js";
import { withTimeout } from "./timeout.js";

// Requests the wishes in the given mode and prints how the request ended.
async function tryMode(mode) {
  const startedAt = Date.now();
  console.log(mode + ": %%started%%");
  try {
    const response = await withTimeout(requestWishes(mode, "%%lang%%"), 3000);
    console.log(mode + ": %%answered%%", response.status, "ok:", response.ok, Date.now() - startedAt, "%%ms%%");
  } catch (error) {
    console.log(mode + ": %%rejected%%", error.name, "—", error.message, Date.now() - startedAt, "%%ms%%");
  }
}

for (const button of document.querySelectorAll("[data-mode]")) {
  button.addEventListener("click", () => tryMode(button.dataset.mode));
}
