// Everything is declared at the top, so left is visible far outside the block that uses it.
const name = "%%walk%%";
const completions = 3;
const target = 5;
let left;
let message;
if (completions < target) {
  left = target - completions;
  message = name + ": " + left + " %%toGo%%";
} else {
  message = name + ": %%goal%%";
}
console.log(message);
