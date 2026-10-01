// An explicit missing-value check with == null works as well as ??.
const noPrice = "%%noPrice%%";
const noCategory = "%%noCategory%%";

const mug = { name: "%%mug%%", price: 0, category: "%%home%%" };
const lamp = { name: "%%lamp%%", price: 45, category: "%%home%%" };
const tickets = { name: "%%tickets%%", price: null, category: null };
const phoneCase = { name: "%%phoneCase%%", price: 12, category: "" };

console.log(mug.name, "—", mug.price == null ? noPrice : mug.price, "·", mug.category || noCategory);
console.log(lamp.name, "—", lamp.price == null ? noPrice : lamp.price, "·", lamp.category || noCategory);
console.log(tickets.name, "—", tickets.price == null ? noPrice : tickets.price, "·", tickets.category || noCategory);
console.log(phoneCase.name, "—", phoneCase.price == null ? noPrice : phoneCase.price, "·", phoneCase.category || noCategory);
