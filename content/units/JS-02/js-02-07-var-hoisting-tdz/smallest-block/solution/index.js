// Legacy code: rewrite it with const and let, keeping the output the same.
// Declare every name in the smallest block that needs it.
const name = "%%walk%%";
const completions = 3;
const target = 5;
let message;
if (completions < target) {
  const left = target - completions;
  message = name + ": " + left + " %%toGo%%";
} else {
  message = name + ": %%goal%%";
}
console.log(message);
