// Only NaN is checked: Number("") is 0, so the empty taxi amount slips through.
const coffee = { label: "%%coffee%%", amountText: "180", note: undefined };
const taxi = { label: "%%taxi%%", amountText: "" };
const cinema = { label: "%%cinema%%", amountText: "300 %%uah%%", note: "%%friends%%" };

const coffeeHasNote = "note" in coffee;
const taxiHasNote = "note" in taxi;

const coffeeAmountOk = !Number.isNaN(Number(coffee.amountText));
const taxiAmountOk = !Number.isNaN(Number(taxi.amountText));
const cinemaAmountOk = !Number.isNaN(Number(cinema.amountText));

console.log(coffeeHasNote, taxiHasNote);
console.log(coffeeAmountOk, taxiAmountOk, cinemaAmountOk);
