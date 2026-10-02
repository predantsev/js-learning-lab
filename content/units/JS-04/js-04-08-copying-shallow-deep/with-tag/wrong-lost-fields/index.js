// A new tags array, but the copy keeps nothing else from the task.
function withTag(task, tag) {
  return { tags: [...task.tags, tag] };
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
