import { addRecord } from "./records.js";

const list = addRecord([], "%%lamp%%");
console.log(list.length, list[0].name);
