// One ternary needs no intermediate name at all.
const name = "%%walk%%";
const completions = 3;
const target = 5;
const message = completions < target
  ? name + ": " + (target - completions) + " %%toGo%%"
  : name + ": %%goal%%";
console.log(message);
