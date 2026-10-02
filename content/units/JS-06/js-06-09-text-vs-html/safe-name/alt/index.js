const preview = document.querySelector("#preview");
const previewBold = document.querySelector("#preview-bold");

// A name typed into the wishlist form. Anything can arrive here.
const typedName = '%%typed%%';

// The text goes into a new <span>; the container is emptied first with textContent = "".
function renderName(container, name) {
  const span = document.createElement("span");
  span.textContent = name;
  container.textContent = "";
  container.append(span);
}

function renderBold(container, name) {
  container.textContent = "";
  const strong = document.createElement("strong");
  strong.append(name);
  container.append(strong);
}

renderName(preview, typedName);
renderBold(previewBold, typedName);
