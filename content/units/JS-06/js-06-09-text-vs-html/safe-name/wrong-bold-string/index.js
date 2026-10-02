const preview = document.querySelector("#preview");
const previewBold = document.querySelector("#preview-bold");

// A name typed into the wishlist form. Anything can arrive here.
const typedName = '%%typed%%';

function renderName(container, name) {
  container.textContent = name;
}

// The bold variant glues the name into an HTML string: the markup inside the name is parsed too.
function renderBold(container, name) {
  container.innerHTML = "<strong>" + name + "</strong>";
}

renderName(preview, typedName);
renderBold(previewBold, typedName);
