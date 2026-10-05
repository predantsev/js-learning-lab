// The view of the list in the page address: ?q=<search>&show=<filter>. The address is untrusted
// input — anyone can send a link with any text in it — so it is read through URLSearchParams and the
// filter is accepted only from a known list. Writing goes through URL and searchParams, which encode
// every value (a space, "&", "#", Cyrillic letters), so the same text comes back after a reload.

// The search and the filter of an address query such as "?q=%D0%94%D1%96%D0%BC&show=all".
// A missing search is "", and a filter that is not one of `filters` is "all".
export function readView(search, filters) {
  const params = new URLSearchParams(search);
  const show = params.get("show");
  return {
    query: params.get("q") ?? "",
    filter: show !== null && filters.includes(show) ? show : "all",
  };
}

// The address `href` with the view written into its query: q for a search that is not empty, show
// for a filter other than "all". Other parameters and the path of the address stay as they are.
export function viewAddress(href, view) {
  const url = new URL(href);
  if (view.query === "") {
    url.searchParams.delete("q");
  } else {
    url.searchParams.set("q", view.query);
  }
  if (view.filter === "all") {
    url.searchParams.delete("show");
  } else {
    url.searchParams.set("show", view.filter);
  }
  return url.href;
}
