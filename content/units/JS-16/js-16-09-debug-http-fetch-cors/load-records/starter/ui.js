// Drawing helpers of the expense page.
export function renderList(records) {
  const items = records.map((record) => {
    const item = document.createElement("li");
    item.textContent = record.label;
    return item;
  });
  document.querySelector("#records").replaceChildren(...items);
}

export function showMessage(text) {
  document.querySelector("#status").textContent = text;
}
