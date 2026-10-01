function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}

const readingDays = makeCounter();
const walkDays = makeCounter();
console.log(readingDays(), readingDays(), walkDays());

let currency = "%%uah%%";
const formatAmount = (amount) => amount + " " + currency;
console.log(formatAmount(80));
