const store = {
  saved: false,
  markSaved() {
    this.saved = true;
  },
};

function fire(handler) {
  handler();
}

try {
  fire(store.markSaved);
} catch (error) {
  console.log(error.name);
}
console.log(store.saved);
fire(() => store.markSaved());
console.log(store.saved);
