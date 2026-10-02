// Answers "which file will this command touch?" before you run it.
// cwd: the working directory. target: the path written in the command.
// Both use forward slashes, as on macOS and Linux.
function whereItActs(cwd, target) {
  // Mistake: keeps the empty part in front of the first "/" of cwd as a folder name.
  const folders = target.startsWith("/") ? [] : cwd.split("/");
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
