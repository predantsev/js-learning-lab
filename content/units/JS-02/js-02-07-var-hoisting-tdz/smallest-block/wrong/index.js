// Every var was swapped for let mechanically: message now disappears with its block.
let name = "%%walk%%";
let completions = 3;
let target = 5;
if (completions < target) {
  let left = target - completions;
  let message = name + ": " + left + " %%toGo%%";
} else {
  let message = name + ": %%goal%%";
}
console.log(message);
