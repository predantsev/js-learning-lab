// Loose equality (==) converts types first; strict equality (===) never does.
console.log('0 == ""          ', 0 == "");
console.log('0 == "0"         ', 0 == "0");
console.log('"" == "0"        ', "" == "0");
console.log('false == "0"     ', false == "0");
console.log('null == 0        ', null == 0);
console.log('null == undefined', null == undefined);
console.log('0 === ""         ', 0 === "");
