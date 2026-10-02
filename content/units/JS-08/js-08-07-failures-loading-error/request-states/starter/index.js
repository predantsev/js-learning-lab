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
  // your code here
}

// Loads the wishes in the given mode and moves the page through the states:
// loading first, then success or one of the three errors.
// Use requestWishes(mode, "%%lang%%") and wait for it at most 3000 ms with withTimeout.
async function load(mode) {
  // your code here
}

document.querySelector("#load").addEventListener("click", () => {
  load(document.querySelector("#mode").value);
});
