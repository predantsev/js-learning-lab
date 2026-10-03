import { createRoot } from "react-dom/client";
import ItemList from "./ItemList";

const ITEMS = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
];

createRoot(document.getElementById("root")).render(<ItemList items={ITEMS} />);
