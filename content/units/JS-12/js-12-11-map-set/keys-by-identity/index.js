const wishes = [
  { id: "w-01", name: "%%headphones%%", category: "%%tech%%" },
  { id: "w-02", name: "%%lamp%%", category: "%%home%%" },
  { id: "w-06", name: "%%mug%%", category: "%%home%%" },
];

// A Set keeps each value once: here, the categories in use.
const categories = new Set(wishes.map((wish) => wish.category));
console.log("%%categories%%", categories.size, [...categories]);

// A Map from a wish to a private note, keyed by the wish object itself.
const notes = new Map();
notes.set(wishes[0], "%%note%%");

// Later the list is loaded again from storage: new objects with the same contents.
const reloaded = JSON.parse(JSON.stringify(wishes));
console.log("%%sameObject%%", notes.get(wishes[0]));
console.log("%%reloadedObject%%", notes.get(reloaded[0]));
