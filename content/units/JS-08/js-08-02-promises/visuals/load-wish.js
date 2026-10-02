function loadWish(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: id, name: "%%lamp%%" });
    }, 500);
  });
}

console.log("start");
const wish = loadWish("w-02");
wish.then((record) => {
  console.log("then:", record.name);
});
console.log("end");
