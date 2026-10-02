// pop() returns the last element, but it also removes it from the caller's array.
function firstOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list[0];
}

function lastOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list.pop();
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
