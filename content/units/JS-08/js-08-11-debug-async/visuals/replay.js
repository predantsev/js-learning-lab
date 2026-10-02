function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function saveWish(name) {
  await delay(300);
  console.log("server saved:", name);
}

function onSave() {
  saveWish("Lamp");
  console.log("UI: saved!");
}

async function search(query, ms) {
  const text = await delay(ms, query);
  console.log("show:", text);
}

onSave();
search("la", 400);
search("lamp", 100);
