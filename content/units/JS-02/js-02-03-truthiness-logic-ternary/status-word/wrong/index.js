// The boolean is compared with the text "true": true == "true" is false, so every habit looks paused.
const morning = { name: "%%exercise%%", frequency: "daily", active: true };
const english = { name: "%%words%%", frequency: "daily", active: false };
const activeWord = "%%active%%";
const pausedWord = "%%paused%%";

const morningStatus = morning.active == "true" ? activeWord : pausedWord;
const englishStatus = english.active == "true" ? activeWord : pausedWord;

console.log(morning.name, "—", morningStatus);
console.log(english.name, "—", englishStatus);
