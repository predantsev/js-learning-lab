const task = { title: "%%water%%", dueDate: "2026-03-02" };

function formatWith(record, formatter) {
  return formatter(record);
}

const shortLabel = (record) => record.title;
const longLabel = (record) => record.title + " (" + (record.dueDate ?? "%%noDue%%") + ")";

console.log(formatWith(task, shortLabel));
