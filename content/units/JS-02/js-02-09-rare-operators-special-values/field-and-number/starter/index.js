// Expense drafts from a form: the amount always arrives as text.
const coffee = { label: "%%coffee%%", amountText: "180", note: undefined };
const taxi = { label: "%%taxi%%", amountText: "" };
const cinema = { label: "%%cinema%%", amountText: "300 %%uah%%", note: "%%friends%%" };

// 1. Does the draft have a "note" field at all (even an empty one)? Use in.
const coffeeHasNote = false;
const taxiHasNote = false;

// 2. Is the amount text a real number? Convert it with Number(),
//    and remember: Number("") is 0, so an empty text must not pass.
const coffeeAmountOk = false;
const taxiAmountOk = false;
const cinemaAmountOk = false;

console.log(coffeeHasNote, taxiHasNote);
console.log(coffeeAmountOk, taxiAmountOk, cinemaAmountOk);
