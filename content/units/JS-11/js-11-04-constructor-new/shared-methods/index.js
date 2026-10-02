function Item(name, price) {
  this.name = name;
  this.price = price;
}

Item.prototype.describe = function () {
  return this.name + ": " + this.price;
};

const lamp = new Item("%%lamp%%", 45);
const mug = new Item("%%mug%%", 18);

console.log(lamp.describe());
console.log(mug.describe());
console.log(lamp.describe === mug.describe);
console.log(Object.keys(lamp).join(", "));
console.log(lamp instanceof Item);
