const preview = document.querySelector("#preview");
const previewBold = document.querySelector("#preview-bold");

// A name typed into the wishlist form. Anything can arrive here.
const typedName = '%%typed%%';

// innerHTML parses the name as HTML: the <img> from the name becomes a real element and its onerror code runs.
function renderName(container, name) {
  container.innerHTML = name;
}

function renderBold(container, name) {
  const strong = document.createElement("strong");
  strong.textContent = name;
  container.replaceChildren(strong);
}

renderName(preview, typedName);
renderBold(previewBold, typedName);
