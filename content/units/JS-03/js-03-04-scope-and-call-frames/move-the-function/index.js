const discount = 10;

function finalPrice(price) {
  return price - discount;
}

function checkout() {
  const discount = 50;
  return finalPrice(100);
}

console.log(checkout());
