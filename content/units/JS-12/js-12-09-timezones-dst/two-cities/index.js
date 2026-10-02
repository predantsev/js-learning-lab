// One instant, shown in two places. The timeZone option makes the result
// the same on every computer, whatever its own time zone is.
const instant = new Date("2026-03-01T04:30:00Z");

const zones = ["Europe/Kyiv", "America/New_York"];
for (const timeZone of zones) {
  const text = new Intl.DateTimeFormat("%%locale%%", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(instant);
  console.log(timeZone, "→", text);
}

// Noon in New York on 7 March, plus exactly 24 hours.
const noon = new Date("2026-03-07T17:00:00Z");
const later = new Date(noon.getTime() + 24 * 60 * 60 * 1000);
const newYorkClock = new Intl.DateTimeFormat("%%locale%%", {
  timeZone: "America/New_York",
  dateStyle: "medium",
  timeStyle: "short",
  hourCycle: "h23",
});
console.log("%%before%%", newYorkClock.format(noon));
console.log("%%after%%", newYorkClock.format(later));
