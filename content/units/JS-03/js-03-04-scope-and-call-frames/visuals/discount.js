const discount = 10;

function finalPrice(price) {
  return price - discount;
}

function checkout() {
  const discount = 50;
  const total = finalPrice(100);
  return total;
}

console.log(checkout());
console.log(finalPrice(40));
