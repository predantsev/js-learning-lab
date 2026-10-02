const lamp = { name: "%%lamp%%", price: 45 };

function formatLabel(item) {
  if (item.price === null) {
    return item.name + " — %%noPrice%%";
  }
  return item.name + " — " + item.price + " %%uah%%";
}

// Keeping a tiny showLabel is fine: it is now only the one-line page update.
function showLabel(item) {
  document.querySelector("#label").textContent = formatLabel(item);
}

showLabel(lamp);
