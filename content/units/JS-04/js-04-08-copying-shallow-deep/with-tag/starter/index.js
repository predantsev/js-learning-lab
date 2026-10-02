// A copy of the task whose tags array has one more tag at the end.
// The original task and its tags array must stay unchanged.
function withTag(task, tag) {
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
