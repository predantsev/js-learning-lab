// !price is also true for 0, so a free item is shown as "No price".
function formatPrice(price) {
  if (!price) {
    return "%%noPrice%%";
  } else {
    return "%%pricePrefix%%" + price;
  }
}

// Two places that use the returned label (leave them as they are):
const headphonesLabel = formatPrice(80);
console.log(headphonesLabel);
console.log("%%tickets%% — " + formatPrice(null));
