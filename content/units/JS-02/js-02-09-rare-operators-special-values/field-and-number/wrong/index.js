// The note check asks "is there a value?" instead of "is there a field?".
const coffee = { label: "%%coffee%%", amountText: "180", note: undefined };
const taxi = { label: "%%taxi%%", amountText: "" };
const cinema = { label: "%%cinema%%", amountText: "300 %%uah%%", note: "%%friends%%" };

const coffeeHasNote = coffee.note !== undefined;
const taxiHasNote = taxi.note !== undefined;

const coffeeAmountOk = coffee.amountText !== "" && !Number.isNaN(Number(coffee.amountText));
const taxiAmountOk = taxi.amountText !== "" && !Number.isNaN(Number(taxi.amountText));
const cinemaAmountOk = cinema.amountText !== "" && !Number.isNaN(Number(cinema.amountText));

console.log(coffeeHasNote, taxiHasNote);
console.log(coffeeAmountOk, taxiAmountOk, cinemaAmountOk);
