const KEY = "jsll.wishlist.v1";
const BACKUP_KEY = "jsll.wishlist.v1.backup";
// The starting records (fixtures) of the project.
const FIXTURES = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
];

function isValidWish(wish) {
  return typeof wish === "object" && wish !== null
    && typeof wish.id === "string"
    && typeof wish.name === "string" && wish.name.trim() !== ""
    && (wish.price === null || (typeof wish.price === "number" && wish.price >= 0))
    && typeof wish.acquired === "boolean";
}

// Reads the saved wishes and checks them. On any problem, the text is copied to the backup key.
function loadWishes() {
  const text = localStorage.getItem(KEY);
  if (text === null) {
    return { wishes: FIXTURES, note: "%%firstStart%%" };
  }
  try {
    const saved = JSON.parse(text);
    if (saved?.schemaVersion !== 1 || !Array.isArray(saved.records)) {
      throw new Error("unexpected shape or version");
    }
    if (!saved.records.every(isValidWish)) {
      throw new Error("a saved wish is invalid");
    }
    return { wishes: saved.records, note: "%%loaded%%" };
  } catch (error) {
    console.log("%%loadFailed%%" + error.message);
    localStorage.setItem(BACKUP_KEY, text);
    return { wishes: FIXTURES, note: "%%damaged%%" };
  }
}

function saveWishes(wishes) {
  localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: wishes }));
}

function render(wishes) {
  const list = document.querySelector("#wishes");
  list.replaceChildren();
  for (const wish of wishes) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = wish.acquired;
    box.dataset.id = wish.id;
    label.append(box, " " + wish.name + " — %%acquired%%");
    item.append(label);
    list.append(item);
  }
}

let { wishes, note } = loadWishes();
document.querySelector("#message").textContent = note;
render(wishes);
saveWishes(wishes);

document.querySelector("#wishes").addEventListener("change", (event) => {
  const id = event.target.dataset.id;
  wishes = wishes.map((wish) => (wish.id === id ? { ...wish, acquired: event.target.checked } : wish));
  saveWishes(wishes);
});
