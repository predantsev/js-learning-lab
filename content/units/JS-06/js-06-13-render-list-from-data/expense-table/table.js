// The same records as a table: a caption, a header row, then one row per record.
function createCell(tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
}

function createRow(expense) {
  const row = document.createElement("tr");
  row.append(
    createCell("td", expense.date),
    createCell("td", expense.what),
    createCell("td", `${expense.amount} %%currency%%`),
  );
  return row;
}

export function renderTable(area, records) {
  const table = document.createElement("table");
  const caption = document.createElement("caption");
  caption.textContent = "%%caption%%";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const title of ["%%date%%", "%%what%%", "%%amount%%"]) {
    const header = createCell("th", title);
    header.scope = "col";
    headRow.append(header);
  }
  head.append(headRow);
  const body = document.createElement("tbody");
  body.append(...records.map(createRow));
  table.append(caption, head, body);
  area.replaceChildren(table);
}
