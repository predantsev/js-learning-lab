// NaN is compared with !==, which is always true: NaN does not even equal itself.
const coffee = { label: "%%coffee%%", amountText: "180", note: undefined };
const taxi = { label: "%%taxi%%", amountText: "" };
const cinema = { label: "%%cinema%%", amountText: "300 %%uah%%", note: "%%friends%%" };

const coffeeHasNote = "note" in coffee;
const taxiHasNote = "note" in taxi;

const coffeeAmountOk = coffee.amountText !== "" && Number(coffee.amountText) !== NaN;
const taxiAmountOk = taxi.amountText !== "" && Number(taxi.amountText) !== NaN;
const cinemaAmountOk = cinema.amountText !== "" && Number(cinema.amountText) !== NaN;

console.log(coffeeHasNote, taxiHasNote);
console.log(coffeeAmountOk, taxiAmountOk, cinemaAmountOk);
