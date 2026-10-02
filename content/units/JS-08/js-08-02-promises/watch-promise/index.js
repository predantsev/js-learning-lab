const startedAt = Date.now();
const elapsed = () => Date.now() - startedAt + " %%ms%%";

const wish = new Promise((resolve) => {
  console.log("%%executorRuns%%", elapsed());
  resolve({ id: "w-02", name: "%%lamp%%" });
});

wish.then((record) => {
  console.log("%%arrived%%", record.name, elapsed());
});

console.log("%%scriptEnds%%", elapsed());
