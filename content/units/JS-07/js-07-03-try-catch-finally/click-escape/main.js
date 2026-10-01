const wishes = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-05", name: "%%tickets%%", price: null },
];
const button = document.querySelector("#count");
const status = document.querySelector("#status");

function totalPrice(list) {
  let total = 0;
  for (const wish of list) {
    if (wish.price === null) {
      throw new TypeError("wish " + wish.id + " has no price");
    }
    total = total + wish.price;
  }
  return total;
}

try {
  button.addEventListener("click", () => {
    button.disabled = true;
    status.textContent = "%%counting%%";
    status.textContent = "%%total%%" + totalPrice(wishes) + " %%uah%%";
    button.disabled = false;
  });
} catch (error) {
  status.textContent = "%%failed%%" + error.message;
}
