// ...task comes after the new tags: its tags field overrides them with the original array.
function withTag(task, tag) {
  return { tags: [...task.tags, tag], ...task };
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
