const proto = {
  kind: "base",
  describe() {
    return this.kind + ": " + this.name;
  },
};

const item = Object.create(proto);
item.name = "%%lamp%%";

console.log(item.describe());
console.log(Object.hasOwn(item, "describe"));
console.log("describe" in item);
console.log(Object.getPrototypeOf(item) === proto);
console.log(item.color);
