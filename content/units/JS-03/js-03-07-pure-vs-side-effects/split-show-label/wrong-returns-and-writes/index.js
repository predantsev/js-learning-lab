const lamp = { name: "%%lamp%%", price: 45 };

// Half split: formatLabel returns the text but also still writes to the page.
function formatLabel(item) {
  let text = item.name;
  if (item.price === null) {
    text = text + " — %%noPrice%%";
  } else {
    text = text + " — " + item.price + " %%uah%%";
  }
  document.querySelector("#label").textContent = text;
  return text;
}

document.querySelector("#label").textContent = formatLabel(lamp);
