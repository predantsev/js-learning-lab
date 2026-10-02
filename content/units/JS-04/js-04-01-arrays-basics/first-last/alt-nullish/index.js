// Also valid: ?? replaces only undefined and null, so a real 0 or "" stays.
function firstOrNull(list) {
  return list[0] ?? null;
}

function lastOrNull(list) {
  return list[list.length - 1] ?? null;
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
