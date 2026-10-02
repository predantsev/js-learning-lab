function countdown(n) {
  if (n === 0) {
    return "done";
  }
  return countdown(n - 1);
}

function countdownLoop(n) {
  while (n > 0) {
    n = n - 1;
  }
  return "done";
}

console.log(countdown(2));
console.log(countdownLoop(2));
