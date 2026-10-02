const status = document.querySelector("#status");
const list = document.querySelector("#results");

function render(query, results) {
  status.textContent = "%%resultsFor%% «" + query + "»: " + results.length;
  list.replaceChildren(...results.map((wish) => {
    const item = document.createElement("li");
    item.textContent = wish.name;
    return item;
  }));
}

// Searches the lab wishlist; `delay` sets how long the server takes to answer.
async function search(query, delay) {
  const url = "/lab/search?ns=wishlist&lang=%%lang%%&delay=" + delay + "&q=" + encodeURIComponent(query);
  const response = await fetch(url);
  const body = await response.json();
  console.log("%%answerFor%%", query, "—", body.results.length);
  render(query, body.results);
}

document.querySelector("#run").addEventListener("click", () => {
  search("%%shortQuery%%", 800); // typed first, answers slowly
  search("%%longQuery%%", 200); // typed second, answers fast
});
