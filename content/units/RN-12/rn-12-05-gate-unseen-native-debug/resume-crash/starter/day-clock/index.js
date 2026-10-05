// day-clock/index.js (read-only): the package day-clock 2.0.0, as the preview has it.
// In the real project it is imported as 'day-clock'; the preview cannot install packages, so it
// lives in this folder. The one difference: here today() takes the simulated device clock from
// sim.js, so the checks can move the calendar; the real today() reads the phone's clock itself.
//
// BREAKING in 2.0.0 (see CHANGELOG.txt): today() returns a Promise; formatDay moved here from
// 'day-clock/format', which no longer exists.
export async function today(clock) {
  return clock.read();
}

export function formatDay(day) {
  const [year, month, date] = day.split('-');
  return `${date}.${month}.${year}`;
}
