const lamp = { name: "%%lamp%%", price: 45 };

// Renamed, but not split: formatLabel still writes to the page and returns nothing.
function formatLabel(item) {
  let text = item.name;
  if (item.price === null) {
    text = text + " — %%noPrice%%";
  } else {
    text = text + " — " + item.price + " %%uah%%";
  }
  document.querySelector("#label").textContent = text;
}

formatLabel(lamp);
