function describeResult(result) {
  if (result.ok) {
    return "saved: " + result.value.name;
  }
  return "fix: " + Object.keys(result.errors).join(", ");
}

function careless(result) {
  return "saved: " + result.value.name;
}

const good = { ok: true, value: { name: "%%lamp%%", price: 45 } };
const bad = { ok: false, errors: { price: "negative" } };
console.log(describeResult(good));
console.log(describeResult(bad));
console.log(careless(bad));
