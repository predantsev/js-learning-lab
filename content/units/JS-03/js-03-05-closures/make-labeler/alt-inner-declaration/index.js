// An inner function declaration closes over prefix just like an arrow does.
function makeLabeler(prefix) {
  function label(record) {
    return prefix + record.name;
  }
  return label;
}

const headphones = { name: "%%headphones%%", acquired: false };
const mug = { name: "%%mug%%", acquired: true };

const wantLabel = makeLabeler("%%wantPrefix%%");
const haveLabel = makeLabeler("%%havePrefix%%");

console.log(wantLabel(headphones));
console.log(haveLabel(mug));
