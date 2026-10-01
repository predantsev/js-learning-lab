// || returns the operand itself: the active habit gets true instead of a word.
const morning = { name: "%%exercise%%", frequency: "daily", active: true };
const english = { name: "%%words%%", frequency: "daily", active: false };
const activeWord = "%%active%%";
const pausedWord = "%%paused%%";

const morningStatus = morning.active || pausedWord;
const englishStatus = english.active || pausedWord;

console.log(morning.name, "—", morningStatus);
console.log(english.name, "—", englishStatus);
