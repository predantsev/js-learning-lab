import { createRoot } from "react-dom/client";
import { CANNOT_CROSS, COMPONENTS, LABELS, PAGES, SECRETS } from "./review";

const show = (value) => (value === "" ? "—" : String(value));
const list = (values) => (Array.isArray(values) && values.length > 0 ? values.join(", ") : "—");

function Review() {
  return (
    <main>
      <h1>%%title%%</h1>
      <h2>%%pages%%</h2>
      <ul>
        {Object.entries(PAGES).map(([page, choice]) => (
          <li key={page}>
            <b>{page}</b>: {show(choice.strategy)} — {show(choice.why)}
          </li>
        ))}
      </ul>
      <h2>%%components%%</h2>
      <ul>
        {Object.entries(COMPONENTS).map(([name, side]) => (
          <li key={name}>
            {name}: {show(side)}
          </li>
        ))}
      </ul>
      <p>
        %%cannotCross%%: {list(CANNOT_CROSS)}
      </p>
      <p>
        %%secrets%%: {list(SECRETS)}
      </p>
      <h2>%%labels%%</h2>
      <ul>
        {Object.entries(LABELS).map(([api, label]) => (
          <li key={api}>
            {api}: {show(label)}
          </li>
        ))}
      </ul>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Review />);
