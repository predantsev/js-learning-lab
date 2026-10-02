const task = { title: "%%water%%", dueDate: "2026-03-02" };

// printWith calls whatever formatter it receives and prints the result.
function printWith(record, formatter) {
  console.log(formatter(record));
}

const shortLabel = (record) => record.title;
const longLabel = (record) => record.title + " (" + (record.dueDate ?? "%%noDue%%") + ")";

printWith(task, shortLabel);
