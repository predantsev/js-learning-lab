// Three wishes. A price of 0 means "free"; null means "no price yet".
// The book has no price field at all, so book.price reads undefined.
const mug = { name: "%%mug%%", price: 0 };
const tickets = { name: "%%tickets%%", price: null };
const book = { name: "%%book%%" };

// Replace each false with a comparison that is true only when the price is missing.
const mugPriceMissing = false;
const ticketsPriceMissing = false;
const bookPriceMissing = false;

console.log(mug.name, mugPriceMissing);
console.log(tickets.name, ticketsPriceMissing);
console.log(book.name, bookPriceMissing);
