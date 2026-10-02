// Find the nodes this program works with.
const list = document.querySelector("#habits");
const status = document.querySelector("#status");

// 1. Create a new list item and attach it at the end of the list.
const item = document.createElement("li");
item.textContent = "%%newHabit%%";
list.append(item);

// 2. Change the text of a node that already exists.
status.textContent = "%%statusCount%% " + document.querySelectorAll("#habits li").length;

// The console shows the node as it is now, in the DOM.
console.log(list);
