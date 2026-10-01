// Weekly habit report: four sections, one console line each.
const reachedWord = "%%reached%%";
const keepGoingWord = "%%keepGoing%%";
const noDataWord = "%%noData%%";

const walk = { name: "%%walk%%", target: 5, done: 0 };
const water = { name: "%%water%%", target: 7, done: 7, bonus: 0 };

// 1. Walk progress: an empty "" means nothing was entered; 0 is real progress.
const walkProgress = walk.done === "" ? noDataWord : walk.done + "/" + walk.target;
console.log(walk.name + ":", walkProgress);

// 2. Walk mark: reachedWord at the target, keepGoingWord below it.
let walkMark = keepGoingWord;
if (walk.done >= walk.target) {
  walkMark = reachedWord;
}
console.log(walk.name + ":", walkMark);

// 3. Water points: 10 per completion plus a bonus (20 when missing; 0 means no bonus).
let points = 0;
if (water.done > 0) {
  points = water.done * 10 + (water.bonus ?? 20);
}
console.log(water.name + ":", points);

// 4. Water mark.
if (water.done >= water.target) {
  const waterMark = reachedWord;
  console.log(water.name + ":", waterMark);
}
