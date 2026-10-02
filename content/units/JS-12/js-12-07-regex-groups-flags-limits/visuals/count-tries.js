// How much work does /^(a+)+$/ do on text that almost matches?
// nested() tries every way to split the a's into groups, as the engine does.
let steps = 0;

function nested(text, start) {
  steps = steps + 1;
  if (start === text.length) {
    return true;
  }
  for (let end = start + 1; end <= text.length; end++) {
    if (text[end - 1] !== "a") {
      return false;
    }
    if (nested(text, end)) {
      return true;
    }
  }
  return false;
}

// The rewritten /^a+$/ has one way only: walk the text once.
function flat(text) {
  for (const char of text) {
    steps = steps + 1;
    if (char !== "a") {
      return false;
    }
  }
  return text.length > 0;
}

nested("aa!", 0);
const shortTries = steps;
steps = 0;
nested("aaaa!", 0);
const longerTries = steps;
steps = 0;
flat("aaaa!");
const flatTries = steps;
console.log(shortTries, longerTries, flatTries);
