// Prints what the attributes give a screen reader: every field's name, state and description,
// and the text of every live region. A small model of the accessibility tree, not the real one.
export function printA11yReport(root: HTMLElement): void {
  for (const field of root.querySelectorAll<HTMLInputElement>("input, select")) {
    const name = field.labels?.[0]?.textContent?.trim() ?? "";
    const described = (field.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ");
    const invalid = field.getAttribute("aria-invalid") === "true" ? ", %%invalidState%%" : "";
    console.log(`%%field%% «${name}»${invalid}${described ? ` — ${described}` : ""}`);
  }
  for (const region of root.querySelectorAll('[role="alert"], [role="status"], [aria-live]')) {
    console.log(`%%announced%%: ${region.textContent?.trim()}`);
  }
}
