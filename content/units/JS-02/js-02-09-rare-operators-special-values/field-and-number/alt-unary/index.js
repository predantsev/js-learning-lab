// Unary + converts like Number(); the empty-text check is still needed.
const coffee = { label: "%%coffee%%", amountText: "180", note: undefined };
const taxi = { label: "%%taxi%%", amountText: "" };
const cinema = { label: "%%cinema%%", amountText: "300 %%uah%%", note: "%%friends%%" };

const coffeeHasNote = "note" in coffee;
const taxiHasNote = "note" in taxi;

const coffeeAmountOk = coffee.amountText !== "" && Number.isNaN(+coffee.amountText) === false;
const taxiAmountOk = taxi.amountText !== "" && Number.isNaN(+taxi.amountText) === false;
const cinemaAmountOk = cinema.amountText !== "" && Number.isNaN(+cinema.amountText) === false;

console.log(coffeeHasNote, taxiHasNote);
console.log(coffeeAmountOk, taxiAmountOk, cinemaAmountOk);
