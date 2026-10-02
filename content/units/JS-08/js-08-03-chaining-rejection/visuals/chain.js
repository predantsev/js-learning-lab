const prices = { "w-01": 80, "w-05": null };

Promise.resolve("w-05")
  .then((id) => prices[id])
  .then((price) => {
    if (price === null) {
      throw new Error("no price");
    }
    return price;
  })
  .then((price) => price + " UAH")
  .catch((error) => "price unknown")
  .then((label) => console.log(label))
  .finally(() => console.log("loading off"));
