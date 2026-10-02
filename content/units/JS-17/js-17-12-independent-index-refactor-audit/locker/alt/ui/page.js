import { createLocker } from "../domain/locker.ts";
import { FIXTURES, makeParcels } from "../fixtures.js";

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
    handOut.textContent = `%%handOut%% ${parcel.code}`;
    handOut.addEventListener("click", () => {
      const index = [...document.querySelectorAll("#waiting button")].indexOf(handOut);
      locker.pickUp(parcel.code);
      render();
      const buttons = document.querySelectorAll("#waiting button");
      if (buttons.length === 0) document.querySelector("#waiting-heading").focus();
      else buttons[Math.min(index, buttons.length - 1)].focus();
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

// The day's deliveries: 10,000 parcels arrive at once, with codes that no earlier day used.
let nextDay = 0;
document.querySelector("#load-day").addEventListener("click", () => {
  const start = performance.now();
  for (const parcel of makeParcels(10000, 2000 + nextDay * 10000)) locker.arrive(parcel);
  nextDay = nextDay + 1;
  render();
  const ms = performance.now() - start;
  document.querySelector("#status").textContent = `%%loaded%% ${locker.waitingCount()} · ${ms.toFixed(0)} ms`;
  console.log(`%%loaded%% ${locker.waitingCount()} · ${ms.toFixed(0)} ms`);
});

render();
