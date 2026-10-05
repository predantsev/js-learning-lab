// A log of the days a habit was completed.
function HabitLog(name) {
}

// markDone(date): remember the date, once.
HabitLog.prototype.markDone = function (date) {
};

// count(): how many different dates are remembered.
HabitLog.prototype.count = function () {
};

const water = new HabitLog("%%water%%");
const walk = new HabitLog("%%walk%%");
water.markDone("2026-03-01");
water.markDone("2026-03-02");
water.markDone("2026-03-02");
console.log(water.count());
console.log(walk.count());
