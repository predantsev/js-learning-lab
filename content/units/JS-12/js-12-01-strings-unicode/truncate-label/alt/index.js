// Keep at most `max` characters (counted as code points) of `text`.
// Add "…" only when something was cut off.
function truncateLabel(text, max) {
  let kept = "";
  let count = 0;
  for (const point of text) {
    if (count === max) {
      return kept + "…";
    }
    kept = kept + point;
    count = count + 1;
  }
  return kept;
}

console.log(truncateLabel("%%headphones%%", 6));
console.log(truncateLabel("🎧🎧🎧", 2));
console.log(truncateLabel("%%lamp%%", 40));
