// Also accepted: a deep copy works, although it copies more than needed.
function withTag(task, tag) {
  const copy = structuredClone(task);
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
