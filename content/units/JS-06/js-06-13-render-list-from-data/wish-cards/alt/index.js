const area = document.querySelector("#wishes");
const wishes = [
  { id: "w-01", name: "%%globe%%", price: 1200, image: "img/globe.svg" },
  { id: "w-02", name: "%%puzzle%%", price: null, image: "img/puzzle.svg" },
  { id: "w-03", name: "%%kettle%%", price: 850, image: "img/kettle.svg" },
];

// Rebuilds the content of #wishes from records: one card per record, or a message when there are none.
function render(records) {
  area.replaceChildren();
  if (records.length === 0) {
    const message = document.createElement("p");
    message.textContent = "%%empty%%";
    area.append(message);
    return;
  }
  const list = document.createElement("ul");
  for (const wish of records) {
    const item = document.createElement("li");
    const title = document.createElement("h3");
    title.textContent = wish.name;
    const image = document.createElement("img");
    image.setAttribute("src", wish.image);
    image.setAttribute("alt", wish.name);
    const price = document.createElement("p");
    if (wish.price === null) {
      price.textContent = "%%noPrice%%";
    } else {
      price.textContent = `${wish.price} %%currency%%`;
    }
    const edit = document.createElement("button");
    edit.setAttribute("type", "button");
    edit.textContent = "%%edit%%";
    edit.setAttribute("aria-label", `%%edit%%: ${wish.name}`);
    const remove = document.createElement("button");
    remove.setAttribute("type", "button");
    remove.textContent = "%%delete%%";
    remove.setAttribute("aria-label", `%%delete%%: ${wish.name}`);
    item.append(title, image, price, edit, remove);
    list.append(item);
  }
  area.append(list);
}

render(wishes);
