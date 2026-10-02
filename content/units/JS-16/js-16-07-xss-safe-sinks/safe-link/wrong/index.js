// Returns the address as a string normalized by the URL API when it is an http: or https: URL;
// returns null for any other scheme and for anything that is not an absolute address.
function safeLink(url) {
  // A blocklist: refuses only addresses that start exactly with "javascript:".
  if (typeof url !== "string" || url.startsWith("javascript:")) return null;
  return url;
}

// Shows a wish as a link to its shop when the shop link is safe, otherwise as plain text.
function renderWish(wish) {
  const item = document.createElement("li");
  const href = safeLink(wish.shopLink);
  if (href === null) {
    item.textContent = wish.name;
    return item;
  }
  const link = document.createElement("a");
  link.href = href;
  link.textContent = wish.name;
  item.append(link);
  return item;
}

const wishes = await (await fetch("./data/wishes.json")).json();
document.querySelector("#wishes").append(...wishes.map(renderWish));
