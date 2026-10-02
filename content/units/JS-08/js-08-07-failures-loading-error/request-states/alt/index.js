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
  const messages = {
    http: "%%httpError%% (" + state.httpStatus + ")",
    network: "%%networkError%%",
    timeout: "%%timeoutError%%",
  };
  switch (state.status) {
    case "loading":
      status.textContent = "%%loading%%";
      list.replaceChildren();
      break;
    case "success":
      status.textContent = "%%loaded%%";
      list.replaceChildren(...state.items.map((wish) => {
        const item = document.createElement("li");
        item.textContent = wish.name;
        return item;
      }));
      break;
    default:
      status.textContent = messages[state.kind];
      list.replaceChildren();
  }
}

// Loads the wishes in the given mode and moves the page through the states:
// loading first, then success or one of the three errors.
// Use requestWishes(mode, "%%lang%%") and wait for it at most 3000 ms with withTimeout.
async function load(mode) {
  renderRequestState({ status: "loading" });
  let response;
  try {
    response = await withTimeout(requestWishes(mode, "%%lang%%"), 3000);
  } catch (error) {
    if (error instanceof TypeError) {
      renderRequestState({ status: "error", kind: "network" });
    } else {
      renderRequestState({ status: "error", kind: "timeout" });
    }
    return;
  }
  if (response.ok) {
    const body = await response.json();
    renderRequestState({ status: "success", items: body.items });
  } else {
    renderRequestState({ status: "error", kind: "http", httpStatus: response.status });
  }
}

document.querySelector("#load").addEventListener("click", () => {
  load(document.querySelector("#mode").value);
});
