// === null misses the field that is not there at all (undefined).
const mug = { name: "%%mug%%", price: 0 };
const tickets = { name: "%%tickets%%", price: null };
const book = { name: "%%book%%" };

const mugPriceMissing = mug.price === null;
const ticketsPriceMissing = tickets.price === null;
const bookPriceMissing = book.price === null;

console.log(mug.name, mugPriceMissing);
console.log(tickets.name, ticketsPriceMissing);
console.log(book.name, bookPriceMissing);
