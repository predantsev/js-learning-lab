// makeLabeler(prefix) returns a NEW function: it takes a wish record
// and returns the prefix followed by the record's name.
function makeLabeler(prefix) {
  return (record) => prefix + record.name;
}

const headphones = { name: "%%headphones%%", acquired: false };
const mug = { name: "%%mug%%", acquired: true };

const wantLabel = makeLabeler("%%wantPrefix%%");
const haveLabel = makeLabeler("%%havePrefix%%");

console.log(wantLabel(headphones));
console.log(haveLabel(mug));
