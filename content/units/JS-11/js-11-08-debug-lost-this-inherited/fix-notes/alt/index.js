// A small notes app. Four things in it are broken: find each one
// and repair it with the smallest change that keeps the behavior.

class NoteStore {
  notes = [];
  saved = false;

  add(text) {
    this.notes.push(text);
  }

  markSaved() {
    this.saved = true;
  }
}

// Clicking the button must mark the store as saved.
function wireSaveButton(store, button) {
  button.addEventListener("click", store.markSaved.bind(store));
}

// start() must make tick() run once, 10 ms later, on this poller.
class Poller {
  ticks = 0;

  tick() {
    this.ticks += 1;
  }

  start() {
    setTimeout(this.tick.bind(this), 10);
  }
}

// Every basket must have its own list of tags.
function Basket(name) {
  this.name = name;
  this.tags = [];
}
Basket.prototype.addTag = function (tag) {
  this.tags.push(tag);
};

// createBasket(name) must return a new Basket.
function createBasket(name) {
  return new Basket(name);
}

// A short demo of three of the problems.
const store = new NoteStore();
const saveButton = document.createElement("button");
wireSaveButton(store, saveButton);
saveButton.click();
console.log("saved: " + store.saved);

const first = new Basket("%%lamp%%");
const second = new Basket("%%mug%%");
first.addTag("%%gift%%");
console.log("tags of the second basket: " + second.tags.length);

try {
  console.log(createBasket("%%tickets%%").name);
} catch (error) {
  console.log(error.name);
}
