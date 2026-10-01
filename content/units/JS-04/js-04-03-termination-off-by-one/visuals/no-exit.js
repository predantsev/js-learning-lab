const ids = ["h-01", "h-02", "h-03"];
let i = 0;
let steps = 0;
while (i < ids.length) {
  steps++;
  // i++ is missing: i never changes
}
console.log("never printed");
