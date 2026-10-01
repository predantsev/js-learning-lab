const lamp = { name: "%%lamp%%", price: 45 };

const formatLabel = (item) => {
  const priceText = item.price === null ? "%%noPrice%%" : item.price + " %%uah%%";
  return item.name + " — " + priceText;
};

document.querySelector("#label").textContent = formatLabel(lamp);
