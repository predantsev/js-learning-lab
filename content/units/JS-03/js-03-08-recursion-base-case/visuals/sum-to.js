function sumTo(n) {
  if (n === 1) {
    return 1;
  }
  const rest = sumTo(n - 1);
  return n + rest;
}

console.log(sumTo(4));
