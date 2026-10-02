// Return a read-only view of settings: reading works as usual,
// while any assignment or delete through the view throws a TypeError
// and leaves settings unchanged. Changes made to settings itself stay visible.
function readOnly(settings) {
}

const settings = { currency: "UAH", pageSize: 5 };
const locked = readOnly(settings);
console.log(locked.currency, locked.pageSize);

const attempts = [
  () => { locked.pageSize = 50; },
  () => { locked.theme = "dark"; },
  () => { locked.currency = undefined; },
];
for (const attempt of attempts) {
  try {
    attempt();
    console.log("%%changed%%");
  } catch (error) {
    console.log(error.name);
  }
}
console.log(settings.pageSize, settings.currency);
