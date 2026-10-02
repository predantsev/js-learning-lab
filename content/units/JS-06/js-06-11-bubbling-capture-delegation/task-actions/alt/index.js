const list = document.querySelector("#tasks");
const status = document.querySelector("#status");

// Ready-made: what each action does with the task's <li>.
function editTask(item) {
  status.textContent = "%%editing%% " + item.querySelector(".title").textContent;
}

function deleteTask(item) {
  status.textContent = "%%deleted%% " + item.querySelector(".title").textContent;
  item.remove();
}

// Your part: ONE click listener on the list.
// Find the button that was clicked and its task, then call editTask or deleteTask
// according to the button's data-action. A click anywhere else must change nothing.
// Optional chaining instead of an if, and a switch over the action.
list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  const item = button?.closest("[data-id]");
  switch (button?.dataset.action) {
    case "edit":
      editTask(item);
      break;
    case "delete":
      deleteTask(item);
      break;
  }
});
