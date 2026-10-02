const area = document.querySelector("#wishes");
const wishes = [
  { id: "w-01", name: "%%globe%%", price: 1200, image: "img/globe.svg" },
  { id: "w-02", name: "%%puzzle%%", price: null, image: "img/puzzle.svg" },
  { id: "w-03", name: "%%kettle%%", price: 850, image: "img/kettle.svg" },
];

// Rebuilds the content of #wishes from records: one card per record, or a message when there are none.
function render(records) {
}

render(wishes);
