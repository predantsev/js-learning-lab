const task = { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false, priority: "high" };

// Serialize: the object becomes text.
const text = JSON.stringify(task);
console.log(text);

// Deserialize: the text becomes a new object.
const back = JSON.parse(text);
console.log(back.title, back.dueDate, back === task);
