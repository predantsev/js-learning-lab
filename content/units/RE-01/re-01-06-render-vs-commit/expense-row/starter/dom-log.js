// A helper for this lesson: it watches the DOM inside #root and reports every change React
// commits — changed text and added or removed elements — in the console, and outlines the
// changed element on the page for a moment. It does not change how React works.
const style = document.createElement("style");
style.textContent = ".dom-changed { outline: 3px solid darkorange; outline-offset: 2px; }";
document.head.append(style);

function describe(node) {
  return node.nodeType === Node.TEXT_NODE ? `"${node.data}"` : `<${node.nodeName.toLowerCase()}>`;
}
function flash(element) {
  if (!element) return;
  element.classList.add("dom-changed");
  setTimeout(() => element.classList.remove("dom-changed"), 1200);
}

export function watchCommits(container) {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") {
        console.log(`DOM: "${record.oldValue}" → "${record.target.data}"`);
        flash(record.target.parentElement);
      } else {
        for (const node of record.addedNodes) {
          console.log(`DOM: + ${describe(node)}`);
          flash(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
        }
        for (const node of record.removedNodes) console.log(`DOM: − ${describe(node)}`);
      }
    }
  });
  observer.observe(container, { childList: true, characterData: true, characterDataOldValue: true, subtree: true });
}
