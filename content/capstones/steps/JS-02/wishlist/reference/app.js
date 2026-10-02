// The project script. It runs after the page has loaded.
// It describes two wishes and a draft of a new one, builds the text for the page
// and writes it into the empty paragraphs of index.html.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// Two wishes of the list. A missing price or category is null.
const firstItem = { id: "w-01", name: "%%nameValue%%", price: 80, acquired: false, category: "%%firstCategory%%" };
const secondItem = { id: "w-05", name: "%%secondName%%", price: null, acquired: false, category: null };

// A label is the name, then the price, or a fallback text when there is no price.
const firstLabel = firstItem.name + " — " + (firstItem.price ?? "%%noPrice%%");
const secondLabel = secondItem.name + " — " + (secondItem.price ?? "%%noPrice%%");

// A draft of a new wish, as a form will send it later.
const draft = { name: "", price: -5 };

// One message per field; an empty string means the field is fine.
let nameMessage = "";
if (draft.name === "") {
  nameMessage = "%%requiredMessage%%";
}

let priceMessage = "";
if (draft.price !== null && draft.price < 0) {
  priceMessage = "%%invalidMessage%%";
}

// Each line finds the element with this id and writes the text into it.
document.querySelector("#first-label").textContent = firstLabel;
document.querySelector("#second-label").textContent = secondLabel;
document.querySelector("#name-message").textContent = nameMessage;
document.querySelector("#price-message").textContent = priceMessage;
