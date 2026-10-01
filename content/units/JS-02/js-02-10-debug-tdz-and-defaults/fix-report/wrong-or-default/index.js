// The shadowing let was removed, but || still turns the bonus 0 into 20: 90 instead of 70.
const reachedWord = "%%reached%%";
const keepGoingWord = "%%keepGoing%%";
const noDataWord = "%%noData%%";

const walk = { name: "%%walk%%", target: 5, done: 0 };
const water = { name: "%%water%%", target: 7, done: 7, bonus: 0 };

const walkProgress = walk.done === "" ? noDataWord : walk.done + "/" + walk.target;
console.log(walk.name + ":", walkProgress);

let walkMark = keepGoingWord;
if (walk.done >= walk.target) {
  walkMark = reachedWord;
}
console.log(walk.name + ":", walkMark);

let points = 0;
if (water.done > 0) {
  points = water.done * 10 + (water.bonus || 20);
}
console.log(water.name + ":", points);

if (water.done >= water.target) {
  const waterMark = reachedWord;
  console.log(water.name + ":", waterMark);
}
