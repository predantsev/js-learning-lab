// Values from a form always arrive as text.
const quantityText = "3";
const priceText = "45";
const quantity = +quantityText;
console.log(quantity * +priceText);

const amount = Number("12 %%uah%%");
console.log(Number(""), amount, Number.isNaN(amount));
