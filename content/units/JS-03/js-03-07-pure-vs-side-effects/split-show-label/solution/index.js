const lamp = { name: "%%lamp%%", price: 45 };

// Pure: builds and returns the label, changes nothing outside itself.
function formatLabel(item) {
  let text = item.name;
  if (item.price === null) {
    text = text + " — %%noPrice%%";
  } else {
    text = text + " — " + item.price + " %%uah%%";
  }
  return text;
}

// The side effect lives in one line at the edge.
document.querySelector("#label").textContent = formatLabel(lamp);
