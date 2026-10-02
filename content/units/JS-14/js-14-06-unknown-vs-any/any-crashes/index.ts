// Valid JSON, but a number, not a wish object.
const stored = "42";

const value: any = JSON.parse(stored);
console.log(typeof value);
console.log(value.name.toUpperCase());
