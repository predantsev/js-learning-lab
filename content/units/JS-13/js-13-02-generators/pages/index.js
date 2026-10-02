const tasks = ["%%water%%", "%%books%%", "%%grandma%%", "%%bill%%", "%%dentist%%"];

// A generator: its body runs only when someone asks for the next value.
function* pages(records, size) {
  console.log("%%opened%%");
  for (let start = 0; start < records.length; start = start + size) {
    yield records.slice(start, start + size);
  }
  console.log("%%finished%%");
}

for (const page of pages(tasks, 2)) {
  console.log(page.length, page[0]);
  break;
}

// Awareness: an async generator waits before giving each page.
async function* delayedPages(records, size) {
  for (let start = 0; start < records.length; start = start + size) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    yield records.slice(start, start + size);
  }
}

for await (const page of delayedPages(tasks, 3)) {
  console.log("%%arrived%%", page.length);
}
console.log("%%all%%");
