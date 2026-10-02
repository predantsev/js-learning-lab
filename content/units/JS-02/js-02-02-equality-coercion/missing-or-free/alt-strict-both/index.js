// Both missing values checked explicitly with ===.
const mug = { name: "%%mug%%", price: 0 };
const tickets = { name: "%%tickets%%", price: null };
const book = { name: "%%book%%" };

const mugPriceMissing = mug.price === null || mug.price === undefined;
const ticketsPriceMissing = tickets.price === null || tickets.price === undefined;
const bookPriceMissing = book.price === null || book.price === undefined;

console.log(mug.name, mugPriceMissing);
console.log(tickets.name, ticketsPriceMissing);
console.log(book.name, bookPriceMissing);
