// The test fixture for the search: answers from memory. settings.delayFor(query) decides how many
// milliseconds each answer takes (0 by default). It honours an abort signal like fetch does.
const HABITS = [
  { id: "h-01", name: "%%h1%%" },
  { id: "h-02", name: "%%h2%%" },
  { id: "h-03", name: "%%h3%%" },
  { id: "h-04", name: "%%h4%%" },
  { id: "h-05", name: "%%h5%%" },
  { id: "h-06", name: "%%h6%%" },
];

export const settings = {
  delayFor: () => 0,
};

// main.jsx calls this before every test.
export function resetFakeSearch() {
  settings.delayFor = () => 0;
}

export function fakeSearch(query, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(HABITS.filter((habit) => habit.name.toLowerCase().includes(query.toLowerCase())));
    }, settings.delayFor(query));
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("The search was aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}
