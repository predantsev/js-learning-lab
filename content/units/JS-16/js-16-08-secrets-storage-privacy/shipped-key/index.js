// What any visitor of the site can do: download the shipped script and search its text.
// dist/app.js is the real output of esbuild with minify: true and no source map; the source it was
// built from is src/main.mjs, where the key is only the name RATES_API_KEY.
const shipped = await (await fetch("./dist/app.js")).text();
console.log("%%shippedSize%%", shipped.length);

const found = shipped.match(/key=([\w-]+)/);
console.log("%%foundKey%%", found ? found[1] : "%%nothingFound%%");
