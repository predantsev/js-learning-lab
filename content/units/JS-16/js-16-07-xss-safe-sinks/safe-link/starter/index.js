// Returns the address as a string normalized by the URL API when it is an http: or https: URL;
// returns null for any other scheme and for anything that is not an absolute address.
function safeLink(url) {
  // your code here
}

// Shows a wish as a link to its shop when the shop link is safe, otherwise as plain text.
function renderWish(wish) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = wish.shopLink; // any scheme gets through here, javascript: included
  link.textContent = wish.name;
  item.append(link);
  return item;
}

const wishes = await (await fetch("./data/wishes.json")).json();
document.querySelector("#wishes").append(...wishes.map(renderWish));
