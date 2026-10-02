function savedName(result) {
  if (result.ok) {
    return result.value.name;
  }
  return null;
}

function careless(result) {
  return result.value.name;
}

const good = { ok: true, value: { name: "%%lamp%%", price: 45 } };
const bad = { ok: false, errors: { price: "negative" } };
console.log(savedName(good));
console.log(savedName(bad));
console.log(careless(bad));
