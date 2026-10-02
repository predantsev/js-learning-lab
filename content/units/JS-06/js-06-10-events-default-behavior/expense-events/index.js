const form = document.querySelector("#expense-form");
const list = document.querySelector("#expenses");

// The listener: the browser calls it every time the form is submitted.
function onSubmit(event) {
  event.preventDefault();
  const label = form.elements.label.value;
  const amount = form.elements.amount.value;
  console.log("%%submitted%%", label, amount);
  const item = document.createElement("li");
  item.textContent = label + " — " + amount + " %%currency%%";
  list.append(item);
  form.reset();
}

// Connects the form to its listener. Every call creates a new arrow function.
function setup() {
  form.addEventListener("submit", (event) => onSubmit(event));
}

setup();
