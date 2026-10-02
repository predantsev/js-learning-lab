import { later, runLater } from "./later.js";

// One reminder per day, shown later.
for (var day = 1; day <= 3; day++) {
  later(() => console.log("%%reminderFor%% " + day));
}

runLater();
