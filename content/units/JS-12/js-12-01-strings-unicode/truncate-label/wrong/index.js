// Keep at most `max` characters (counted as code points) of `text`.
// Add "…" only when something was cut off.
function truncateLabel(text, max) {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + "…";
}

console.log(truncateLabel("%%headphones%%", 6));
console.log(truncateLabel("🎧🎧🎧", 2));
console.log(truncateLabel("%%lamp%%", 40));
