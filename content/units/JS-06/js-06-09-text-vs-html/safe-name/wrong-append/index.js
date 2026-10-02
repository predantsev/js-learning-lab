const preview = document.querySelector("#preview");
const previewBold = document.querySelector("#preview-bold");

// A name typed into the wishlist form. Anything can arrive here.
const typedName = '%%typed%%';

// Safe, but every call adds to what was shown before instead of replacing it.
function renderName(container, name) {
  const span = document.createElement("span");
  span.textContent = name;
  container.append(span);
}

function renderBold(container, name) {
  const strong = document.createElement("strong");
  strong.textContent = name;
  container.append(strong);
}

renderName(preview, typedName);
renderBold(previewBold, typedName);
