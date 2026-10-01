// Wishlist labels: "name — price · category".
const noPrice = "%%noPrice%%";
const noCategory = "%%noCategory%%";

const mug = { name: "%%mug%%", price: 0, category: "%%home%%" };
const lamp = { name: "%%lamp%%", price: 45, category: "%%home%%" };
const tickets = { name: "%%tickets%%", price: null, category: null };
const phoneCase = { name: "%%phoneCase%%", price: 12, category: "" };

console.log(mug.name, "—", mug.price || noPrice, "·", mug.category || noCategory);
console.log(lamp.name, "—", lamp.price || noPrice, "·", lamp.category || noCategory);
console.log(tickets.name, "—", tickets.price || noPrice, "·", tickets.category || noCategory);
console.log(phoneCase.name, "—", phoneCase.price || noPrice, "·", phoneCase.category || noCategory);
