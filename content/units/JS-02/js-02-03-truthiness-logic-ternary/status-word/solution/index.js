const morning = { name: "%%exercise%%", frequency: "daily", active: true };
const english = { name: "%%words%%", frequency: "daily", active: false };
const activeWord = "%%active%%";
const pausedWord = "%%paused%%";

// Replace each "" with a ternary that picks activeWord or pausedWord.
const morningStatus = morning.active ? activeWord : pausedWord;
const englishStatus = english.active ? activeWord : pausedWord;

console.log(morning.name, "—", morningStatus);
console.log(english.name, "—", englishStatus);
