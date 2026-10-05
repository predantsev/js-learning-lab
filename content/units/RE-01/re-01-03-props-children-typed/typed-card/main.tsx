import { createRoot } from "react-dom/client";
import { RecordCard } from "./RecordCard";

function App() {
  return (
    <main>
      <RecordCard name="%%headphones%%" price={80} category="%%tech%%" />
      <RecordCard name="%%lamp%%" price={45} category="%%home%%" />
      <RecordCard name="%%tickets%%" price={null} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
