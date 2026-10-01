// The branches are swapped: the value after ? is for "yes", the one after : is for "no".
const morning = { name: "%%exercise%%", frequency: "daily", active: true };
const english = { name: "%%words%%", frequency: "daily", active: false };
const activeWord = "%%active%%";
const pausedWord = "%%paused%%";

const morningStatus = morning.active ? pausedWord : activeWord;
const englishStatus = english.active ? pausedWord : activeWord;

console.log(morning.name, "—", morningStatus);
console.log(english.name, "—", englishStatus);
