// Prints what the thrown value carries: its name, its message and its stack trace.
window.addEventListener("error", (event) => {
  console.log("name: " + event.error.name);
  console.log("message: " + event.error.message);
  console.log(event.error.stack);
});

function setPriority(task, priority) {
  if (priority !== "low" && priority !== "normal" && priority !== "high") {
    throw "bad priority";
    // throw new RangeError("priority must be low, normal or high, got " + priority);
  }
  return { ...task, priority: priority };
}

const books = setPriority({ id: "t-02", title: "%%books%%", priority: "normal" }, "high");
console.log(books.title + ": " + books.priority);
setPriority(books, "urgent");
