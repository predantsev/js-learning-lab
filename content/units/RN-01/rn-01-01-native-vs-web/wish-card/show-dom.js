// Prints the DOM nodes that react-native-web committed for the preview, one element per line.
// Only the first CSS class of each element is shown; the rest are style classes.
export function logCommittedDom(container) {
  setTimeout(() => {
    const lines = [];
    const walk = (element, depth) => {
      const firstClass = element.classList[0] ?? '';
      const ownText = element.children.length === 0 ? ` "${element.textContent}"` : '';
      lines.push(`${'  '.repeat(depth)}<${element.tagName.toLowerCase()} class="${firstClass}…">${ownText}`);
      for (const child of element.children) walk(child, depth + 1);
    };
    for (const child of container.children) walk(child, 0);
    console.log(lines.join('\n'));
  }, 100);
}
