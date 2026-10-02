// A shallow copy shares the tags array, so push changes the original too.
function withTag(task, tag) {
  const copy = { ...task };
  copy.tags.push(tag);
  return copy;
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
