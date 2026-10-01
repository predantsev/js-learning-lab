// Too small a scope: each priceText lives only inside its branch,
// so the return line cannot see it (ReferenceError).
function makeLabel(name, price) {
  if (price === null) {
    const priceText = "%%noPrice%%";
  } else {
    const priceText = price + " %%uah%%";
  }
  return name + " — " + priceText;
}

console.log(makeLabel("%%headphones%%", 80));
console.log(makeLabel("%%tickets%%", null));
