// Legacy code: rewrite it with const and let, keeping the output the same.
// Declare every name in the smallest block that needs it.
var name = "%%walk%%";
var completions = 3;
var target = 5;
if (completions < target) {
  var left = target - completions;
  var message = name + ": " + left + " %%toGo%%";
} else {
  var message = name + ": %%goal%%";
}
console.log(message);
