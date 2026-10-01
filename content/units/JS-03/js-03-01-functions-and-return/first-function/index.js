function formatPrice(price) {
  return "%%pricePrefix%%" + price;
}

const lampLabel = formatPrice(45);
console.log(lampLabel);
console.log("%%headphones%% — " + formatPrice(80));
