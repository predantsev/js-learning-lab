import { createRoot } from "react-dom/client";
import HabitCard from "./HabitCard";
import { HABIT, TODAY } from "./habit-data";

createRoot(document.getElementById("root")).render(<HabitCard habit={HABIT} today={TODAY} />);
