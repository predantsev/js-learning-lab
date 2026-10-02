// Also valid: copy the array first, push into the copy, then build the new record.
function withTag(task, tag) {
  const tags = [...task.tags];
  tags.push(tag);
  return { ...task, tags: tags };
}

const task = {
  id: "t-05",
  title: "%%dentist%%",
  tags: ["%%tagHealth%%"],
};
console.log(withTag(task, "%%tagUrgent%%"));
console.log(task);
