const preview = document.querySelector("#preview");
const previewBold = document.querySelector("#preview-bold");

// A name typed into the wishlist form. Anything can arrive here.
const typedName = '%%typed%%';

// 1. renderName(container, name): show the name in the container as plain text,
//    replacing whatever the container showed before.
function renderName(container, name) {
  container.textContent = name;
}

// 2. renderBold(container, name): the same, but bold — inside a <strong> element
//    that you create with document.createElement.
function renderBold(container, name) {
  const strong = document.createElement("strong");
  strong.textContent = name;
  container.replaceChildren(strong);
}

renderName(preview, typedName);
renderBold(previewBold, typedName);
