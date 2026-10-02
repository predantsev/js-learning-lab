import { createLocker } from "../domain/locker.ts";
import { FIXTURES, makeParcels } from "../fixtures.js";

const CHECK_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor"/></svg>';
const locker = createLocker();
for (const parcel of FIXTURES) locker.arrive(parcel);

// Shows the 20 oldest waiting parcels, each with a button that hands it out.
function render() {
  const list = document.querySelector("#waiting");
  list.replaceChildren();
  for (const parcel of locker.oldest(20)) {
    const item = document.createElement("li");
    item.append(`${parcel.code} · ${parcel.recipient}`);
    const handOut = document.createElement("button");
    handOut.type = "button";
    handOut.dataset.code = parcel.code;
    handOut.innerHTML = CHECK_ICON;
    handOut.addEventListener("click", () => {
      locker.pickUp(parcel.code);
      render();
    });
    item.append(handOut);
    list.append(item);
  }
}

document.querySelector("#lookup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const code = document.querySelector("#lookup").value.trim();
  const parcel = locker.findByCode(code);
  document.querySelector("#status").textContent = parcel === null ? `${code}: %%notFound%%` : `${code}: %%waitingFor%% ${parcel.recipient}`;
});

// The day's deliveries: 10,000 parcels arrive at once.
document.querySelector("#load-day").addEventListener("click", () => {
  const start = performance.now();
  for (const parcel of makeParcels(10000)) locker.arrive(parcel);
  render();
  const ms = performance.now() - start;
  document.querySelector("#status").textContent = `%%loaded%% ${locker.waitingCount()} · ${ms.toFixed(0)} ms`;
  console.log(`%%loaded%% ${locker.waitingCount()} · ${ms.toFixed(0)} ms`);
});

render();
