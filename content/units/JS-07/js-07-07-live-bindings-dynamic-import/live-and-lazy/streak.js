// The current streak of "Drink water": only this module changes it.
export let streak = 0;

export function markToday() {
  streak = streak + 1;
}
