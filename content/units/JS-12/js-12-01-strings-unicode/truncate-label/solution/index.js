// Keep at most `max` characters (counted as code points) of `text`.
// Add "…" only when something was cut off.
function truncateLabel(text, max) {
  const points = [...text];
  if (points.length <= max) {
    return text;
  }
  return points.slice(0, max).join("") + "…";
}

console.log(truncateLabel("%%headphones%%", 6));
console.log(truncateLabel("🎧🎧🎧", 2));
console.log(truncateLabel("%%lamp%%", 40));
