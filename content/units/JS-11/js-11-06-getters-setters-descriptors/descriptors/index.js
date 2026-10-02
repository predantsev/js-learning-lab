class Wish {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  get isPriced() {
    return this.price !== null;
  }
}

const wish = new Wish("%%tickets%%", null);

const own = Object.getOwnPropertyDescriptor(wish, "name");
const accessor = Object.getOwnPropertyDescriptor(Wish.prototype, "isPriced");

console.log(own.writable, own.enumerable);
console.log(typeof accessor.get, typeof accessor.set, accessor.enumerable);
console.log(wish.isPriced);
console.log(Object.keys(wish).join());
console.log(JSON.stringify(wish));
