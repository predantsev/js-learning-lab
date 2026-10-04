// A stand-in for node:fs so the steps can be traced: no real files, open() only counts handles.
const disk = { "habits.json": "[]", "broken.json": "[{" };
let openHandles = 0;

function open(name) {
  if (!(name in disk)) throw Object.assign(new Error("no such file"), { code: "ENOENT" });
  openHandles += 1;
  return { name };
}

function close(handle) {
  openHandles -= 1;
}

function readSettings(name) {
  const handle = open(name);
  try {
    return JSON.parse(disk[handle.name]);
  } finally {
    close(handle);
  }
}

for (const name of ["habits.json", "missing.json", "broken.json"]) {
  try {
    readSettings(name);
    console.log(name, "ok");
  } catch (error) {
    console.log(name, error.code ?? error.name);
  }
}
console.log("open handles:", openHandles);
