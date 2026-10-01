const addFee = (price) => price + 10;

const formatTotal = (price) => {
  const total = addFee(price);
  return total + " %%uah%%";
};

const makeItem = (price) => { price: price };

console.log(addFee(100));
console.log(formatTotal(45));
console.log(makeItem(45));
