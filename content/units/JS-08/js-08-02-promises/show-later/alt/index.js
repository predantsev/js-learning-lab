const status = document.querySelector("#status");
const bicycle = { id: "w-03", name: "%%bicycle%%", price: 240 };

// Returns a promise that is fulfilled with `value` after `ms` milliseconds.
// Another way to write it: an arrow function that returns the promise directly.
const delay = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// Use delay to show the bicycle one second after the page loads:
// replace the text of #status with its name and price, for example
// "%%bicycle%% — 240 %%currency%%".
function show(record) {
  status.textContent = record.name + " — " + record.price + " %%currency%%";
}

delay(1000, bicycle).then(show);
