console.log("▶ records.js");

// isValidWish(wish): a wish needs a non-empty name.
export function isValidWish(wish) {
  return typeof wish.name === "string" && wish.name.trim() !== "";
}

// summarize(wishes): how many wishes and their total price (wishes without a price are skipped).
export function summarize(wishes) {
  let total = 0;
  for (const wish of wishes) {
    if (wish.price !== null) {
      total = total + wish.price;
    }
  }
  return { count: wishes.length, total: total };
}
