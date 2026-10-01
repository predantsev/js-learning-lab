// formatPrice(price) returns "Price: <price>",
// or "No price" when the price is null.
function formatPrice(price) {
  if (price === null) {
    return "%%noPrice%%";
  } else {
    return "%%pricePrefix%%" + price;
  }
}

// Two places that use the returned label (leave them as they are):
const headphonesLabel = formatPrice(80);
console.log(headphonesLabel);
console.log("%%tickets%% — " + formatPrice(null));
