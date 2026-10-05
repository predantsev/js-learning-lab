import { requestWishes } from "./lab-modes.js";
import { withTimeout } from "./timeout.js";

const status = document.querySelector("#status");
const list = document.querySelector("#list");

// Shows one request state on the page. The possible states:
//   { status: "loading" }
//   { status: "success", items: [ { id, name }, … ] }
//   { status: "error", kind: "http", httpStatus: 500 }
//   { status: "error", kind: "network" }
//   { status: "error", kind: "timeout" }
function renderRequestState(state) {
  list.replaceChildren();
  if (state.status === "loading") {
    status.textContent = "%%loading%%";
  } else if (state.status === "success") {
    status.textContent = "%%loaded%%";
    for (const wish of state.items) {
      const item = document.createElement("li");
      item.textContent = wish.name;
      list.append(item);
    }
  } else if (state.kind === "http") {
    status.textContent = "%%httpError%% (" + state.httpStatus + ")";
  } else if (state.kind === "network") {
    status.textContent = "%%networkError%%";
  } else {
    status.textContent = "%%timeoutError%%";
  }
}

// Loads the wishes in the given mode and moves the page through the states:
// loading first, then success or one of the three errors.
// Use requestWishes(mode, "%%lang%%") and wait for it at most 3000 ms with withTimeout.
// Mistake: no timeout, so a request that never answers keeps "Loading…" forever.
async function load(mode) {
  renderRequestState({ status: "loading" });
  try {
    const response = await requestWishes(mode, "%%lang%%");
    if (!response.ok) {
      renderRequestState({ status: "error", kind: "http", httpStatus: response.status });
      return;
    }
    const body = await response.json();
    renderRequestState({ status: "success", items: body.items });
  } catch (error) {
    renderRequestState({ status: "error", kind: "network" });
  }
}

document.querySelector("#load").addEventListener("click", () => {
  load(document.querySelector("#mode").value);
});
