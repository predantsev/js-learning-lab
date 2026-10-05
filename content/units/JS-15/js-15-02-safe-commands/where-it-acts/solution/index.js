// Answers "which file will this command touch?" before you run it.
// cwd: the working directory. target: the path written in the command.
// Both use forward slashes, as on macOS and Linux.
function whereItActs(cwd, target) {
  // An absolute target starts from the root; a relative one from cwd.
  const start = target.startsWith("/") ? "" : cwd;
  const folders = start.split("/").filter((part) => part !== "");
  for (const part of target.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") folders.pop();
    else folders.push(part);
  }
  return "/" + folders.join("/");
}

console.log(whereItActs("/home/you/js-course/scratch", "notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch/old", "../notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch", "/tmp/notes.txt"));
