// Count the habits with a loop. Run it and watch the console:
// which line never appears?
const names = ["%%exercise%%", "%%reading%%", "%%water%%"];
console.log("%%start%%");
let i = 0;
let count = 0;
while (i < names.length) {
  count = count + 1;
}
console.log("%%counted%%", count);
