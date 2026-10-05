// A simplified view of what assistive technology gets from the focused element:
// its name (from a label), whether it is marked invalid, and its description.
import { useEffect, useState } from "react";

function describe(element) {
  if (!element || element === document.body) return { tag: "body", name: "", invalid: false, description: "" };
  const label = element.id ? document.querySelector(`label[for="${element.id}"]`) : null;
  const name = element.getAttribute("aria-label") ?? label?.textContent ?? element.textContent;
  const description = (element.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
  return { tag: element.tagName.toLowerCase(), name: name.trim(), invalid: element.getAttribute("aria-invalid") === "true", description };
}

export function FocusReport() {
  const [report, setReport] = useState(describe(document.activeElement));
  useEffect(() => {
    const update = () => setReport(describe(document.activeElement));
    // focusout fires before the next element gets focus, so read it a moment later
    const updateLater = () => setTimeout(update, 0);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", updateLater);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", updateLater);
    };
  }, []);
  return (
    <aside aria-label="%%reportLabel%%" style={{ borderTop: "1px solid dimgray", marginTop: "1rem" }}>
      <p>
        <strong>%%reportFocus%%</strong> {report.tag} «{report.name}»
        {report.invalid && <> · <strong>%%reportInvalid%%</strong></>}
      </p>
      <p>
        <strong>%%reportDescription%%</strong> {report.description || "—"}
      </p>
    </aside>
  );
}
