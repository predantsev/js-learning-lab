// The labels are printed inside the function instead of being returned,
// so every call gives undefined.
function formatPrice(price) {
  if (price === null) {
    console.log("%%noPrice%%");
  } else {
    console.log("%%pricePrefix%%" + price);
  }
}

// Two places that use the returned label (leave them as they are):
const headphonesLabel = formatPrice(80);
console.log(headphonesLabel);
console.log("%%tickets%% — " + formatPrice(null));
