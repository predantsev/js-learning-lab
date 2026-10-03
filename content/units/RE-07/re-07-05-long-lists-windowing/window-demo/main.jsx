import { createRoot } from "react-dom/client";
import App from "./App";
import { Measure } from "./profile";

createRoot(document.getElementById("root")).render(
  <Measure id="HabitPage">
    <App />
  </Measure>,
);
