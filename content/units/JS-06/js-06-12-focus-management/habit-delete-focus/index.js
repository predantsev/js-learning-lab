const list = document.querySelector("#habits");
let habits = [
  { id: "h-01", name: "%%habit1%%" },
  { id: "h-02", name: "%%habit2%%" },
  { id: "h-03", name: "%%habit3%%" },
  { id: "h-04", name: "%%habit4%%" },
];

// Rebuilds the whole list from the array: every call creates new nodes.
function rebuildList() {
  list.replaceChildren();
  for (const habit of habits) {
    const item = document.createElement("li");
    item.dataset.id = habit.id;
    const name = document.createElement("span");
    name.textContent = habit.name;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "%%delete%%";
    button.setAttribute("aria-label", "%%delete%%: " + habit.name);
    item.append(name, " ", button);
    list.append(item);
  }
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null) {
    return;
  }
  const id = button.closest("li").dataset.id;
  const index = habits.findIndex((habit) => habit.id === id); // the position of the deleted habit
  habits = habits.filter((habit) => habit.id !== id);
  rebuildList();
  console.log("%%focusNow%%", document.activeElement.tagName);
});

rebuildList();
