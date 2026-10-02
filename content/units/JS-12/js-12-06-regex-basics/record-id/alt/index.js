// A record id looks like "w-01": one lowercase Latin letter a–z,
// a hyphen and exactly two digits. Nothing before it, nothing after it.
const idPattern = /^[a-z]-[0-9][0-9]$/;

function isValidId(id) {
  return idPattern.test(id);
}

console.log(isValidId("w-01"), isValidId("t-15"));
console.log(isValidId("W-01"), isValidId("w-1"), isValidId("w-001"), isValidId("xw-01"));
