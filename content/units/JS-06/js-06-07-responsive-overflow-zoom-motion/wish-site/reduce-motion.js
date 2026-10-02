// Imitates the "reduce motion" setting inside the site frame: the rules of
// @media (prefers-reduced-motion: reduce) start to apply. The real setting lives in the
// operating system or in the developer tools (the Rendering panel).
for (const sheet of document.styleSheets) {
  for (const rule of sheet.cssRules) {
    if (rule.media && rule.media.mediaText.includes("prefers-reduced-motion")) {
      rule.media.mediaText = rule.media.mediaText
        .replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, "(min-width: 0px)")
        .replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, "(max-width: 0px)");
    }
  }
}
