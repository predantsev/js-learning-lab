// formatPrice(price) returns "Price: <price>",
// or "No price" when the price is null.
function formatPrice(price) {
  return price === null ? "%%noPrice%%" : "%%pricePrefix%%" + price;
}

// Two places that use the returned label (leave them as they are):
const headphonesLabel = formatPrice(80);
console.log(headphonesLabel);
console.log("%%tickets%% — " + formatPrice(null));
