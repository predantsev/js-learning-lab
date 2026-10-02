// Helper of this example: it shows site.html with site.css inside a frame of the chosen width.
// The frame has its own window, so the media queries of site.css see the frame's width.
// It uses fetch and async functions, which come later in the course: edit only site.html and site.css.
const stage = document.querySelector(".stage");
const frame = document.querySelector("#site");
const status = document.querySelector("#status");
const reduce = document.querySelector("#reduce");
let width = 960;

async function show() {
  const html = await (await fetch("./site.html")).text();
  const css = await (await fetch("./site.css")).text();
  const imitation = reduce.checked ? "<script>" + (await (await fetch("./reduce-motion.js")).text()) + "</script>" : "";
  frame.srcdoc = html.replace('<link rel="stylesheet" href="site.css">', "<style>" + css + "</style>").replace("</body>", imitation + "</body>");
  const scale = Math.min(1, stage.clientWidth / width);
  frame.style.width = width + "px";
  frame.style.transform = "scale(" + scale + ")";
  stage.style.height = Math.round(frame.offsetHeight * scale) + "px";
  status.textContent = "%%statusPrefix%% " + width + "px" + (scale < 1 ? " %%scaled%%" : "");
  for (const button of document.querySelectorAll("[data-width]")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.width) === width));
  }
}

for (const button of document.querySelectorAll("[data-width]")) {
  button.addEventListener("click", () => {
    width = Number(button.dataset.width);
    show();
  });
}
reduce.addEventListener("change", show);
show();
