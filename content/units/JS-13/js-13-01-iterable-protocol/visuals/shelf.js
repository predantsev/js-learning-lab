const shelf = {
  wishes: ["%%headphones%%", "%%lamp%%"],
  [Symbol.iterator]() {
    let index = 0;
    const wishes = this.wishes;
    return {
      next() {
        if (index < wishes.length) {
          const result = { value: wishes[index], done: false };
          index = index + 1;
          return result;
        }
        return { value: undefined, done: true };
      },
    };
  },
};
for (const wish of shelf) {
  console.log(wish);
}
console.log("end");
