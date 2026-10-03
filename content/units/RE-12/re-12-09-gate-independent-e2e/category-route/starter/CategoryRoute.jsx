import CategoryPage from "./CategoryPage";
import { categoryPageOverride } from "./seam.js";

// The element of the route /categories/:id. It shows your CategoryPage.
export default function CategoryRoute() {
  const Page = categoryPageOverride.current ?? CategoryPage;
  return <Page />;
}
