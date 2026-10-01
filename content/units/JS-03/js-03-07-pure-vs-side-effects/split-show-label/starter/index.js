const lamp = { name: "%%lamp%%", price: 45 };

// showLabel does two jobs at once: it builds the text AND writes it to the page.
function showLabel(item) {
  let text = item.name;
  if (item.price === null) {
    text = text + " — %%noPrice%%";
  } else {
    text = text + " — " + item.price + " %%uah%%";
  }
  document.querySelector("#label").textContent = text;
}

showLabel(lamp);
