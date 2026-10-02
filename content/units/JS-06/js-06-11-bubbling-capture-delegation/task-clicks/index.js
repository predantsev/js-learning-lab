const list = document.querySelector("#tasks");

// Every button gets its own listener — but only the buttons that exist right now.
for (const button of list.querySelectorAll("button")) {
  button.addEventListener("click", () => {
    console.log("%%marked%%", button.closest("li").dataset.id);
  });
}

// A task added after the listeners were attached.
const item = document.createElement("li");
item.dataset.id = "t-05";
const title = document.createElement("span");
title.textContent = "%%task5%%";
const button = document.createElement("button");
button.type = "button";
button.textContent = "%%done%%";
item.append(title, " ", button);
list.append(item);
