// The branch of the pull request, running on synthetic tasks.
import { renderGroups } from "./ui/page.js";

const tasks = [
  { id: "t-01", title: "%%plants%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  // A synthetic title with markup in it, as a person could type into the form.
  { id: "t-07", title: `<img src="missing.svg" alt="" onerror="console.log('%%injected%%')">%%grandma%%`, dueDate: "2026-03-01", done: false },
];

renderGroups(document.querySelector("#tasks"), tasks, (id) => console.log("%%doneClicked%%", id));
console.log("%%imagesInTitles%%", document.querySelectorAll("#tasks .title img").length);
