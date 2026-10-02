// What JavaScript numbers really give.
console.log("0.1 + 0.2 =", 0.1 + 0.2);
console.log("0.1 + 0.2 === 0.3:", 0.1 + 0.2 === 0.3);
console.log("1 / 0 =", 1 / 0, "| 0 / 0 =", 0 / 0);
console.log("NaN === NaN:", NaN === NaN, "| Number.isNaN(0 / 0):", Number.isNaN(0 / 0));
console.log("MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);
console.log("MAX_SAFE_INTEGER + 2 =", Number.MAX_SAFE_INTEGER + 2);

// Comparing with a tolerance: "close enough" instead of "exactly equal".
function nearlyEqual(a, b, tolerance) {
  return Math.abs(a - b) < tolerance;
}

console.log("%%near%%", nearlyEqual(0.1 + 0.2, 0.3, Number.EPSILON));
