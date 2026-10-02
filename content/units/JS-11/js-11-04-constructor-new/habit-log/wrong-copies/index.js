// A log of the days a habit was completed.
function HabitLog(name) {
  this.name = name;
  this.dates = [];
  this.markDone = function (date) {
    if (!this.dates.includes(date)) {
      this.dates.push(date);
    }
  };
  this.count = function () {
    return this.dates.length;
  };
}

const water = new HabitLog("%%water%%");
const walk = new HabitLog("%%walk%%");
water.markDone("2026-03-01");
water.markDone("2026-03-02");
water.markDone("2026-03-02");
console.log(water.count());
console.log(walk.count());
