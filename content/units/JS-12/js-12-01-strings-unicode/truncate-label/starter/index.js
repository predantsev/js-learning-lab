// Keep at most `max` characters (counted as code points) of `text`.
// Add "…" only when something was cut off.
function truncateLabel(text, max) {
  // Write the body of the function here.
}

console.log(truncateLabel("%%headphones%%", 6));
console.log(truncateLabel("🎧🎧🎧", 2));
console.log(truncateLabel("%%lamp%%", 40));
