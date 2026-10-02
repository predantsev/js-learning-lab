// Synthetic payloads: if one of them manages to run, it only prints a marker to the console.
const PAYLOADS = {
  imgName: `<img src="missing.svg" onerror="console.log('%%marker%% 1: innerHTML')">`,
  adjacentName: `<img src="missing.svg" onerror="console.log('%%marker%% 2: insertAdjacentHTML')">`,
  altName: `x" onerror="console.log('%%marker%% 4: alt')`,
  homepage: `javascript:console.log('%%marker%% 5: link')`,
};

// Reports inline code that a Content-Security-Policy blocked (see the third tryIt step).
document.addEventListener("securitypolicyviolation", (event) => {
  if (event.violatedDirective.startsWith("script-src")) console.log("%%cspBlocked%%", event.violatedDirective);
});

const board = document.querySelector("#board");

// 1. innerHTML
const first = document.createElement("li");
first.innerHTML = PAYLOADS.imgName;
board.append(first);

// 2. insertAdjacentHTML
board.insertAdjacentHTML("beforeend", `<li>${PAYLOADS.adjacentName}</li>`);

// 3. textContent
const third = document.createElement("li");
third.textContent = PAYLOADS.imgName;
board.append(third);

// 4. an alt attribute inside an HTML template, with < and > replaced by hand
const escaped = PAYLOADS.altName.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
board.insertAdjacentHTML("beforeend", `<li><img src="missing.svg" alt="${escaped}"></li>`);

// 5. a link whose address comes from record data
const fifth = document.createElement("li");
const link = document.createElement("a");
link.href = PAYLOADS.homepage;
link.textContent = "%%organizer%%";
fifth.append(link);
board.append(fifth);
console.log("%%linkScheme%%", new URL(link.href).protocol);
