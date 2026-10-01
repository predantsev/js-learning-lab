// Everything was declared with const, so lowering the price stops the program with a TypeError.
const name = "%%lamp%%";
const price = 45;
const category = "%%home%%";
price = price - 5;
console.log(name, category, price);
