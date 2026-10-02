function addCompletion(count: number): number {
  return count + 1;
}

// Everything read from localStorage is text.
const savedCount = "3";

console.log(addCompletion(savedCount));
