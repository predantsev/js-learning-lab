// Changes the original and returns it: no copy at all.
function withTag(task, tag) {
  task.tags.push(tag);
  return task;
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
