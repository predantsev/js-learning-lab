const area = document.querySelector("#wishes");
const wishes = [
  { id: "w-01", name: "%%globe%%", price: 1200, image: "img/globe.svg" },
  { id: "w-02", name: "%%puzzle%%", price: null, image: "img/puzzle.svg" },
  { id: "w-03", name: "%%kettle%%", price: 850, image: "img/kettle.svg" },
];

// Rebuilds the content of #wishes from records: one card per record, or a message when there are none.
function createButton(text, wish) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", text + " " + wish.name);
  return button;
}

function createCard(wish) {
  const item = document.createElement("li");
  item.dataset.id = wish.id;
  const image = document.createElement("img");
  image.src = wish.image;
  image.alt = wish.name;
  const title = document.createElement("h3");
  title.textContent = wish.name;
  const price = document.createElement("p");
  price.textContent = wish.price === null ? "%%noPrice%%" : wish.price + " %%currency%%";
  item.append(image, title, price, createButton("%%edit%%", wish), createButton("%%delete%%", wish));
  return item;
}

function render(records) {
  if (records.length === 0) {
    const message = document.createElement("p");
    message.textContent = "%%empty%%";
    area.replaceChildren(message);
    return;
  }
  const list = document.createElement("ul");
  list.append(...records.map(createCard));
  area.append(list);
}

render(wishes);
