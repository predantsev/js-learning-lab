// A wish name as someone typed it into the form. It is just a string.
const name = '%%lamp%% <b>%%sale%%</b> <img src="photo.png" onerror="alert(\'%%ran%%\')">';

// The same string, shown in two ways.
document.querySelector("#as-text").textContent = name;
document.querySelector("#as-html").innerHTML = name;

console.log("textContent:", document.querySelector("#as-text").children.length, "%%elements%%");
console.log("innerHTML:", document.querySelector("#as-html").children.length, "%%elements%%");
