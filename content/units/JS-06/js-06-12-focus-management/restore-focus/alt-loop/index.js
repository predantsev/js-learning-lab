const list = document.querySelector("#habits");
const heading = document.querySelector("#habits-title");
let habits = [
  { id: "h-01", name: "%%habit1%%", active: true },
  { id: "h-02", name: "%%habit2%%", active: true },
  { id: "h-03", name: "%%habit3%%", active: false },
];

// Ready-made: rebuilds the whole list from the array. Every call creates NEW nodes.
function rebuildList() {
  list.replaceChildren();
  for (const habit of habits) {
    const item = document.createElement("li");
    item.dataset.id = habit.id;
    const name = document.createElement("span");
    name.className = habit.active ? "name" : "name paused";
    name.textContent = habit.name;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.dataset.action = "toggle";
    toggle.textContent = habit.active ? "%%pause%%" : "%%resume%%";
    toggle.setAttribute("aria-label", toggle.textContent + ": " + habit.name);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "delete";
    remove.textContent = "%%delete%%";
    remove.setAttribute("aria-label", "%%delete%%: " + habit.name);
    item.append(name, toggle, remove);
    list.append(item);
  }
}

// Ready-made: one delegated listener for both actions; after a change it calls refresh().
list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("li").dataset.id;
  if (button.dataset.action === "toggle") {
    habits = habits.map((habit) => (habit.id === id ? { ...habit, active: !habit.active } : habit));
  } else {
    habits = habits.filter((habit) => habit.id !== id);
  }
  refresh();
});

// Your part: rebuild the list, but keep the keyboard user's place.
// 1. Before rebuilding, remember which habit and which button (data-action) had focus, if focus was in the list.
// 2. Rebuild the list.
// 3. Focus the button with the same data-action in the same habit's new card.
//    If that habit is gone, focus the list heading. If focus was not in the list, leave it alone.
function refresh() {
  const focusedItem = document.activeElement.closest("li");
  const wasInList = focusedItem !== null && focusedItem.parentElement === list;
  const id = wasInList ? focusedItem.dataset.id : "";
  const action = document.activeElement.dataset.action;
  rebuildList();
  if (!wasInList) {
    return;
  }
  for (const item of list.querySelectorAll("li")) {
    if (item.dataset.id === id) {
      item.querySelector('[data-action="' + action + '"]').focus();
      return;
    }
  }
  heading.focus();
}

refresh();
