// What people typed into the "how many?" field of a form.
const typed = ["3", " 12 ", "", "2.5", "12px", "1,5", "0x10"];

function readQuantity(text) {
  return parseFloat(text);
}

for (const text of typed) {
  console.log(JSON.stringify(text), "→", readQuantity(text));
}
