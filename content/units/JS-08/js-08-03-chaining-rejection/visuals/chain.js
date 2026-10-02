const prices = { "w-01": 80, "w-05": null };

Promise.resolve("w-05")
  .then((id) => prices[id])
  .then((price) => {
    if (price === null) {
      throw new Error("no price");
    }
    return price;
  })
  .then((price) => price + " %%currency%%")
  .catch((error) => "%%unknown%%")
  .then((label) => console.log(label))
  .finally(() => console.log("%%loadingOff%%"));
