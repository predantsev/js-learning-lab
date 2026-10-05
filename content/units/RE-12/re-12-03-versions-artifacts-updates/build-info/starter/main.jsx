import { createRoot } from "react-dom/client";
import BuildInfo from "./BuildInfo";
import { buildMeta } from "./buildMeta.js";

function PlannerPage() {
  return (
    <main>
      <h1>%%plannerTitle%%</h1>
      <ul>
        <li>%%taskRent%%</li>
        <li>%%taskBank%%</li>
      </ul>
      <BuildInfo version={buildMeta.version} commit={buildMeta.commit} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<PlannerPage />);
