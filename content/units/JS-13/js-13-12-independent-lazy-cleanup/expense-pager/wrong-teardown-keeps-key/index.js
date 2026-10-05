// 1. Yield the records in pages of at most `size`, lazily.
//    When the traversal ends — finished or stopped early — call handle.release() exactly once.
function* pageThrough(records, size, handle) {
  try {
    for (let start = 0; start < records.length; start = start + size) {
      yield records.slice(start, start + size);
    }
  } finally {
    handle.release();
  }
}

// 2. Return { bytes, byteLength }: the UTF-8 bytes of JSON.stringify(records) in a Uint8Array,
//    and how many bytes that is.
function exportBytes(records) {
  const bytes = new TextEncoder().encode(JSON.stringify(records));
  return { bytes, byteLength: bytes.length };
}

// 3. Show the records page by page in root and return an idempotent teardown().
//    See the task for the details.
function mount(root, records, size, handle) {
  const pages = pageThrough(records, size, handle);
  const list = document.createElement("ul");
  const more = document.createElement("button");
  more.type = "button";
  more.textContent = "%%more%%";
  root.append(list, more);

  function showNext() {
    const next = pages.next();
    if (next.done) {
      more.disabled = true;
      return;
    }
    for (const record of next.value) {
      const item = document.createElement("li");
      item.textContent = record.label;
      list.append(item);
    }
  }
  function onKey(event) {
    if (event.key === "+") {
      showNext();
    }
  }

  more.addEventListener("click", showNext);
  document.addEventListener("keydown", onKey);
  showNext();

  let active = true;
  return function teardown() {
    if (!active) {
      return;
    }
    active = false;
    more.removeEventListener("click", showNext);
    pages.return();
    root.textContent = "";
  };
}
const expenses = [
  { id: "e-01", label: "%%groceries%%" },
  { id: "e-02", label: "%%transit%%" },
  { id: "e-03", label: "%%coffee%%" },
  { id: "e-04", label: "%%bulbs%%" },
  { id: "e-05", label: "%%cinema%%" },
];
const handle = { released: 0, release() { this.released += 1; } };
for (const page of pageThrough(expenses, 2, handle)) {
  console.log(page.length);
  break;
}
console.log(handle.released);
console.log(exportBytes(expenses.slice(0, 1)).byteLength);
