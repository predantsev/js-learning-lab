// Reads package.json the way npm does and reports what `npm start` and `npm test` would run.
// You edit package.json; this file only reports.
const text = await (await fetch("./package.json")).text();

let pkg;
try {
  pkg = JSON.parse(text);
} catch (error) {
  console.log("%%notJson%%", error.message);
}

if (pkg !== undefined) {
  const scripts = pkg.scripts ?? {};
  for (const name of ["start", "test"]) {
    if (typeof scripts[name] === "string") {
      console.log(`npm ${name} → ${scripts[name]}`);
    } else {
      console.log(`npm ${name} → %%noScript%% "${name}"`);
    }
  }
}
