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
