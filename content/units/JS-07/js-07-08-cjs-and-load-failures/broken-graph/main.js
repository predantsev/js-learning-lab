import { summarize } from "records.js";
import { formatTotal } from "./format";
import { isValid } from "./records.js";

console.log("▶ main.js");

const wishes = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-09", name: "", price: 30 },
];

const valid = wishes.filter(isValid);
console.log(formatTotal(summarize(valid)));
