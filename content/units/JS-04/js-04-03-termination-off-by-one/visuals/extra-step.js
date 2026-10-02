const ids = ["t-01", "t-02", "t-03"];
let visited = 0;
for (let i = 0; i <= ids.length; i++) {
  console.log(i, ids[i]);
  visited++;
}
console.log("visited:", visited);
