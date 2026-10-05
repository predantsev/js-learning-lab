// The habit page to audit. Read-only: write your findings in audit.js.
let habits = [
  { id: "h-01", name: "%%exercise%%", active: true, today: false },
  { id: "h-02", name: "%%read%%", active: true, today: true },
  { id: "h-05", name: "%%words%%", active: false, today: false },
];
let show = "active";

function render() {
  const query = document.querySelector("#search").value.trim().toLowerCase();
  const list = document.querySelector("#habits");
  list.replaceChildren();
  for (const habit of habits) {
    if ((show === "active" && !habit.active) || !habit.name.toLowerCase().includes(query)) continue;
    const item = document.createElement("li");
    item.textContent = habit.name;
    const toggle = document.createElement("div");
    toggle.className = habit.today ? "toggle done" : "toggle";
    toggle.setAttribute("role", "button");
    toggle.textContent = "%%today%%";
    toggle.addEventListener("click", () => {
      habits = habits.map((h) => (h.id === habit.id ? { ...h, today: !h.today } : h));
      document.querySelector("#saved").textContent = "%%savedMessage%%";
      render();
    });
    item.append(toggle);
    list.append(item);
  }
}

document.querySelector("#new-habit").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#habit-name").value.trim();
  document.querySelector("#name-error").hidden = name !== "";
  if (name === "") return;
  habits = [...habits, { id: "h-" + Date.now(), name, active: true, today: false }];
  document.querySelector("#saved").textContent = "%%savedMessage%%";
  render();
});

// "Suggestions": meant to keep the focus in the search field while it is not empty.
document.querySelector("#search").addEventListener("keydown", (event) => {
  if (event.key === "Tab" && event.target.value !== "") event.preventDefault();
});
document.querySelector("#search").addEventListener("input", render);
for (const chip of document.querySelectorAll(".chip")) {
  chip.addEventListener("click", () => {
    show = chip.dataset.show;
    render();
  });
}

render();
