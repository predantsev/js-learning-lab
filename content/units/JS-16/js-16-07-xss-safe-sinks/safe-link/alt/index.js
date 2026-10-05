// Returns the address as a string normalized by the URL API when it is an http: or https: URL;
// returns null for any other scheme and for anything that is not an absolute address.
function safeLink(url) {
  if (typeof url !== "string" || !URL.canParse(url)) return null;
  const { protocol, href } = new URL(url);
  return ["http:", "https:"].includes(protocol) ? href : null;
}

// Shows a wish as a link to its shop when the shop link is safe, otherwise as plain text.
function renderWish(wish) {
  const item = document.createElement("li");
  const href = safeLink(wish.shopLink);
  const label = document.createElement(href ? "a" : "span");
  label.textContent = wish.name;
  if (href) label.setAttribute("href", href);
  item.append(label);
  return item;
}

const wishes = await (await fetch("./data/wishes.json")).json();
document.querySelector("#wishes").append(...wishes.map(renderWish));
