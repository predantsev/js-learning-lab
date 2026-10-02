const status = document.querySelector("#status");
const bicycle = { id: "w-03", name: "%%bicycle%%", price: 240 };

// Returns a promise that is fulfilled with `value` after `ms` milliseconds.
function delay(ms, value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

// Use delay to show the bicycle one second after the page loads:
// replace the text of #status with its name and price, for example
// "%%bicycle%% — 240 %%currency%%".
delay(1000, bicycle).then((record) => {
  status.textContent = record.name + " — " + record.price + " %%currency%%";
});
