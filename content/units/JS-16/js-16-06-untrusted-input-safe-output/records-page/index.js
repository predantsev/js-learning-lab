// Four sources of text this page did not write itself, and how the page displays them.

// Source 1: the address of the page. (In a real page: location.search.)
const query = new URLSearchParams("?q=<em>%%lampQuery%%</em>");
document.querySelector("#search-echo").innerHTML = `%%resultsFor%% ${query.get("q")}`;

// Source 2: localStorage — a note saved by an earlier visit.
localStorage.setItem("jsll.wishlist.note", "<strong>%%note%%</strong>");
const note = localStorage.getItem("jsll.wishlist.note");

// Source 3: records fetched as JSON.
const wishes = await (await fetch("./data/wishes.json")).json();

const list = document.querySelector("#wishes");
for (const wish of wishes) {
  const item = document.createElement("li");
  item.innerHTML = `${wish.name} <span class="category">${wish.category}</span>`;
  item.setAttribute("title", wish.category);
  list.append(item);
}

// Source 4 would be a form field: input.value is just as untrusted.
console.log("note:", note);
console.log("elements inside the list:", [...list.querySelectorAll("li *")].map((element) => element.tagName).join(", "));
console.log("elements inside the search echo:", document.querySelectorAll("#search-echo *").length);
