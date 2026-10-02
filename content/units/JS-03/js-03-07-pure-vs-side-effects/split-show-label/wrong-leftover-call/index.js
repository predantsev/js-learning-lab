const lamp = { name: "%%lamp%%", price: 45 };

function formatLabel(item) {
  let text = item.name;
  if (item.price === null) {
    text = text + " — %%noPrice%%";
  } else {
    text = text + " — " + item.price + " %%uah%%";
  }
  return text;
}

// showLabel was deleted, but its call was left behind: a ReferenceError, and the page stays empty.
showLabel(lamp);
