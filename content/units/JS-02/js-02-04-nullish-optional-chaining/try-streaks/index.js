// A streak counts the days in a row a habit was done; null means "never tracked yet".
const walk = { name: "%%walk%%", streak: 0 };
const water = { name: "%%water%%", streak: 3 };
const words = { name: "%%words%%", streak: null };

console.log(walk.name + ":", walk.streak || "—");
console.log(water.name + ":", water.streak || "—");
console.log(words.name + ":", words.streak || "—");
