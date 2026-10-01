// Works here because activeWord is truthy; the ternary is the safer choice.
const morning = { name: "%%exercise%%", frequency: "daily", active: true };
const english = { name: "%%words%%", frequency: "daily", active: false };
const activeWord = "%%active%%";
const pausedWord = "%%paused%%";

const morningStatus = morning.active && activeWord || pausedWord;
const englishStatus = english.active && activeWord || pausedWord;

console.log(morning.name, "—", morningStatus);
console.log(english.name, "—", englishStatus);
