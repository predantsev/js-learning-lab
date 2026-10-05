// Answers "which file will this command touch?" before you run it.
// cwd: the working directory. target: the path written in the command.
// Both use forward slashes, as on macOS and Linux.
function whereItActs(cwd, target) {
  let parts = [];
  if (target[0] !== "/") {
    parts = cwd.split("/");
  }
  const steps = target.split("/");
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step === "..") {
      if (parts.length > 0) parts.pop();
    } else if (step !== "." && step !== "") {
      parts.push(step);
    }
  }
  const clean = parts.filter((part) => part.length > 0);
  if (clean.length === 0) return "/";
  return "/" + clean.join("/");
}

console.log(whereItActs("/home/you/js-course/scratch", "notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch/old", "../notes.txt"));
console.log(whereItActs("/home/you/js-course/scratch", "/tmp/notes.txt"));
