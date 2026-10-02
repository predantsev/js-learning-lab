// Answers "which file will this command touch?" before you run it.
// cwd: the working directory. target: the path written in the command.
// Both use forward slashes, as on macOS and Linux.
function whereItActs(cwd, target) {
  // Mistake: glues the strings together and never reads "..", "." or a leading "/".
  return cwd + "/" + target;
}

console.log(whereItActs("/home/you/js-course/scratch", "notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch/old", "../notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch", "/tmp/notes.txt"));
