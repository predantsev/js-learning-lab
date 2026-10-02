import { streak, markToday } from "./streak.js";
import { describeStreak } from "./stats.js";

console.log("▶ main.js");

const output = document.querySelector("#output");

document.querySelector("#mark").addEventListener("click", () => {
  markToday();
  output.textContent = "%%streakNow%%" + streak;
});

document.querySelector("#stats").addEventListener("click", () => {
  output.textContent = describeStreak(streak);
});
