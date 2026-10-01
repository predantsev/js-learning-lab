function evaluate(operand, value) {
  console.log(operand);
  return value;
}

const count = evaluate(1, 0) || evaluate(2, 5);
const price = evaluate(1, 45) || evaluate(2, 0);
const free = evaluate(1, 0) && evaluate(2, 45);
const total = evaluate(1, 45) && evaluate(2, 80);
console.log(count, price, free, total);
