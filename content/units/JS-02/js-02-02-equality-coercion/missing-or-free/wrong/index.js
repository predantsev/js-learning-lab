// "No price feels like false": == turns 0 into false, while null and undefined never equal false.
const mug = { name: "%%mug%%", price: 0 };
const tickets = { name: "%%tickets%%", price: null };
const book = { name: "%%book%%" };

const mugPriceMissing = mug.price == false;
const ticketsPriceMissing = tickets.price == false;
const bookPriceMissing = book.price == false;

console.log(mug.name, mugPriceMissing);
console.log(tickets.name, ticketsPriceMissing);
console.log(book.name, bookPriceMissing);
