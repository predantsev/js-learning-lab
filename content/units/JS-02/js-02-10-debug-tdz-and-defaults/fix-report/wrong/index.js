// Only the loud TDZ error was fixed: the program now finishes, but three lines are still wrong.
const reachedWord = "%%reached%%";
const keepGoingWord = "%%keepGoing%%";
const noDataWord = "%%noData%%";

const walk = { name: "%%walk%%", target: 5, done: 0 };
const water = { name: "%%water%%", target: 7, done: 7, bonus: 0 };

const walkProgress = walk.done == "" ? noDataWord : walk.done + "/" + walk.target;
console.log(walk.name + ":", walkProgress);

if (walk.done >= walk.target) {
  var walkMark = reachedWord;
}
console.log(walk.name + ":", walkMark);

let points = 0;
if (water.done > 0) {
  let points = water.done * 10 + (water.bonus || 20);
}
console.log(water.name + ":", points);

if (water.done >= water.target) {
  const waterMark = reachedWord;
  console.log(water.name + ":", waterMark);
}
